import React, { useState } from "react";
import { warmupPlan } from "@/lib/fitness";

export default function WarmupCalculator({ initialWeight = 100 }) {
  const [weight, setWeight] = useState(initialWeight);
  const plan = warmupPlan(Number(weight) || 0);

  return (
    <div className="space-y-4">
      <input
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-lg outline-none"
        placeholder="Working weight"
      />
      <div className="space-y-2">
        {plan.map((s) => (
          <div key={s.pct} className="flex items-center justify-between rounded-xl bg-neutral-800/60 px-4 py-3">
            <span className="text-xs text-neutral-400">{s.pct}%</span>
            <span className="font-mono text-lg">{s.weight} kg</span>
            <span className="text-xs text-neutral-400">× {s.reps}</span>
          </div>
        ))}
      </div>
    </div>
  );
}