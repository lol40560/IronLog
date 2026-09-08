import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Lock } from "lucide-react";
import { SUB_MUSCLE_GROUPS, subMuscleVolumes, heatColor } from "@/lib/muscleMap";
import { usePro } from "@/lib/usePro";

// Pro-gated granular muscle heatmap. Renders muted when locked.
export default function MuscleHeatmap({ workouts }) {
  const { isPro } = usePro();
  const [exerciseMap, setExerciseMap] = useState({});

  useEffect(() => {
    if (isPro)
      base44.entities.Exercise.list().then((list) =>
        setExerciseMap(Object.fromEntries(list.map((e) => [e.name, e])))
      );
  }, [isPro]);

  const volumes = useMemo(
    () => (isPro ? subMuscleVolumes(workouts, exerciseMap) : {}),
    [workouts, exerciseMap, isPro]
  );

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
        <Lock className="mx-auto h-5 w-5 text-lime-300" />
        <p className="mt-2 text-sm text-neutral-400">Granular muscle heatmap — Pro</p>
        <p className="mt-1 text-xs text-neutral-600">Tag sub-muscles on your exercises to unlock volume heatmaps.</p>
      </div>
    );
  }

  const hasData = Object.values(volumes).some((v) => v > 0);

  return (
    <section className="rounded-2xl bg-neutral-900/70 p-4">
      <h2 className="text-xs uppercase tracking-[0.25em] text-neutral-500">Sub-Muscle Heatmap</h2>
      <p className="mb-4 text-[11px] text-neutral-600">Working-set volume · primary ×1.0, secondary ×0.5</p>
      {!hasData ? (
        <p className="py-8 text-center text-xs text-neutral-600">No tagged sub-muscle volume in this range.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(SUB_MUSCLE_GROUPS).map(([region, subs]) => {
            const regionTotal = subs.reduce((t, s) => t + (volumes[s] || 0), 0);
            if (regionTotal === 0) return null;
            const maxSub = Math.max(1, ...subs.map((s) => volumes[s] || 0));
            return (
              <div key={region}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{region}</span>
                  <span className="font-mono text-[11px] text-neutral-500">{Math.round(regionTotal)} sets</span>
                </div>
                <div className="space-y-1.5">
                  {subs.map((s) => {
                    const v = volumes[s] || 0;
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <span className="w-36 shrink-0 truncate text-[11px] text-neutral-400">{s}</span>
                        <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-neutral-800">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(v / maxSub) * 100}%`, background: heatColor(v) }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-[11px]" style={{ color: v > 0 ? heatColor(v) : "#737373" }}>
                          {v > 0 ? Math.round(v) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-3 pt-1 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#262626" }} />0</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#a3e635" }} />1-5 low</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#22d3ee" }} />6-12 optimal</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#f97316" }} />13+ high</span>
          </div>
        </div>
      )}
    </section>
  );
}