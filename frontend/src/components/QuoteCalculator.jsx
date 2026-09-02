import { useState, useEffect, useCallback } from "react";
import { Calculator, Minus, Plus } from "lucide-react";

const MIN_CALLOUT = 99;

const PACKAGES = [
  { key: "", label: "No package", price: 0 },
  { key: "1BR + Lounge", label: "1BR + Lounge (~35 sqm)", price: 130 },
  { key: "2BR + Lounge", label: "2BR + Lounge (~50 sqm)", price: 160 },
  { key: "3BR + Lounge", label: "3BR + Lounge (~75 sqm)", price: 210 },
  { key: "4BR + Lounge", label: "4BR + Lounge (~100 sqm)", price: 260 },
];

const RESIDENTIAL = [
  { key: "hallway", label: "Hallway", unit: "$15", price: 15 },
  { key: "stairs", label: "Stairs (per flight)", unit: "$30", price: 30 },
  { key: "upholstery", label: "Upholstery (per seat, min 2)", unit: "$25", price: 25 },
];

const ADDONS = [
  { key: "addonRoom", label: "Add-on item (per room)", unit: "+$30", price: 30 },
  { key: "petTreatment", label: "Pet stain & odour (per room)", unit: "+$30", price: 30 },
  { key: "deodorising", label: "Deodorising (per room)", unit: "+$15", price: 15 },
  { key: "rug", label: "Rug cleaning (per rug)", unit: "from $60", price: 60 },
  { key: "mattressSingle", label: "Mattress — Single", unit: "$70", price: 70 },
  { key: "mattressDouble", label: "Mattress — Double/Queen/King", unit: "$100", price: 100 },
];

const Stepper = ({ testid, label, unit, value, onChange }) => (
  <div className="flex items-center justify-between gap-3 py-2.5">
    <div className="min-w-0">
      <p className="text-sm text-[#E0F2FE] truncate">{label}</p>
      <p className="text-[11px] text-[#4CC9F0]">{unit}</p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        data-testid={`${testid}-minus`}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-lg border border-white/15 text-[#E0F2FE] hover:border-[#4CC9F0]/70 hover:bg-[#4CC9F0]/10 flex items-center justify-center transition-colors"
        aria-label={`decrease ${label}`}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span data-testid={`${testid}-value`} className="w-7 text-center text-sm font-bold text-white">{value}</span>
      <button
        type="button"
        data-testid={`${testid}-plus`}
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-lg border border-white/15 text-[#E0F2FE] hover:border-[#4CC9F0]/70 hover:bg-[#4CC9F0]/10 flex items-center justify-center transition-colors"
        aria-label={`increase ${label}`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

const QuoteCalculator = ({ onChange }) => {
  const [pkg, setPkg] = useState("");
  const [extraRooms, setExtraRooms] = useState(0);
  const [qty, setQty] = useState({
    hallway: 0, stairs: 0, upholstery: 0,
    addonRoom: 0, petTreatment: 0, deodorising: 0,
    rug: 0, mattressSingle: 0, mattressDouble: 0,
  });

  const set = (key) => (v) => setQty((q) => ({ ...q, [key]: v }));

  const compute = useCallback(() => {
    const lines = [];
    let subtotal = 0;

    const pkgObj = PACKAGES.find((p) => p.key === pkg);
    if (pkgObj && pkgObj.price > 0) {
      subtotal += pkgObj.price;
      lines.push(`${pkgObj.key} package $${pkgObj.price}`);
      if (extraRooms > 0) {
        const c = extraRooms * 45;
        subtotal += c;
        lines.push(`${extraRooms} extra room${extraRooms > 1 ? "s" : ""} $${c}`);
      }
    }

    RESIDENTIAL.forEach(({ key, label, price }) => {
      let count = qty[key];
      if (count > 0) {
        if (key === "upholstery" && count < 2) count = 2; // min 2 seats
        const c = count * price;
        subtotal += c;
        lines.push(`${label} x${count} $${c}`);
      }
    });

    ADDONS.forEach(({ key, label, price }) => {
      const count = qty[key];
      if (count > 0) {
        const c = count * price;
        subtotal += c;
        lines.push(`${label} x${count} $${c}`);
      }
    });

    const hasItems = subtotal > 0;
    const total = hasItems ? Math.max(subtotal, MIN_CALLOUT) : 0;
    const minApplied = hasItems && subtotal < MIN_CALLOUT;
    const summary = hasItems
      ? `${lines.join("; ")}${minApplied ? ` (min call-out $${MIN_CALLOUT} applied)` : ""} — Est. total $${total}`
      : "";
    return { subtotal, total, summary, hasItems, minApplied };
  }, [pkg, extraRooms, qty]);

  const { subtotal, total, summary, hasItems, minApplied } = compute();

  useEffect(() => {
    onChange && onChange({ quote_summary: summary || null, quote_total: total || null });
  }, [summary, total, onChange]);

  return (
    <div data-testid="quote-calculator" className="rounded-2xl border border-[#4CC9F0]/20 bg-[#4CC9F0]/[0.03] p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Calculator className="w-5 h-5 text-[#4CC9F0]" />
        <h4 className="font-display font-bold text-base text-[#E0F2FE]">Instant Quote Estimator <span className="text-[#94A3B8] font-normal text-xs">(optional)</span></h4>
      </div>

      <div className="mb-5">
        <label className="block text-xs uppercase tracking-[0.2em] text-[#94A3B8] mb-2">End of Lease Package</label>
        <select
          data-testid="quote-package-select"
          value={pkg}
          onChange={(e) => setPkg(e.target.value)}
          className="glow-input rounded-xl px-4 py-3 text-sm w-full"
        >
          {PACKAGES.map((p) => (
            <option key={p.key || "none"} value={p.key}>{p.label}{p.price ? ` — $${p.price}` : ""}</option>
          ))}
        </select>
        {pkg && (
          <div className="mt-3">
            <Stepper testid="quote-extra-rooms" label="Additional rooms (under package)" unit="$45 each" value={extraRooms} onChange={setExtraRooms} />
          </div>
        )}
      </div>

      <div className="mb-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[#94A3B8] mb-1">Standard Residential</p>
        <div className="divide-y divide-white/8">
          {RESIDENTIAL.map((r) => (
            <Stepper key={r.key} testid={`quote-${r.key}`} label={r.label} unit={r.unit} value={qty[r.key]} onChange={set(r.key)} />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#94A3B8] mb-1 mt-3">Add-ons</p>
        <div className="divide-y divide-white/8">
          {ADDONS.map((a) => (
            <Stepper key={a.key} testid={`quote-${a.key}`} label={a.label} unit={a.unit} value={qty[a.key]} onChange={set(a.key)} />
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-[#0B1320]/60 border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#94A3B8]">Estimated Total</span>
          <span data-testid="quote-total" className="font-display font-black text-2xl text-[#4CC9F0]">
            ${total}
          </span>
        </div>
        {minApplied && (
          <p className="mt-1 text-[11px] text-[#94A3B8]">Subtotal ${subtotal} — minimum call-out fee of ${MIN_CALLOUT} applied.</p>
        )}
        {!hasItems && (
          <p className="mt-1 text-[11px] text-[#94A3B8]">Select items above to see your estimate. Room pricing may vary by size — we confirm on the day.</p>
        )}
      </div>
    </div>
  );
};

export default QuoteCalculator;
