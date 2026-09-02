import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Loader2, LogOut, Trash2, Check, CheckCheck, Ban,
  Mail, Phone, CalendarDays, Droplets, MessageSquare,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

const statusStyles = {
  new: "text-[#4CC9F0] border-[#4CC9F0]/50 bg-[#4CC9F0]/10",
  confirmed: "text-amber-300 border-amber-300/50 bg-amber-300/10",
  completed: "text-emerald-300 border-emerald-300/50 bg-emerald-300/10",
  cancelled: "text-rose-300 border-rose-300/50 bg-rose-300/10",
};

const AdminPage = () => {
  const [auth, setAuth] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("aq_admin_token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const authHeaders = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const { data } = await axios.get(`${API}/bookings`, authHeaders());
      setBookings(data);
    } catch {
      toast.error("Could not load bookings.");
    } finally {
      setLoadingBookings(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!token) {
      setAuth(false);
      return;
    }
    axios
      .get(`${API}/auth/me`, authHeaders())
      .then(({ data }) => {
        setAuth(data);
        loadBookings();
      })
      .catch(() => {
        localStorage.removeItem("aq_admin_token");
        setToken("");
        setAuth(false);
      });
  }, [token, authHeaders, loadBookings]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem("aq_admin_token", data.access_token);
      setToken(data.access_token);
      setAuth(data);
      toast.success(`Welcome back, ${data.name}.`);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await axios.post(`${API}/auth/logout`).catch(() => {});
    localStorage.removeItem("aq_admin_token");
    setToken("");
    setAuth(false);
    setBookings([]);
  };

  const setStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/bookings/${id}`, { status }, authHeaders());
      toast.success(`Booking marked as ${status}.`);
      loadBookings();
    } catch {
      toast.error("Could not update booking.");
    }
  };

  const removeBooking = async (id) => {
    try {
      await axios.delete(`${API}/bookings/${id}`, authHeaders());
      toast.success("Booking deleted.");
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error("Could not delete booking.");
    }
  };

  if (auth === null) {
    return (
      <div data-testid="admin-loading" className="min-h-screen bg-[#0B1320] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#4CC9F0] animate-spin" />
      </div>
    );
  }

  if (auth === false) {
    return (
      <div className="min-h-screen bg-[#0B1320] flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#00B4D8]/15 blur-[130px] pointer-events-none" />
        <form
          data-testid="admin-login-form"
          onSubmit={handleLogin}
          className="glass-panel rounded-3xl p-10 w-full max-w-md relative"
        >
          <div className="flex items-center gap-3 mb-8">
            <span className="w-11 h-11 rounded-full border border-[#4CC9F0]/60 flex items-center justify-center shadow-[0_0_16px_rgba(76,201,240,0.4)]">
              <Droplets className="w-5 h-5 text-[#4CC9F0]" />
            </span>
            <div>
              <h1 className="font-display font-extrabold text-xl metallic-text-sm">Admin Access</h1>
              <p className="text-xs text-[#94A3B8] tracking-widest uppercase">ACT QBN Carpet Cleaning</p>
            </div>
          </div>

          {error && (
            <p data-testid="admin-login-error" className="mb-5 text-sm text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <input
            data-testid="admin-email-input"
            type="email"
            required
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glow-input rounded-xl px-5 py-3.5 text-sm w-full mb-4"
          />
          <input
            data-testid="admin-password-input"
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glow-input rounded-xl px-5 py-3.5 text-sm w-full mb-6"
          />
          <button
            data-testid="admin-login-submit-button"
            type="submit"
            disabled={loggingIn}
            className="neon-btn rounded-full w-full py-3.5 text-sm font-bold text-[#04222e] tracking-widest uppercase inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  const counts = {
    new: bookings.filter((b) => b.status === "new").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-[#0B1320] text-[#E0F2FE] relative">
      <div className="absolute top-0 left-1/4 w-[26rem] h-[26rem] rounded-full bg-[#4CC9F0]/10 blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="font-display font-black text-3xl metallic-text tracking-tight">Booking Dashboard</h1>
            <p data-testid="admin-user-label" className="text-sm text-[#94A3B8] mt-2">Signed in as {auth.email}</p>
          </div>
          <button
            data-testid="admin-logout-button"
            onClick={handleLogout}
            className="rounded-full px-6 py-2.5 text-xs font-bold tracking-widest uppercase border border-[#4CC9F0]/50 text-[#4CC9F0] hover:bg-[#4CC9F0]/10 transition-colors duration-300 inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg">
          {[["new", counts.new], ["confirmed", counts.confirmed], ["completed", counts.completed]].map(([k, v]) => (
            <div key={k} data-testid={`admin-stat-${k}`} className="glass-panel rounded-2xl p-4 text-center">
              <p className="font-display font-black text-2xl metallic-text-sm">{v}</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#94A3B8] mt-1">{k}</p>
            </div>
          ))}
        </div>

        {loadingBookings ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#4CC9F0] animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <p data-testid="admin-bookings-empty" className="text-[#94A3B8] text-center py-20">No bookings yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((b) => (
              <div key={b.id} data-testid={`booking-card-${b.id}`} className="glass-panel rounded-3xl p-7">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-display font-bold text-lg metallic-text-sm">{b.name}</h3>
                    <p className="text-xs text-[#4CC9F0] uppercase tracking-[0.2em] mt-1">{b.service}</p>
                  </div>
                  <span
                    data-testid={`booking-status-${b.id}`}
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] border rounded-full px-3.5 py-1.5 ${statusStyles[b.status] || statusStyles.new}`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="space-y-2.5 text-sm text-[#94A3B8] mb-6">
                  <p className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-[#4CC9F0]" /> {b.phone}</p>
                  <p className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-[#4CC9F0]" /> {b.email}</p>
                  <p className="flex items-center gap-2.5"><CalendarDays className="w-4 h-4 text-[#4CC9F0]" /> {b.preferred_date || "No date specified"}</p>
                  {b.message && (
                    <p className="flex items-start gap-2.5"><MessageSquare className="w-4 h-4 text-[#4CC9F0] mt-0.5" /> {b.message}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {b.status === "new" && (
                    <button
                      data-testid={`booking-confirm-${b.id}`}
                      onClick={() => setStatus(b.id, "confirmed")}
                      className="rounded-full px-5 py-2 text-xs font-bold tracking-widest uppercase border border-amber-300/50 text-amber-300 hover:bg-amber-300/10 transition-colors duration-300 inline-flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirm
                    </button>
                  )}
                  {b.status === "confirmed" && (
                    <button
                      data-testid={`booking-complete-${b.id}`}
                      onClick={() => setStatus(b.id, "completed")}
                      className="rounded-full px-5 py-2 text-xs font-bold tracking-widest uppercase border border-emerald-300/50 text-emerald-300 hover:bg-emerald-300/10 transition-colors duration-300 inline-flex items-center gap-1.5"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Complete
                    </button>
                  )}
                  {(b.status === "new" || b.status === "confirmed") && (
                    <button
                      data-testid={`booking-cancel-${b.id}`}
                      onClick={() => setStatus(b.id, "cancelled")}
                      className="rounded-full px-5 py-2 text-xs font-bold tracking-widest uppercase border border-white/20 text-[#94A3B8] hover:bg-white/5 transition-colors duration-300 inline-flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                  <button
                    data-testid={`booking-delete-${b.id}`}
                    onClick={() => removeBooking(b.id)}
                    className="rounded-full px-5 py-2 text-xs font-bold tracking-widest uppercase border border-rose-400/40 text-rose-300 hover:bg-rose-400/10 transition-colors duration-300 inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
