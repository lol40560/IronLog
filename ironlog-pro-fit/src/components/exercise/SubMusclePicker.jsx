import React from "react";
import { SUB_MUSCLE_GROUPS, ALL_SUB_MUSCLES } from "@/lib/muscleMap";

// Pro sub-muscle tagging for custom exercises: primary (single) + secondary (multi).
export default function SubMusclePicker({ primary, secondary = [], onChange }) {
  const sec = new Set(secondary || []);
  const toggleSec = (s) => {
    const next = new Set(sec);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChange({ primary, secondary: [...next] });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-400">Sub-muscle tagging (Pro)</p>
      <select
        value={primary || ""}
        onChange={(e) => onChange({ primary: e.target.value, secondary: [...sec] })}
        className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm capitalize outline-none"
      >
        <option value="">Primary sub-muscle…</option>
        {Object.entries(SUB_MUSCLE_GROUPS).map(([region, subs]) => (
          <optgroup key={region} label={region}>
            {subs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {ALL_SUB_MUSCLES.map((s) => {
          const isSec = sec.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleSec(s)}
              className={`rounded-full px-2.5 py-1 text-[11px] ${
                isSec
                  ? "border border-lime-300/40 text-lime-300"
                  : "border border-white/10 text-neutral-500"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-neutral-600">Tap tags to add as secondary; primary via the dropdown.</p>
    </div>
  );
}