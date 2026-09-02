import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, XCircle, Loader2, Droplets } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PaymentResult = ({ cancelled = false }) => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState(cancelled ? "cancelled" : "checking"); // checking|paid|failed|cancelled

  useEffect(() => {
    if (cancelled || !sessionId) return;
    let attempts = 0;
    let timer;
    const poll = async () => {
      try {
        const { data } = await axios.get(`${API}/payments/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setState("paid");
          return;
        }
        if (["expired", "failed"].includes(data.payment_status)) {
          setState("failed");
          return;
        }
      } catch {
        /* keep trying */
      }
      attempts += 1;
      if (attempts >= 8) {
        setState("failed");
        return;
      }
      timer = setTimeout(poll, 2000);
    };
    poll();
    return () => clearTimeout(timer);
  }, [sessionId, cancelled]);

  const content = {
    checking: {
      icon: <Loader2 className="w-14 h-14 text-[#4CC9F0] animate-spin" />,
      title: "Confirming your payment...",
      text: "Please wait a moment while we verify your transaction.",
    },
    paid: {
      icon: <CheckCircle2 className="w-14 h-14 text-emerald-400" />,
      title: "Payment Successful!",
      text: "Thank you — your booking is confirmed and paid. We'll be in touch to lock in your clean.",
    },
    failed: {
      icon: <XCircle className="w-14 h-14 text-rose-400" />,
      title: "Payment Not Completed",
      text: "We couldn't confirm your payment. Your booking is saved as unpaid — call us on 0466 429 772 or try again.",
    },
    cancelled: {
      icon: <XCircle className="w-14 h-14 text-amber-400" />,
      title: "Payment Cancelled",
      text: "No charge was made. Your booking request is saved as unpaid — you can pay on completion instead.",
    },
  }[state];

  return (
    <div className="min-h-screen bg-[#0B1320] text-[#E0F2FE] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#00B4D8]/15 blur-[130px] pointer-events-none" />
      <div data-testid="payment-result" data-state={state} className="glass-panel rounded-3xl p-10 w-full max-w-lg text-center relative">
        <div className="flex justify-center mb-6">{content.icon}</div>
        <h1 className="font-display font-black text-2xl metallic-text-sm mb-3">{content.title}</h1>
        <p className="text-sm text-[#94A3B8] leading-relaxed mb-8">{content.text}</p>
        <Link
          to="/"
          data-testid="payment-home-link"
          className="neon-btn rounded-full px-8 py-3.5 text-sm font-bold text-[#04222e] tracking-widest uppercase inline-flex items-center gap-2"
        >
          <Droplets className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default PaymentResult;
