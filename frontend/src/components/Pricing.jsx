import { motion } from "framer-motion";
import { Home, ArrowUpDown, Sofa, Package, PlusCircle, Info } from "lucide-react";

const residential = [
  { label: "Hallway (standard length)", price: "$15" },
  { label: "Stairs (per flight, 10–15 steps)", price: "$30" },
  { label: "Upholstery (per seat, min 2 seats)", price: "$25" },
  { label: "Individual Room (average, standard soiling)", price: "From TBD" },
];

const endOfLease = [
  { label: "1BR + Lounge Apartment (~35 sqm)", price: "$130" },
  { label: "2BR + Lounge Apartment (~50 sqm)", price: "$160" },
  { label: "3BR + Lounge House (~75 sqm)", price: "$210" },
  { label: "4BR + Lounge House (~100 sqm)", price: "$260" },
  { label: "Additional Room (under package)", price: "$45" },
];

const addOns = [
  { label: "Add-on Item (per average room)", price: "+$30" },
  { label: "Pet Stain & Odour Treatment", price: "+$30/room" },
  { label: "Deodorising (premium scenting)", price: "+$15/room" },
  { label: "Rug Cleaning (standard area rug)", price: "From $60" },
  { label: "Mattress — Single", price: "$70" },
  { label: "Mattress — Double / Queen / King", price: "$100" },
];

const Row = ({ label, price }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-white/8 last:border-0">
    <span className="text-sm text-[#94A3B8] font-light">{label}</span>
    <span className="font-display font-bold text-sm text-[#4CC9F0] whitespace-nowrap">{price}</span>
  </div>
);

const cards = [
  { icon: Home, title: "Standard Residential", rows: residential, testid: "pricing-card-residential" },
  { icon: Package, title: "End of Lease Packages", rows: endOfLease, testid: "pricing-card-end-of-lease" },
  { icon: PlusCircle, title: "Add-On Services", rows: addOns, testid: "pricing-card-add-ons" },
];

const Pricing = () => (
  <section id="pricing" data-testid="pricing-section" className="relative py-28 lg:py-36">
    <div className="absolute top-1/4 left-0 w-[30rem] h-[30rem] rounded-full bg-[#00B4D8]/10 blur-[140px] pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl mb-14"
      >
        <p className="text-[#4CC9F0] text-sm font-semibold tracking-[0.35em] uppercase mb-4">
          Transparent Pricing
        </p>
        <h2
          data-testid="pricing-heading"
          className="font-display font-black text-3xl sm:text-4xl lg:text-5xl metallic-text tracking-tight"
        >
          Clear, Upfront Rates
        </h2>
        <p className="mt-6 text-base md:text-lg text-[#94A3B8] font-light leading-relaxed">
          No surprises — just honest pricing for a flawless deep clean across Canberra & Queanbeyan.
        </p>
      </motion.div>

      <motion.div
        data-testid="pricing-callout-fee"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="glass-panel rounded-2xl px-6 py-5 mb-10 flex items-center gap-4"
      >
        <span className="w-11 h-11 rounded-xl border border-[#4CC9F0]/40 bg-[#4CC9F0]/10 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-[#4CC9F0]" />
        </span>
        <p className="text-sm text-[#E0F2FE]">
          <span className="font-display font-bold text-[#4CC9F0]">Minimum call-out fee: $99</span>
          <span className="text-[#94A3B8]"> — applies as a base for any service call.</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {cards.map(({ icon: Icon, title, rows, testid }, i) => (
          <motion.div
            key={title}
            data-testid={testid}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="glass-panel neon-card rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-12 h-12 rounded-2xl border border-[#4CC9F0]/40 bg-[#4CC9F0]/10 flex items-center justify-center shadow-[0_0_18px_rgba(76,201,240,0.25)]">
                <Icon className="w-6 h-6 text-[#4CC9F0]" />
              </span>
              <h3 className="font-display font-bold text-lg metallic-text-sm">{title}</h3>
            </div>
            <div>
              {rows.map((r) => (
                <Row key={r.label} label={r.label} price={r.price} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-5">
        <a
          data-testid="pricing-book-button"
          href="#contact"
          className="neon-btn rounded-full px-9 py-4 text-sm font-bold text-[#04222e] tracking-widest uppercase inline-flex items-center gap-2"
        >
          <ArrowUpDown className="w-4 h-4" /> Get an Exact Quote
        </a>
        <a
          href="tel:0466429772"
          className="rounded-full px-9 py-4 text-sm font-bold tracking-widest uppercase border border-[#4CC9F0]/50 text-[#4CC9F0] hover:bg-[#4CC9F0]/10 transition-colors duration-300 inline-flex items-center gap-2"
        >
          <Sofa className="w-4 h-4" /> 0466 429 772
        </a>
      </div>
    </div>
  </section>
);

export default Pricing;
