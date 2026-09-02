import { motion } from "framer-motion";
import { Droplets, Wind, Sofa, Sparkles, KeyRound, ShieldCheck } from "lucide-react";

const services = [
  {
    icon: Droplets,
    title: "Carpet Steam Cleaning",
    desc: "High-temperature deep extraction that lifts embedded dirt, allergens and odours from every fibre.",
    testid: "service-card-carpet-steam",
  },
  {
    icon: Wind,
    title: "Rug Cleaning",
    desc: "Delicate yet powerful care for Persian, wool and synthetic rugs — restored to showroom brilliance.",
    testid: "service-card-rug",
  },
  {
    icon: Sofa,
    title: "Upholstery Cleaning",
    desc: "Sofas, lounges and chairs refreshed with fabric-safe steam and rapid-dry technology.",
    testid: "service-card-upholstery",
  },
  {
    icon: Sparkles,
    title: "Stain & Spot Removal",
    desc: "Targeted treatment for wine, coffee, pet and high-traffic stains with professional-grade solutions.",
    testid: "service-card-stain-removal",
  },
  {
    icon: KeyRound,
    title: "End of Lease Cleaning",
    desc: "Bond-back carpet cleans that meet real-estate inspection standards, guaranteed documentation included.",
    testid: "service-card-end-of-lease",
  },
  {
    icon: ShieldCheck,
    title: "Carpet Protection",
    desc: "Invisible protective shield that repels future spills and keeps your carpets cleaner for longer.",
    testid: "service-card-protection",
  },
];

const Services = () => (
  <section id="services" data-testid="services-section" className="relative py-28 lg:py-36">
    <div className="absolute top-1/4 right-0 w-[30rem] h-[30rem] rounded-full bg-[#00B4D8]/10 blur-[140px] pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl mb-16"
      >
        <p className="text-[#4CC9F0] text-sm font-semibold tracking-[0.35em] uppercase mb-4">
          What We Do
        </p>
        <h2
          data-testid="services-heading"
          className="font-display font-black text-3xl sm:text-4xl lg:text-5xl metallic-text tracking-tight"
        >
          Precision Cleaning Services
        </h2>
        <p className="mt-6 text-base md:text-lg text-[#94A3B8] font-light leading-relaxed">
          Every service engineered for a flawless, deep-clean finish — powered by
          commercial steam extraction and eco-safe chemistry.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map(({ icon: Icon, title, desc, testid }, i) => (
          <motion.div
            key={title}
            data-testid={testid}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="glass-panel neon-card rounded-3xl p-8 cursor-default"
          >
            <div className="w-14 h-14 rounded-2xl border border-[#4CC9F0]/40 bg-[#4CC9F0]/10 flex items-center justify-center mb-7 shadow-[0_0_18px_rgba(76,201,240,0.25)]">
              <Icon className="w-7 h-7 text-[#4CC9F0]" />
            </div>
            <h3 className="font-display font-bold text-xl metallic-text-sm mb-3">{title}</h3>
            <p className="text-sm text-[#94A3B8] font-light leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Services;
