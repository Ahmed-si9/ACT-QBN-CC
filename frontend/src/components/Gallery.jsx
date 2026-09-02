import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;

const resolveUrl = (url) => (url && url.startsWith("http") ? url : `${BACKEND}${url}`);

const Gallery = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios
      .get(`${API}/gallery`)
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]));
  }, []);

  return (
    <section id="gallery" data-testid="gallery-section" className="relative py-28 lg:py-36">
      <div className="absolute top-0 left-1/3 w-[28rem] h-[28rem] rounded-full bg-[#00B4D8]/10 blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mb-16"
        >
          <p className="text-[#4CC9F0] text-sm font-semibold tracking-[0.35em] uppercase mb-4">
            Our Work
          </p>
          <h2
            data-testid="gallery-heading"
            className="font-display font-black text-3xl sm:text-4xl lg:text-5xl metallic-text tracking-tight"
          >
            Transformations That Shine
          </h2>
          <p className="mt-6 text-base md:text-lg text-[#94A3B8] font-light leading-relaxed">
            Real results from real cleans — every job finished to a mirror-level standard.
          </p>
        </motion.div>

        {items.length === 0 ? (
          <p data-testid="gallery-empty" className="text-[#94A3B8] text-center py-16">
            Gallery photos coming soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item, i) => (
              <motion.figure
                key={item.id}
                data-testid={`gallery-item-${item.id}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
                className="group relative rounded-3xl overflow-hidden border border-white/10 hover:border-[#4CC9F0]/80 hover:shadow-[0_0_30px_rgba(76,201,240,0.35)] transition-[border-color,box-shadow] duration-300"
              >
                <img
                  src={resolveUrl(item.url)}
                  alt={item.label}
                  loading="lazy"
                  className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B1320] via-[#0B1320]/70 to-transparent p-6 pt-14">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4CC9F0] mb-1.5">
                    <Sparkles className="w-3 h-3" /> {item.tag}
                  </span>
                  <p className="font-display font-bold text-lg metallic-text-sm">{item.label}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
