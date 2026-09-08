import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, sub, accent = "lime" }) {
  const accents = {
    lime: "text-lime-300",
    sky: "text-sky-300",
    violet: "text-violet-300",
    amber: "text-amber-300",
  };
  return (
    <div className="rounded-2xl bg-neutral-900/70 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{label}</span>
        {Icon && <Icon className={cn("h-4 w-4", accents[accent])} />}
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-neutral-500">{sub}</p>}
    </div>
  );
}