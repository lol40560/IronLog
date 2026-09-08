import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { leaderboardFor } from "@/lib/social";
import { Trophy } from "lucide-react";

export default function LeaderboardList({ me, followingIds }) {
  const [workouts, setWorkouts] = useState([]);
  const [exercise, setExercise] = useState("");
  const [scope, setScope] = useState("global");

  useEffect(() => {
    base44.entities.Workout.filter({ status: "completed" }, "date", 500).then(setWorkouts);
  }, []);

  const names = useMemo(
    () => [...new Set(workouts.flatMap((w) => (w.exercises || []).map((e) => e.exercise_name)))].sort(),
    [workouts]
  );
  useEffect(() => { if (!exercise && names.length) setExercise(names[0]); }, [names, exercise]);

  const ranking = useMemo(() => {
    if (!exercise) return [];
    let scopeIds = null;
    if (scope === "friends" && me) scopeIds = new Set([...followingIds, me.id]);
    return leaderboardFor(workouts, exercise, scopeIds);
  }, [workouts, exercise, scope, me, followingIds]);

  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-full bg-neutral-900 p-1">
        {["global", "friends"].map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`flex-1 rounded-full py-1.5 text-xs font-medium capitalize transition-colors ${
              scope === s ? "bg-lime-300 text-neutral-900" : "text-neutral-400"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <select
        value={exercise}
        onChange={(e) => setExercise(e.target.value)}
        className="w-full rounded-xl bg-neutral-900/70 px-4 py-3 text-sm outline-none"
      >
        {names.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>

      {ranking.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">No entries for {exercise} yet.</p>
      ) : (
        <div className="space-y-2">
          {ranking.map((r, i) => {
            const mine = me && r.id === me.id;
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  mine ? "border border-lime-300/40 bg-lime-300/5" : "bg-neutral-900/70"
                }`}
              >
                <span className="w-7 text-center font-mono text-sm">{medal(i)}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold">
                  {(r.name[0] || "?").toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.name}{mine && <span className="ml-1 text-xs text-lime-300">you</span>}</p>
                  {i === 0 && <p className="text-[11px] text-neutral-500 flex items-center gap-1"><Trophy className="h-3 w-3" /> top lift</p>}
                </div>
                <p className="font-mono text-lg text-lime-300">{r.best}<span className="text-xs text-neutral-500"> kg</span></p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}