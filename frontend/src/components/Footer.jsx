import { Droplets, Mail, Phone } from "lucide-react";

const Footer = () => (
  <footer data-testid="site-footer" className="relative border-t border-white/10 py-12">
    <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-full border border-[#4CC9F0]/60 flex items-center justify-center bg-[#0B1320]">
          <Droplets className="w-4 h-4 text-[#4CC9F0]" />
        </span>
        <span className="font-display font-extrabold tracking-wide metallic-text-sm">
          ACT QBN CARPET CLEANING
        </span>
      </div>

      <div className="flex items-center gap-8 text-sm text-[#94A3B8]">
        <a
          data-testid="footer-email-link"
          href="mailto:info@actabncarpetcleaning.com.au"
          className="flex items-center gap-2 hover:text-[#4CC9F0] transition-colors duration-300"
        >
          <Mail className="w-4 h-4" /> info@actabncarpetcleaning.com.au
        </a>
        <a
          data-testid="footer-phone-link"
          href="tel:0466429772"
          className="flex items-center gap-2 hover:text-[#4CC9F0] transition-colors duration-300"
        >
          <Phone className="w-4 h-4" /> 0466 429 772
        </a>
      </div>

      <p data-testid="footer-copyright" className="text-xs text-[#94A3B8]/70">
        © {new Date().getFullYear()} ACT QBN Carpet Cleaning. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
