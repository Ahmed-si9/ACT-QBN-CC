import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Loader2, LogOut, Trash2, Check, CheckCheck, Ban,
  Mail, Phone, CalendarDays, Droplets, MessageSquare, RefreshCw, Download, DollarSign, CreditCard, Image as ImageIcon, UploadCloud, CalendarCheck,
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
  const [view, setView] = useState("bookings"); // "bookings" | "gallery"
  const [gallery, setGallery] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadTag, setUploadTag] = useState("");

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

  const loadGallery = useCallback(async () => {
    setLoadingGallery(true);
    try {
      const { data } = await axios.get(`${API}/gallery`);
      setGallery(data);
    } catch {
      toast.error("Could not load gallery.");
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large (max 10MB).");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("label", uploadLabel);
    fd.append("tag", uploadTag);
    try {
      await axios.post(`${API}/gallery`, fd, {
        headers: { ...authHeaders().headers, "Content-Type": "multipart/form-data" },
      });
      toast.success("Image uploaded.");
      setUploadLabel("");
      setUploadTag("");
      loadGallery();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id) => {
    try {
      await axios.delete(`${API}/gallery/${id}`, authHeaders());
      setGallery((prev) => prev.filter((g) => g.id !== id));
      toast.success("Image deleted.");
    } catch {
      toast.error("Could not delete image.");
    }
  };

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

  useEffect(() => {
    if (auth && view === "gallery") loadGallery();
  }, [auth, view, loadGallery]);

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

  const exportCSV = () => {
    if (!bookings.length) {
      toast.error("No bookings to export.");
      return;
    }
    const headers = ["Name", "Phone", "Email", "Service", "Date", "Time", "Est. Total", "Quote Details", "Payment Method", "Payment Status", "Message", "Status", "Created At"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = bookings.map((b) => [
      b.name, b.phone, b.email, b.service, b.preferred_date || "", b.preferred_time || "",
      b.quote_total != null ? `$${b.quote_total}` : "", b.quote_summary || "",
      b.payment_method === "online" ? "Pay Online" : "Pay on Completion",
      b.payment_status === "paid" ? "Paid" : "Unpaid",
      b.message || "", b.status, b.created_at ? new Date(b.created_at).toLocaleString() : "",
    ].map(esc).join(","));
    const csv = "\uFEFF" + [headers.map(esc).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `actqbn-bookings-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${bookings.length} booking${bookings.length > 1 ? "s" : ""} to CSV.`);
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
            <h1 className="font-display font-black text-3xl metallic-text tracking-tight">{view === "gallery" ? "Gallery Manager" : "Booking Dashboard"}</h1>
            <p data-testid="admin-user-label" className="text-sm text-[#94A3B8] mt-2">Signed in as {auth.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {view === "bookings" && (
              <>
                <button
                  data-testid="admin-export-button"
                  onClick={exportCSV}
                  className="rounded-full px-6 py-2.5 text-xs font-bold tracking-widest uppercase border border-emerald-300/50 text-emerald-300 hover:bg-emerald-300/10 transition-colors duration-300 inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button
                  data-testid="admin-refresh-button"
                  onClick={loadBookings}
                  disabled={loadingBookings}
                  className="rounded-full px-6 py-2.5 text-xs font-bold tracking-widest uppercase border border-[#4CC9F0]/50 text-[#4CC9F0] hover:bg-[#4CC9F0]/10 transition-colors duration-300 inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingBookings ? "animate-spin" : ""}`} /> Refresh
                </button>
              </>
            )}
            <button
              data-testid="admin-logout-button"
              onClick={handleLogout}
              className="rounded-full px-6 py-2.5 text-xs font-bold tracking-widest uppercase border border-white/20 text-[#94A3B8] hover:bg-white/5 transition-colors duration-300 inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-10">
          <button
            data-testid="admin-tab-bookings"
            onClick={() => setView("bookings")}
            className={`rounded-full px-6 py-2.5 text-xs font-bold tracking-widest uppercase inline-flex items-center gap-2 transition-colors duration-300 border ${
              view === "bookings" ? "border-[#4CC9F0] bg-[#4CC9F0]/15 text-[#4CC9F0]" : "border-white/15 text-[#94A3B8] hover:border-[#4CC9F0]/50"
            }`}
          >
            <CalendarCheck className="w-4 h-4" /> Bookings
          </button>
          <button
            data-testid="admin-tab-gallery"
            onClick={() => setView("gallery")}
            className={`rounded-full px-6 py-2.5 text-xs font-bold tracking-widest uppercase inline-flex items-center gap-2 transition-colors duration-300 border ${
              view === "gallery" ? "border-[#4CC9F0] bg-[#4CC9F0]/15 text-[#4CC9F0]" : "border-white/15 text-[#94A3B8] hover:border-[#4CC9F0]/50"
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Gallery
          </button>
        </div>

        {view === "gallery" ? (
          <div data-testid="admin-gallery-manager">
            <div className="glass-panel rounded-3xl p-7 mb-8">
              <div className="flex items-center gap-2.5 mb-5">
                <UploadCloud className="w-5 h-5 text-[#4CC9F0]" />
                <h3 className="font-display font-bold text-lg metallic-text-sm">Upload a Photo</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <input
                  data-testid="gallery-upload-label"
                  type="text"
                  placeholder="Caption / label (optional)"
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  className="glow-input rounded-xl px-5 py-3.5 text-sm w-full"
                />
                <input
                  data-testid="gallery-upload-tag"
                  type="text"
                  placeholder="Tag e.g. After Deep Clean (optional)"
                  value={uploadTag}
                  onChange={(e) => setUploadTag(e.target.value)}
                  className="glow-input rounded-xl px-5 py-3.5 text-sm w-full"
                />
              </div>
              <label
                data-testid="gallery-upload-button"
                className={`neon-btn rounded-full px-8 py-3.5 text-sm font-bold text-[#04222e] tracking-widest uppercase inline-flex items-center gap-2 cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Choose Image"}
                <input
                  data-testid="gallery-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={uploadImage}
                  disabled={uploading}
                />
              </label>
              <p className="mt-3 text-xs text-[#94A3B8]">JPG, PNG, WEBP or GIF · up to 10MB. Appears on the public gallery instantly.</p>
            </div>

            {loadingGallery ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#4CC9F0] animate-spin" /></div>
            ) : gallery.length === 0 ? (
              <p data-testid="admin-gallery-empty" className="text-[#94A3B8] text-center py-16">No photos yet. Upload your first one above.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.map((g) => (
                  <div key={g.id} data-testid={`gallery-admin-item-${g.id}`} className="group relative rounded-2xl overflow-hidden border border-white/10">
                    <img
                      src={g.url && g.url.startsWith("http") ? g.url : `${process.env.REACT_APP_BACKEND_URL}${g.url}`}
                      alt={g.label}
                      className="w-full h-52 object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B1320] to-transparent p-4 pt-10">
                      <p className="text-xs text-[#4CC9F0] uppercase tracking-[0.15em]">{g.tag}</p>
                      <p className="font-display font-bold text-sm text-[#E0F2FE] truncate">{g.label}</p>
                    </div>
                    <button
                      data-testid={`gallery-delete-${g.id}`}
                      onClick={() => deleteImage(g.id)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#0B1320]/80 border border-rose-400/50 text-rose-300 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                      aria-label="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <>
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
                  <div className="flex flex-col items-end gap-2">
                    <span
                      data-testid={`booking-status-${b.id}`}
                      className={`text-[10px] font-bold uppercase tracking-[0.2em] border rounded-full px-3.5 py-1.5 ${statusStyles[b.status] || statusStyles.new}`}
                    >
                      {b.status}
                    </span>
                    <span
                      data-testid={`booking-payment-${b.id}`}
                      className={`text-[10px] font-bold uppercase tracking-[0.2em] border rounded-full px-3.5 py-1.5 ${
                        b.payment_status === "paid"
                          ? "text-emerald-300 border-emerald-300/50 bg-emerald-300/10"
                          : "text-amber-300 border-amber-300/50 bg-amber-300/10"
                      }`}
                    >
                      {b.payment_status === "paid" ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm text-[#94A3B8] mb-6">
                  <p className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-[#4CC9F0]" /> {b.phone}</p>
                  <p className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-[#4CC9F0]" /> {b.email}</p>
                  <p className="flex items-center gap-2.5"><CreditCard className="w-4 h-4 text-[#4CC9F0]" /> {b.payment_method === "online" ? "Pay Online (Card / Apple Pay)" : "Pay on Completion (Cash / EFTPOS)"}</p>
                  <p className="flex items-center gap-2.5"><CalendarDays className="w-4 h-4 text-[#4CC9F0]" /> {b.preferred_date || "No date specified"}{b.preferred_time ? ` · ${b.preferred_time}` : ""}</p>
                  {b.quote_total != null && (
                    <p data-testid={`booking-quote-${b.id}`} className="flex items-start gap-2.5">
                      <DollarSign className="w-4 h-4 text-emerald-300 mt-0.5" />
                      <span>
                        <span className="font-display font-bold text-emerald-300">Est. ${b.quote_total}</span>
                        {b.quote_summary ? <span className="block text-xs text-[#94A3B8] mt-0.5">{b.quote_summary}</span> : null}
                      </span>
                    </p>
                  )}
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
        </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
