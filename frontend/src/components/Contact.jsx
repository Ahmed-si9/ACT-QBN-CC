import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Loader2, CreditCard, Banknote } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import QuoteCalculator from "@/components/QuoteCalculator";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EMAIL = "info@actabncarpetcleaning.com.au";
const PHONE = "0466 429 772";

const serviceOptions = [
  "Carpet Steam Cleaning",
  "Rug Cleaning",
  "Upholstery Cleaning",
  "Stain & Spot Removal",
  "End of Lease Cleaning",
  "Carpet Protection",
];

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: serviceOptions[0],
    preferred_date: "",
    preferred_time: "",
    payment_method: "on_completion",
    payment_choice: "cash_eftpos",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState([]);
  const [takenSlots, setTakenSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const quoteRef = useRef({ quote_summary: null, quote_total: null });

  const handleQuoteChange = useCallback((q) => {
    quoteRef.current = q;
  }, []);

  const today = new Date().toISOString().split("T")[0];

  // Fetch available time slots whenever the chosen date changes.
  useEffect(() => {
    if (!form.preferred_date) {
      setSlots([]);
      setTakenSlots([]);
      return;
    }
    let active = true;
    setLoadingSlots(true);
    axios
      .get(`${API}/availability`, { params: { date: form.preferred_date } })
      .then(({ data }) => {
        if (!active) return;
        setSlots(data.slots || []);
        setTakenSlots(data.taken || []);
        // Clear the selected time if it just became unavailable.
        setForm((f) =>
          f.preferred_time && (data.taken || []).includes(f.preferred_time)
            ? { ...f, preferred_time: "" }
            : f
        );
      })
      .catch(() => {
        if (active) {
          setSlots([]);
          setTakenSlots([]);
        }
      })
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [form.preferred_date]);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.preferred_date && !form.preferred_time) {
      toast.error("Please choose an available time slot for your selected day.");
      return;
    }
    const quote = quoteRef.current;
    if (form.payment_method === "online" && !(quote.quote_total > 0)) {
      toast.error("To pay online, add items to the quote estimator so we know the amount. Or choose Pay on Completion.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: booking } = await axios.post(`${API}/bookings`, { ...form, ...quote });

      if (form.payment_method === "online") {
        const { data } = await axios.post(`${API}/payments/checkout`, {
          booking_id: booking.id,
          origin_url: window.location.origin,
        });
        window.location.href = data.checkout_url; // redirect to Stripe
        return;
      }

      toast.success("Booking request received! We'll confirm your clean shortly.");
      setForm({
        name: "",
        phone: "",
        email: "",
        service: serviceOptions[0],
        preferred_date: "",
        preferred_time: "",
        payment_method: "on_completion",
        payment_choice: "cash_eftpos",
        message: "",
      });
      setSlots([]);
      setTakenSlots([]);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Could not submit your booking. Please call us on 0466 429 772.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" data-testid="contact-section" className="relative py-28 lg:py-36">
      <div className="absolute bottom-0 left-0 w-[32rem] h-[32rem] rounded-full bg-[#4CC9F0]/10 blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mb-16"
        >
          <p className="text-[#4CC9F0] text-sm font-semibold tracking-[0.35em] uppercase mb-4">
            Get In Touch
          </p>
          <h2
            data-testid="contact-heading"
            className="font-display font-black text-3xl sm:text-4xl lg:text-5xl metallic-text tracking-tight"
          >
            Book Your Clean
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <p className="text-base md:text-lg text-[#94A3B8] font-light leading-relaxed max-w-md">
              Reach out directly or send a booking request — we respond fast and
              lock in a time that suits you.
            </p>

            <a
              data-testid="contact-email-link"
              href={`mailto:${EMAIL}`}
              className="glass-panel neon-card rounded-3xl p-7 flex items-center gap-5 group"
            >
              <span className="w-14 h-14 rounded-2xl border border-[#4CC9F0]/40 bg-[#4CC9F0]/10 flex items-center justify-center shadow-[0_0_18px_rgba(76,201,240,0.25)]">
                <Mail className="w-6 h-6 text-[#4CC9F0]" />
              </span>
              <span>
                <span className="block text-xs uppercase tracking-[0.25em] text-[#94A3B8] mb-1">Email Us</span>
                <span className="font-display font-bold text-base md:text-lg metallic-text-sm group-hover:text-[#4CC9F0] transition-colors duration-300">
                  {EMAIL}
                </span>
              </span>
            </a>

            <a
              data-testid="contact-phone-link"
              href="tel:0466429772"
              className="glass-panel neon-card rounded-3xl p-7 flex items-center gap-5 group"
            >
              <span className="w-14 h-14 rounded-2xl border border-[#4CC9F0]/40 bg-[#4CC9F0]/10 flex items-center justify-center shadow-[0_0_18px_rgba(76,201,240,0.25)]">
                <Phone className="w-6 h-6 text-[#4CC9F0]" />
              </span>
              <span>
                <span className="block text-xs uppercase tracking-[0.25em] text-[#94A3B8] mb-1">Call Us</span>
                <span className="font-display font-bold text-base md:text-lg metallic-text-sm group-hover:text-[#4CC9F0] transition-colors duration-300">
                  {PHONE}
                </span>
              </span>
            </a>

            <div
              data-testid="contact-location-card"
              className="glass-panel rounded-3xl p-7 flex items-center gap-5"
            >
              <span className="w-14 h-14 rounded-2xl border border-[#4CC9F0]/40 bg-[#4CC9F0]/10 flex items-center justify-center shadow-[0_0_18px_rgba(76,201,240,0.25)]">
                <MapPin className="w-6 h-6 text-[#4CC9F0]" />
              </span>
              <span>
                <span className="block text-xs uppercase tracking-[0.25em] text-[#94A3B8] mb-1">Service Area</span>
                <span className="font-display font-bold text-base md:text-lg metallic-text-sm">
                  Canberra ACT & Queanbeyan NSW
                </span>
              </span>
            </div>
          </motion.div>

          <motion.form
            data-testid="booking-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8 }}
            className="glass-panel rounded-3xl p-8 lg:p-10 space-y-5"
          >
            <h3 className="font-display font-bold text-2xl metallic-text-sm mb-2">
              Request a Booking
            </h3>

            <div className="grid sm:grid-cols-2 gap-5">
              <input
                data-testid="booking-name-input"
                type="text"
                required
                minLength={2}
                placeholder="Full Name"
                value={form.name}
                onChange={update("name")}
                className="glow-input rounded-xl px-5 py-3.5 text-sm w-full"
              />
              <input
                data-testid="booking-phone-input"
                type="tel"
                required
                minLength={6}
                placeholder="Phone Number"
                value={form.phone}
                onChange={update("phone")}
                className="glow-input rounded-xl px-5 py-3.5 text-sm w-full"
              />
            </div>

            <input
              data-testid="booking-email-input"
              type="email"
              required
              placeholder="Email Address"
              value={form.email}
              onChange={update("email")}
              className="glow-input rounded-xl px-5 py-3.5 text-sm w-full"
            />

            <div className="grid sm:grid-cols-2 gap-5">
              <select
                data-testid="booking-service-select"
                value={form.service}
                onChange={update("service")}
                className="glow-input rounded-xl px-5 py-3.5 text-sm w-full"
              >
                {serviceOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                data-testid="booking-date-input"
                type="date"
                min={today}
                value={form.preferred_date}
                onChange={update("preferred_date")}
                className="glow-input rounded-xl px-5 py-3.5 text-sm w-full [color-scheme:dark]"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#94A3B8] mb-3">
                {!form.preferred_date
                  ? "Select a day to see available times"
                  : loadingSlots
                  ? "Checking availability..."
                  : "Choose an available time"}
              </p>
              <div data-testid="booking-time-slots" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.map((s) => {
                  const taken = takenSlots.includes(s);
                  const selected = form.preferred_time === s;
                  const base =
                    "rounded-xl px-3 py-3 text-sm font-medium border transition-colors duration-200 flex flex-col items-center justify-center gap-0.5";
                  let cls;
                  if (taken) {
                    cls = "border-rose-500/50 bg-rose-500/10 text-rose-300 cursor-not-allowed";
                  } else if (selected) {
                    cls = "border-[#4CC9F0] bg-[#4CC9F0]/20 text-white shadow-[0_0_18px_rgba(76,201,240,0.35)]";
                  } else {
                    cls = "border-white/15 text-[#E0F2FE] hover:border-[#4CC9F0]/70 hover:bg-[#4CC9F0]/5";
                  }
                  return (
                    <button
                      key={s}
                      type="button"
                      data-testid={`time-slot-${s.replace(/[^0-9]/g, "")}`}
                      disabled={taken}
                      aria-pressed={selected}
                      onClick={() => setForm((f) => ({ ...f, preferred_time: s }))}
                      className={`${base} ${cls}`}
                    >
                      <span>{s}</span>
                      {taken && (
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-rose-400">
                          Fully Booked
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {form.preferred_date && !loadingSlots && slots.length > 0 && (
                <p className="mt-3 text-xs text-[#94A3B8]">
                  {slots.length - takenSlots.length} of {slots.length} time slots available on this day.
                </p>
              )}
            </div>

            <textarea
              data-testid="booking-message-input"
              rows={4}
              placeholder="Tell us about your carpets — rooms, stains, pets..."
              value={form.message}
              onChange={update("message")}
              className="glow-input rounded-xl px-5 py-3.5 text-sm w-full resize-none"
            />

            <QuoteCalculator onChange={handleQuoteChange} />

            <div data-testid="payment-method-block">
              <p className="text-xs uppercase tracking-[0.25em] text-[#94A3B8] mb-3">Payment Method</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  data-testid="payment-online-option"
                  onClick={() => setForm((f) => ({ ...f, payment_method: "online", payment_choice: "card_applepay" }))}
                  aria-pressed={form.payment_method === "online"}
                  className={`text-left rounded-2xl border p-5 transition-colors duration-200 ${
                    form.payment_method === "online"
                      ? "border-[#4CC9F0] bg-[#4CC9F0]/10 shadow-[0_0_18px_rgba(76,201,240,0.3)]"
                      : "border-white/15 hover:border-[#4CC9F0]/60"
                  }`}
                >
                  <span className="flex items-center gap-2 font-display font-bold text-sm text-[#E0F2FE]">
                    <CreditCard className="w-4 h-4 text-[#4CC9F0]" /> Pay Online Now
                  </span>
                  <span className="block text-xs text-[#94A3B8] mt-1.5">Card · Apple Pay · secure Stripe checkout</span>
                </button>
                <button
                  type="button"
                  data-testid="payment-on-completion-option"
                  onClick={() => setForm((f) => ({ ...f, payment_method: "on_completion", payment_choice: "cash_eftpos" }))}
                  aria-pressed={form.payment_method === "on_completion"}
                  className={`text-left rounded-2xl border p-5 transition-colors duration-200 ${
                    form.payment_method === "on_completion"
                      ? "border-[#4CC9F0] bg-[#4CC9F0]/10 shadow-[0_0_18px_rgba(76,201,240,0.3)]"
                      : "border-white/15 hover:border-[#4CC9F0]/60"
                  }`}
                >
                  <span className="flex items-center gap-2 font-display font-bold text-sm text-[#E0F2FE]">
                    <Banknote className="w-4 h-4 text-[#4CC9F0]" /> Pay on Completion
                  </span>
                  <span className="block text-xs text-[#94A3B8] mt-1.5">Cash · EFTPOS after the clean</span>
                </button>
              </div>
              {form.payment_method === "online" && (
                <p className="mt-3 text-xs text-[#94A3B8]">
                  You'll be redirected to Stripe's secure checkout to pay your estimated total after submitting.
                </p>
              )}
            </div>

            <button
              data-testid="booking-submit-button"
              type="submit"
              disabled={submitting}
              className="neon-btn rounded-full w-full py-4 text-sm font-bold text-[#04222e] tracking-widest uppercase inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {form.payment_method === "online" ? "Redirecting to payment..." : "Sending..."}
                </>
              ) : (
                <>
                  {form.payment_method === "online" ? <CreditCard className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {form.payment_method === "online" ? "Book & Pay Online" : "Request Booking"}
                </>
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
