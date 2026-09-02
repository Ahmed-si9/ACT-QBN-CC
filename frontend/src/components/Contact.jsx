import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

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
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/bookings`, form);
      toast.success("Booking request received! We'll confirm your clean shortly.");
      setForm({
        name: "",
        phone: "",
        email: "",
        service: serviceOptions[0],
        preferred_date: "",
        message: "",
      });
    } catch (err) {
      toast.error("Could not submit your booking. Please call us on 0466 429 772.");
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
                value={form.preferred_date}
                onChange={update("preferred_date")}
                className="glow-input rounded-xl px-5 py-3.5 text-sm w-full [color-scheme:dark]"
              />
            </div>

            <textarea
              data-testid="booking-message-input"
              rows={4}
              placeholder="Tell us about your carpets — rooms, stains, pets..."
              value={form.message}
              onChange={update("message")}
              className="glow-input rounded-xl px-5 py-3.5 text-sm w-full resize-none"
            />

            <button
              data-testid="booking-submit-button"
              type="submit"
              disabled={submitting}
              className="neon-btn rounded-full w-full py-4 text-sm font-bold text-[#04222e] tracking-widest uppercase inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Request Booking
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
