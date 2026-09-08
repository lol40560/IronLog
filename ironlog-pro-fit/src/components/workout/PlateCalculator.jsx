import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { platesFor } from "@/lib/fitness";

const BAR_TYPES = {
  olympic: { label: "Olympic 20kg", weight: 20 },
  womens: { label: "Women's 15kg", weight: 15 },
  trap: { label: "Trap/Safety 25kg", weight: 25 },
  smith: { label: "Smith (offset)", weight: 0 },
};
const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export default function PlateCalculator({
  initialWeight = 60,
  barType = "olympic",
  onBarTypeChange,
  gymProfileId,
}) {
  const [weight, setWeight] = useState(initialWeight);
  const [inventory, setInventory] = useState(DEFAULT_PLATES);

  useEffect(() => {
    if (!gymProfileId) return;
    base44.entities.GymProfile
      .get(gymProfileId)
      .then((g) => {
        if (g?.plate_inventory?.length) setInventory(g.plate_inventory);
      })
      .catch(() => {});
  }, [gymProfileId]);

  const barWeight = BAR_TYPES[barType]?.weight ?? 20;
  const res = platesFor(Number(weight) || 0, barWeight, inventory);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(BAR_TYPES).map(([key, b]) => (
          <button
            key={key}
            onClick={() => onBarTypeChange?.(key)}
            className={`rounded-full px-3 py-1 text-xs ${
              barType === key ? "bg-lime-300 text-neutral-900" : "border border-white/10 text-neutral-400"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-lg outline-none"
      />
      {!res.perSide.length ? (
        <p className="text-sm text-neutral-500">Bar only — no plates needed.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Per side · bar {barWeight}kg
          </p>
          <div className="flex flex-wrap gap-2">
            {res.perSide.map((p) => (
              <span key={p.plate} className="rounded-lg bg-neutral-800 px-3 py-2 text-sm">
                {p.count} × {p.plate}kg
              </span>
            ))}
          </div>
          {res.leftover > 0 && (
            <p className="text-xs text-amber-300">
              {res.leftover}kg per side unmatched — add smaller plates to this gym's inventory.
            </p>
          )}
        </div>
      )}
    </div>
  );
}