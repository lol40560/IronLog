import React from "react";
import { Plus, Trash2 } from "lucide-react";

export default function PeriodizationEditor({ value, onChange }) {
  const period = value || { enabled: false, weeks: [] };
  const set = (patch) => onChange({ ...period, ...patch });
  const weeks = period.weeks && period.weeks.length ? period.weeks : [{ name: "Week 1", type: "normal", weight_pct: 100, reps_factor: 1, rpe: null }];
  const setWeek = (i, patch) => set({ weeks: weeks.map((w, j) => (j === i ? { ...w, ...patch } : w)) });

  return (
    <div className="rounded-2xl bg-neutral-900/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Periodization</p>
        <button
          onClick={() => set({ enabled: !period.enabled })}
          className={`rounded-full px-3 py-1 text-xs ${period.enabled ? "bg-lime-300 text-neutral-900" : "border border-white/10 text-neutral-400"}`}
        >
          {period.enabled ? "On" : "Off"}
        </button>
      </div>
      {period.enabled && (
        <div className="mt-3 space-y-2">
          {weeks.map((wk, i) => (
            <div key={i} className="rounded-xl bg-neutral-800/70 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={wk.name || `Week ${i + 1}`}
                  onChange={(e) => setWeek(i, { name: e.target.value })}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button
                  onClick={() => setWeek(i, { type: wk.type === "deload" ? "normal" : "deload" })}
                  className={`rounded-full px-2 py-0.5 text-[10px] ${wk.type === "deload" ? "bg-amber-400 text-neutral-900" : "border border-white/10 text-neutral-400"}`}
                >
                  {wk.type === "deload" ? "Deload" : "Normal"}
                </button>
                <button onClick={() => set({ weeks: weeks.filter((_, j) => j !== i) })} className="text-neutral-600 hover:text-rose-400">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-neutral-400">
                <label>Load %<input type="number" value={wk.weight_pct ?? 100} onChange={(e) => setWeek(i, { weight_pct: Number(e.target.value) })} className="mt-1 w-full rounded-lg bg-neutral-800 px-2 py-1 text-center text-neutral-100 outline-none" /></label>
                <label>Rep factor<input type="number" step="0.1" value={wk.reps_factor ?? 1} onChange={(e) => setWeek(i, { reps_factor: Number(e.target.value) })} className="mt-1 w-full rounded-lg bg-neutral-800 px-2 py-1 text-center text-neutral-100 outline-none" /></label>
                <label>RPE<input type="number" value={wk.rpe ?? ""} onChange={(e) => setWeek(i, { rpe: e.target.value ? Number(e.target.value) : null })} className="mt-1 w-full rounded-lg bg-neutral-800 px-2 py-1 text-center text-neutral-100 outline-none" /></label>
              </div>
            </div>
          ))}
          <button
            onClick={() => set({ weeks: [...weeks, { name: `Week ${weeks.length + 1}`, type: "normal", weight_pct: 100, reps_factor: 1, rpe: null }] })}
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-white/10 py-2 text-xs text-neutral-400"
          >
            <Plus className="h-3 w-3" /> Add week
          </button>
        </div>
      )}
    </div>
  );
}