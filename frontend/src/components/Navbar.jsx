import { useState } from "react";
import { Menu, X, Droplets } from "lucide-react";

const links = [
  { label: "Home", href: "#home", testid: "nav-home-link" },
  { label: "Services", href: "#services", testid: "nav-services-link" },
  { label: "Gallery", href: "#gallery", testid: "nav-gallery-link" },
  { label: "Reviews", href: "#reviews", testid: "nav-reviews-link" },
  { label: "Contact", href: "#contact", testid: "nav-contact-link" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav
      data-testid="main-navigation"
      className="fixed top-0 w-full z-50 glass-panel border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        <a href="#home" data-testid="nav-logo-link" className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full border border-[#4CC9F0]/60 flex items-center justify-center shadow-[0_0_16px_rgba(76,201,240,0.4)] bg-[#0B1320]">
            <Droplets className="w-5 h-5 text-[#4CC9F0]" />
          </span>
          <span className="font-display font-extrabold text-lg tracking-wide metallic-text-sm">
            ACT QBN <span className="text-[#4CC9F0]" style={{ WebkitTextFillColor: "#4CC9F0" }}>CARPET CLEANING</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.label}
              data-testid={l.testid}
              href={l.href}
              className="text-sm font-medium text-[#94A3B8] hover:text-[#4CC9F0] transition-colors duration-300 tracking-widest uppercase"
            >
              {l.label}
            </a>
          ))}
          <a
            data-testid="nav-book-now-button"
            href="#contact"
            className="neon-btn rounded-full px-7 py-2.5 text-sm font-bold text-[#04222e] tracking-widest uppercase"
          >
            Book Now
          </a>
        </div>

        <button
          data-testid="nav-mobile-menu-button"
          className="md:hidden text-[#E0F2FE]"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {open && (
        <div data-testid="nav-mobile-menu" className="md:hidden glass-panel border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l.label}
              data-testid={`nav-mobile-${l.label.toLowerCase()}-link`}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-base font-medium text-[#E0F2FE] hover:text-[#4CC9F0] transition-colors duration-300"
            >
              {l.label}
            </a>
          ))}
          <a
            data-testid="nav-mobile-book-now-button"
            href="#contact"
            onClick={() => setOpen(false)}
            className="neon-btn rounded-full px-7 py-3 text-sm font-bold text-[#04222e] text-center tracking-widest uppercase"
          >
            Book Now
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
