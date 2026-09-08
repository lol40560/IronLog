import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { format, startOfWeek, subWeeks, isAfter } from "date-fns";
import { Dumbbell, TrendingUp, Layers, Flame, Activity } from "lucide-react";
import { epley1RM, setVolume, workoutVolume } from "@/lib/fitness";
import StatCard from "@/components/analytics/StatCard";
import { ChartTooltip, axisProps } from "@/components/analytics/chartParts";
import MuscleHeatmap from "@/components/analytics/MuscleHeatmap";

const RANGES = [
  { key: "4w", label: "4W", weeks: 4 },
  { key: "12w", label: "12W", weeks: 12 },
  { key: "all", label: "All", weeks: 0 },
];

const MUSCLE_COLORS = {
  chest: "#bef264", back: "#7dd3fc", shoulders: "#c4b5fd", biceps: "#fcd34d",
  triceps: "#f9a8d4", quads: "#fdba74", hamstrings: "#86efac", glutes: "#fda4af",
  calves: "#67e8f9", core: "#ddd6fe", full_body: "#fde68a", cardio: "#fca5a5",
};

export default function Analytics() {
  const [workouts, setWorkouts] = useState([]);
  const [exercise, setExercise] = useState("");
  const [range, setRange] = useState("4w");

  useEffect(() => {
    base44.entities.Workout.filter({ status: "completed" }, "date", 200).then(setWorkouts);
  }, []);

  const filtered = useMemo(() => {
    const r = RANGES.find((x) => x.key === range);
    if (!r.weeks) return workouts;
    const cutoff = subWeeks(new Date(), r.weeks);
    return workouts.filter((w) => isAfter(new Date(w.date), cutoff));
  }, [workouts, range]);

  const names = useMemo(
    () => [...new Set(workouts.flatMap((w) => (w.exercises || []).map((e) => e.exercise_name)))].sort(),
    [workouts]
  );
  useEffect(() => { if (!exercise && names.length) setExercise(names[0]); }, [names, exercise]);

  const stats = useMemo(() => {
    const totalVol = filtered.reduce((t, w) => t + workoutVolume(w), 0);
    const sessions = filtered.length;
    const avgVol = sessions ? Math.round(totalVol / sessions) : 0;
    const totalSets = filtered.reduce(
      (t, w) => t + (w.exercises || []).reduce((a, e) => a + (e.sets || []).filter((s) => s.completed).length, 0), 0
    );
    let prs = 0;
    const bestByEx = {};
    workouts.forEach((w) => (w.exercises || []).forEach((e) => {
      (e.sets || []).filter((s) => s.completed).forEach((s) => {
        const est = epley1RM(s.weight, s.reps);
        if (est > (bestByEx[e.exercise_name] || 0)) {
          if (bestByEx[e.exercise_name]) prs += 1;
          bestByEx[e.exercise_name] = est;
        }
      });
    }));
    return { totalVol, sessions, avgVol, totalSets, prs };
  }, [filtered, workouts]);

  const weekly = useMemo(() => {
    const map = {};
    filtered.forEach((w) => {
      const k = format(startOfWeek(new Date(w.date)), "d MMM");
      map[k] = map[k] || { week: k, volume: 0, sets: 0 };
      (w.exercises || []).forEach((e) => (e.sets || []).forEach((s) => {
        map[k].volume += setVolume(s);
        if (s.completed) map[k].sets += 1;
      }));
    });
    return Object.values(map).sort((a, b) => new Date(a.week) - new Date(b.week));
  }, [filtered]);

  const muscles = useMemo(() => {
    const map = {};
    filtered.forEach((w) => (w.exercises || []).forEach((e) => {
      const done = (e.sets || []).filter((s) => s.completed).length;
      if (!done) return;
      const m = e.primary_muscle || "other";
      map[m] = (map[m] || 0) + done;
    }));
    return Object.entries(map)
      .map(([muscle, sets]) => ({ muscle, sets }))
      .sort((a, b) => b.sets - a.sets);
  }, [filtered]);

  const maxMuscle = Math.max(1, ...muscles.map((m) => m.sets));

  const progress = useMemo(() => {
    return workouts
      .map((w) => {
        const ex = (w.exercises || []).find((e) => e.exercise_name === exercise);
        if (!ex) return null;
        const best = (ex.sets || []).filter((s) => s.completed).reduce((a, s) => Math.max(a, epley1RM(s.weight, s.reps)), 0);
        return best ? { date: format(new Date(w.date), "d MMM"), e1rm: best } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [workouts, exercise]);

  const fmtVol = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-4xl font-light tracking-tight">Analytics</h1>
        <div className="flex gap-1 rounded-full bg-neutral-900 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                range === r.key ? "bg-lime-300 text-neutral-900" : "text-neutral-400"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <Activity className="h-8 w-8 text-neutral-600" />
          <p className="mt-4 text-sm text-neutral-400">No analytics yet</p>
          <p className="mt-1 text-xs text-neutral-600">Complete a workout to unlock your stats.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Dumbbell} label="Sessions" value={stats.sessions} sub="completed workouts" />
            <StatCard icon={TrendingUp} label="Total Volume" value={fmtVol(stats.totalVol)} sub="kg lifted" accent="sky" />
            <StatCard icon={Layers} label="Total Sets" value={stats.totalSets} sub="across all lifts" accent="violet" />
            <StatCard icon={Flame} label="PRs" value={stats.prs} sub="all-time estimates" accent="amber" />
          </div>

          <section className="rounded-2xl bg-neutral-900/70 p-4">
            <h2 className="mb-3 text-xs uppercase tracking-[0.25em] text-neutral-500">Weekly Volume</h2>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={weekly} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#bef264" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#bef264" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="week" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={fmtVol} />
                <Tooltip content={<ChartTooltip unit=" kg" />} />
                <Area type="monotone" dataKey="volume" stroke="#bef264" strokeWidth={2} fill="url(#volFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className="rounded-2xl bg-neutral-900/70 p-4">
            <h2 className="mb-3 text-xs uppercase tracking-[0.25em] text-neutral-500">Sets Per Muscle Group</h2>
            {muscles.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-600">No sets logged in this range.</p>
            ) : (
              <div className="space-y-2.5">
                {muscles.map((m) => (
                  <div key={m.muscle} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs capitalize text-neutral-400">{m.muscle.replace("_", " ")}</span>
                    <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(m.sets / maxMuscle) * 100}%`, background: MUSCLE_COLORS[m.muscle] || "#737373" }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-xs text-neutral-300">{m.sets}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <MuscleHeatmap workouts={filtered} />

          <section className="rounded-2xl bg-neutral-900/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xs uppercase tracking-[0.25em] text-neutral-500">Estimated 1RM</h2>
              <select
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                className="max-w-[55%] truncate rounded-lg bg-neutral-800 px-3 py-1.5 text-xs outline-none"
              >
                {names.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {progress.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-600">No data for {exercise} yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart data={progress} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                    <XAxis dataKey="date" {...axisProps} />
                    <YAxis {...axisProps} domain={["auto", "auto"]} />
                    <Tooltip content={<ChartTooltip unit=" kg" />} />
                    <Line type="monotone" dataKey="e1rm" stroke="#bef264" strokeWidth={2} dot={{ r: 3, fill: "#bef264" }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-neutral-500">Start: <span className="font-mono text-neutral-300">{progress[0]?.e1rm}kg</span></span>
                  <span className="text-neutral-500">Best: <span className="font-mono text-lime-300">{progress[progress.length - 1]?.e1rm}kg</span></span>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}