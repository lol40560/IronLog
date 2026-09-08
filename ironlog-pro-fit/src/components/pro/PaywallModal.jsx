import React, { useState } from "react";
import { Lock, X, Sparkles, Check } from "lucide-react";
import { startProCheckout } from "@/lib/checkout";

const TIERS = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$4.99",
    unit: "/ mo",
    note: "",
  },
  {
    id: "annual",
    label: "Annual",
    price: "$34.99",
    unit: "/ yr",
    note: "$2.92/mo",
    best: true,
  },
  {
    id: "lifetime",
    label: "Lifetime",
    price: "$99.99",
    unit: "",
    note: "One-time",
  },
];

const PERKS = [
  "Gym profiles & contextual PRs",
  "Assisted-counterweight engine",
  "Pinned technical cues",
  "Granular muscle heatmaps",
  "Custom barbell & plate inventory",
];

export default function PaywallModal({ open, onClose, feature }) {
  const [plan, setPlan] = useState("annual");
  const [loading, setLoading] = useState(false);
  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await startProCheckout(plan);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-lime-300" />
            <span className="text-xs uppercase tracking-[0.2em] text-lime-300">IronLog Pro</span>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="mt-4 text-xl font-light tracking-tight">
          {feature ? feature : "Pro"} unlocks everything below.
        </h3>

        <ul className="mt-3 space-y-1.5">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-xs text-neutral-300">
              <Check className="h-3 w-3 shrink-0 text-lime-300" />
              {p}
            </li>
          ))}
        </ul>

        {/* Pricing tiers */}
        <div className="mt-5 grid grid-cols-3 gap-0 rounded-2xl bg-neutral-900/70 p-1">
          {TIERS.map((t) => {
            const active = plan === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setPlan(t.id)}
                className={`relative flex flex-col items-center px-2 py-4 text-center transition ${
                  active ? "rounded-xl bg-neutral-800" : "rounded-xl hover:bg-neutral-800/50"
                }`}
              >
                {t.best && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-lime-300 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-neutral-900">
                    Best
                  </span>
                )}
                <span className="text-xs uppercase tracking-[0.15em] text-neutral-400">{t.label}</span>
                <span className="mt-2 text-2xl font-light text-neutral-600">$0</span>
                <div className="my-2 h-px w-full bg-neutral-700/60" />
                <span className="text-base font-medium text-white">
                  {t.price}
                  {t.unit && <span className="text-xs font-normal text-neutral-400"> {t.unit}</span>}
                </span>
                {t.note && <span className="mt-0.5 text-[10px] text-neutral-500">{t.note}</span>}
                {active && (
                  <span className="mt-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-lime-300">
                    <Check className="h-2.5 w-2.5 text-neutral-900" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-neutral-800/60 p-3 text-xs text-neutral-400">
          <Lock className="h-3.5 w-3.5 shrink-0 text-lime-300" />
          You'll be redirected to Stripe to securely complete your purchase.
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-lime-300 py-3 text-sm font-medium text-neutral-900 disabled:opacity-60"
        >
          {loading ? "Redirecting…" : `Upgrade with ${TIERS.find((t) => t.id === plan).label}`}
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-2xl border border-white/10 py-3 text-sm text-neutral-400"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}