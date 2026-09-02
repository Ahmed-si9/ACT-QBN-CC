import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "Michelle R.",
    suburb: "Belconnen, ACT",
    text: "My carpets look brand new. The team arrived on time, moved the furniture, and the stains I thought were permanent are completely gone.",
    testid: "review-card-michelle",
  },
  {
    name: "David T.",
    suburb: "Queanbeyan, NSW",
    text: "Booked an end of lease clean and got my full bond back. The real estate agent even asked who did the carpets. Incredible finish.",
    testid: "review-card-david",
  },
  {
    name: "Priya S.",
    suburb: "Gungahlin, ACT",
    text: "Two kids, one dog, and beige carpets — I didn't think they could be saved. The steam clean brought them back to life. Fast and professional.",
    testid: "review-card-priya",
  },
  {
    name: "Mark W.",
    suburb: "Tuggeranong, ACT",
    text: "The rug cleaning service is next level. My Persian rug came back brighter than the day I bought it. Worth every cent.",
    testid: "review-card-mark",
  },
];

const Reviews = () => (
  <section id="reviews" data-testid="reviews-section" className="relative py-28 lg:py-36">
    <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] rounded-full bg-[#4CC9F0]/10 blur-[150px] pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl mb-16"
      >
        <p className="text-[#4CC9F0] text-sm font-semibold tracking-[0.35em] uppercase mb-4">
          Client Love
        </p>
        <h2
          data-testid="reviews-heading"
          className="font-display font-black text-3xl sm:text-4xl lg:text-5xl metallic-text tracking-tight"
        >
          Trusted Across Canberra & Queanbeyan
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reviews.map((r, i) => (
          <motion.blockquote
            key={r.testid}
            data-testid={r.testid}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="glass-panel neon-card rounded-3xl p-8 relative"
          >
            <Quote className="absolute top-6 right-6 w-8 h-8 text-[#4CC9F0]/25" />
            <div className="flex gap-1 mb-5" aria-label="5 star rating">
              {[...Array(5)].map((_, s) => (
                <Star key={s} className="w-4 h-4 text-[#4CC9F0] fill-[#4CC9F0] drop-shadow-[0_0_6px_rgba(76,201,240,0.6)]" />
              ))}
            </div>
            <p className="text-base text-[#E0F2FE] font-light leading-relaxed mb-6">"{r.text}"</p>
            <footer>
              <p className="font-display font-bold metallic-text-sm">{r.name}</p>
              <p className="text-xs uppercase tracking-[0.25em] text-[#94A3B8] mt-1">{r.suburb}</p>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </div>
  </section>
);

export default Reviews;
