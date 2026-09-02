from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import ipaddress
import logging
import uuid
import httpx
import bcrypt
import jwt
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
# Optional email config — booking alerts are sent only when these are set.
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "ACT QBN Carpet Cleaning")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL")

# --- Email guardrail gate (G2/G3) ---
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None) -> str | None:
    if not EMAIL_KEY or not to:
        logger.info("Email skipped — EMERGENT_EMAIL_KEY / recipient not configured.")
        return None
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    async with httpx.AsyncClient(timeout=30) as http:
        resp = await http.post(
            f"{EMAIL_BASE_URL}/api/v1/email/send",
            headers={"X-Email-Key": EMAIL_KEY},
            json=payload,
        )
    resp.raise_for_status()
    return resp.json().get("id")


# --- Auth helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "act-qbn-carpet-cleaning-dev-secret-change-me")


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def seed_admin():
    admin_email = "admin.actqbncc@gmail.com"
    admin_password = "mlpmlp652"

    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )


@app.on_event("startup")
async def startup():
    await seed_admin()
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")


# --- Models ---
class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: EmailStr
    service: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    message: Optional[str] = None
    status: str = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BookingCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=6, max_length=30)
    email: EmailStr
    service: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    message: Optional[str] = None


class StatusUpdate(BaseModel):
    status: Literal["new", "confirmed", "completed", "cancelled"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- Public routes ---
@api_router.get("/")
async def root():
    return {"message": "ACT QBN Carpet Cleaning API"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


# Business time slots offered to customers (local business hours).
TIME_SLOTS = [
    "08:00 - 10:00",
    "10:00 - 12:00",
    "12:00 - 14:00",
    "14:00 - 16:00",
    "16:00 - 18:00",
]

# Start/end hour of each slot (24h).
_SLOT_HOURS = {
    "08:00 - 10:00": (8, 10),
    "10:00 - 12:00": (10, 12),
    "12:00 - 14:00": (12, 14),
    "14:00 - 16:00": (14, 16),
    "16:00 - 18:00": (16, 18),
}

# Recurring business-blocked windows by weekday (Mon=0 .. Sun=6).
# A slot is blocked if it overlaps any window. Fri/Sat/Sun fully open.
_BLOCKED_WINDOWS = {
    0: [(10, 14)],   # Monday    10:00-14:00
    1: [(10, 17)],   # Tuesday   10:00-17:00
    2: [(0, 16)],    # Wednesday before 16:00 (only after 4pm open)
    3: [(10, 16)],   # Thursday  10:00-16:00
}


def _blocked_slots_for_date(date_str: str) -> list:
    """Slots blocked by recurring business rules for the given ISO date."""
    from datetime import date as _date
    try:
        wd = _date.fromisoformat(date_str).weekday()
    except (ValueError, TypeError):
        return []
    windows = _BLOCKED_WINDOWS.get(wd, [])
    blocked = []
    for slot in TIME_SLOTS:
        s, e = _SLOT_HOURS[slot]
        if any(s < we and e > ws for ws, we in windows):
            blocked.append(slot)
    return blocked


@api_router.get("/availability")
async def availability(date: str):
    """Public: returns slots and which are unavailable for a date.
    Unavailable = recurring business-blocked slots + slots already booked.
    No customer data is exposed."""
    blocked = _blocked_slots_for_date(date)
    taken_docs = await db.bookings.find(
        {"preferred_date": date, "status": {"$ne": "cancelled"}},
        {"_id": 0, "preferred_time": 1},
    ).to_list(500)
    booked = [d["preferred_time"] for d in taken_docs if d.get("preferred_time")]
    unavailable = [s for s in TIME_SLOTS if s in blocked or s in booked]
    return {
        "date": date,
        "slots": TIME_SLOTS,
        "taken": unavailable,      # all unavailable (shown as "Fully Booked")
        "blocked": blocked,        # blocked by business rule
        "booked": booked,          # taken by real bookings
        "available": [s for s in TIME_SLOTS if s not in unavailable],
    }


@api_router.post("/bookings", response_model=Booking, status_code=201)
async def create_booking(input: BookingCreate):
    booking = Booking(**input.model_dump())

    # Guard: never accept a time slot that is blocked or already booked.
    if booking.preferred_date and booking.preferred_time:
        if booking.preferred_time in _blocked_slots_for_date(booking.preferred_date):
            raise HTTPException(status_code=400, detail="That time slot is fully booked. Please choose another.")
        clash = await db.bookings.find_one({
            "preferred_date": booking.preferred_date,
            "preferred_time": booking.preferred_time,
            "status": {"$ne": "cancelled"},
        })
        if clash:
            raise HTTPException(status_code=400, detail="That time slot was just booked. Please choose another.")

    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.bookings.insert_one(doc)

    def row(label, value):
        return (f'<tr><td style="padding:8px 16px;color:#64748b;font-size:13px;vertical-align:top">{label}</td>'
                f'<td style="padding:8px 16px;color:#0f172a;font-size:14px">{value}</td></tr>')

    html = (
        '<table role="presentation" width="100%" style="background:#0B1320;padding:32px 0">'
        '<tr><td align="center"><table role="presentation" width="560" style="background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,sans-serif">'
        f'<tr><td style="background:#0B1320;padding:20px 24px;color:#4CC9F0;font-size:18px;font-weight:bold">New Booking Request — {escape(EMAIL_FROM_NAME)}</td></tr>'
        '<tr><td style="padding:16px 8px"><table role="presentation" width="100%">'
        + row("Name", escape(booking.name))
        + row("Phone", f'<a href="tel:{escape(booking.phone)}" style="color:#00B4D8">{escape(booking.phone)}</a>')
        + row("Email", f'<a href="mailto:{escape(booking.email)}" style="color:#00B4D8">{escape(booking.email)}</a>')
        + row("Service", escape(booking.service))
        + row("Preferred Date", escape(booking.preferred_date or "Not specified"))
        + row("Preferred Time", escape(booking.preferred_time or "Not specified"))
        + row("Message", escape(booking.message or "—"))
        + '</table></td></tr>'
        f'<tr><td style="padding:16px 24px;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0">Sent by {escape(EMAIL_FROM_NAME)} booking system. Reply to this email to contact the customer directly.</td></tr>'
        '</table></td></tr></table>'
    )
    try:
        await send_email(
            to=OWNER_EMAIL,
            subject=f"New Booking: {booking.service} — {booking.name}",
            html=html,
            reply_to=booking.email,
        )
    except Exception as e:
        logger.error(f"Booking notification email failed: {e}")
    return booking


# --- Admin routes ---
@api_router.get("/bookings", response_model=List[Booking])
async def list_bookings(user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for b in bookings:
        if isinstance(b.get('created_at'), str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
    return bookings


@api_router.patch("/bookings/{booking_id}", response_model=Booking)
async def update_booking_status(booking_id: str, input: StatusUpdate, user: dict = Depends(get_current_user)):
    result = await db.bookings.update_one({"id": booking_id}, {"$set": {"status": input.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    doc = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return Booking(**doc)


@api_router.delete("/bookings/{booking_id}", status_code=204)
async def delete_booking(booking_id: str, user: dict = Depends(get_current_user)):
    result = await db.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")


# --- Auth routes ---
@api_router.post("/auth/login")
async def login(input: LoginRequest, request: Request, response: Response):
    email = input.email.lower().strip()
    identifier = f"{request.client.host}:{email}"
    now = datetime.now(timezone.utc)
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > now:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in a few minutes.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (now + timedelta(minutes=15)).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    access_token = create_access_token(user["id"], email)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=create_refresh_token(user["id"]), httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"id": user["id"], "email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin"), "access_token": access_token}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"status": "logged_out"}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


app.include_router(api_router)

_frontend_origins = os.environ.get("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in _frontend_origins.split(",") if o.strip()] or ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
