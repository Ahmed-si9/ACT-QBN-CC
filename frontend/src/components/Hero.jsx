import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Clock, ArrowRight } from "lucide-react";

const LOGO_URL =
  "https://customer-assets-wrfwihn1.emergentagent.net/job_aedc905b-9e85-4994-a23e-dd891f78c4ec/artifacts/3493lwyi_IMG_4707.jpeg";

const sparkles = [
  { top: "12%", left: "18%", size: 6, delay: 0 },
  { top: "22%", left: "78%", size: 8, delay: 0.6 },
  { top: "58%", left: "10%", size: 5, delay: 1.2 },
  { top: "70%", left: "85%", size: 7, delay: 0.9 },
  { top: "40%", left: "92%", size: 4, delay: 1.8 },
  { top: "80%", left: "30%", size: 5, delay: 1.5 },
  { top: "8%", left: "55%", size: 4, delay: 2.1 },
];

const badges = [
  { icon: Sparkles, label: "Deep Steam Extraction" },
  { icon: ShieldCheck, label: "Fully Insured & Trusted" },
  { icon: Clock, label: "Same-Week Bookings" },
];

const Hero = () => (
  <section
    id="home"
    data-testid="hero-section"
    className="relative min-h-screen flex items-center overflow-hidden pt-20"
  >
    <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-[#00B4D8]/15 blur-[140px] pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-[38rem] h-[38rem] rounded-full bg-[#4CC9F0]/10 blur-[160px] pointer-events-none" />
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[50rem] h-[50rem] rounded-full border border-[#4CC9F0]/10 pointer-events-none" />

    {sparkles.map((s, i) => (
      <motion.span
        key={i}
        className="absolute rounded-full bg-[#4CC9F0] pointer-events-none"
        style={{
          top: s.top,
          left: s.left,
          width: s.size,
          height: s.size,
          boxShadow: "0 0 14px 3px rgba(76,201,240,0.8)",
        }}
        animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
      />
    ))}

    <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center w-full py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <p
          data-testid="hero-eyebrow"
          className="text-[#4CC9F0] text-sm font-semibold tracking-[0.35em] uppercase mb-6"
        >
          Canberra & Queanbeyan's Premium Clean
        </p>
        <h1
          data-testid="hero-heading"
          className="font-display font-black text-4xl sm:text-5xl lg:text-7xl leading-[1.02] tracking-tight metallic-text"
        >
          ACT QBN
          <br />
          CARPET
          <br />
          CLEANING
        </h1>
        <p
          data-testid="hero-subtext"
          className="mt-8 text-base md:text-lg text-[#94A3B8] font-light leading-relaxed max-w-xl"
        >
          Futuristic-grade steam cleaning for carpets, rugs and upholstery.
          Industrial extraction power, eco-safe solutions, and a finish so clean it glows.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-5">
          <a
            data-testid="hero-book-now-button"
            href="#contact"
            className="neon-btn rounded-full px-9 py-4 text-sm font-bold text-[#04222e] tracking-widest uppercase inline-flex items-center gap-2"
          >
            Book Your Clean <ArrowRight className="w-4 h-4" />
          </a>
          <a
            data-testid="hero-call-button"
            href="tel:0466429772"
            className="rounded-full px-9 py-4 text-sm font-bold tracking-widest uppercase border border-[#4CC9F0]/50 text-[#4CC9F0] hover:bg-[#4CC9F0]/10 hover:shadow-[0_0_24px_rgba(76,201,240,0.35)] transition-colors duration-300"
          >
            0466 429 772
          </a>
        </div>

        <div className="mt-14 flex flex-wrap gap-4">
          {badges.map(({ icon: Icon, label }) => (
            <div
              key={label}
              data-testid={`hero-badge-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="glass-panel rounded-full px-5 py-2.5 flex items-center gap-2.5"
            >
              <Icon className="w-4 h-4 text-[#4CC9F0]" />
              <span className="text-xs font-medium text-[#E0F2FE] tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        className="relative hidden lg:flex items-center justify-center"
      >
        <div className="absolute w-[26rem] h-[26rem] rounded-full bg-[#4CC9F0]/20 blur-[90px]" />
        <motion.div
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <img
            data-testid="hero-brand-logo"
            src={LOGO_URL}
            alt="ACT QBN Carpet Cleaning logo"
            className="w-[24rem] h-[24rem] rounded-full object-cover border-2 border-[#4CC9F0]/50 shadow-[0_0_70px_rgba(76,201,240,0.45)]"
          />
          <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
        </motion.div>
      </motion.div>
    </div>
  </section>
);

export default Hero;
