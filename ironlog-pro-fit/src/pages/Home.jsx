import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Play, Flame, Dumbbell } from "lucide-react";
import { format, isSameDay, subDays } from "date-fns";
import { workoutVolume, buildWorkoutExercises } from "@/lib/fitness";
import { usePro } from "@/lib/usePro";
import GymSwitcher from "@/components/workout/GymSwitcher";
import PaywallModal from "@/components/pro/PaywallModal";

export default function Home() {
  const { isPro } = usePro();
  const [workouts, setWorkouts] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [activeGym, setActiveGym] = useState(null);
  const [paywall, setPaywall] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Workout.filter({ status: "completed" }, "-date", 30).then(setWorkouts);
    base44.entities.Routine.list("-created_date", 10).then(setRoutines);
    if (isPro)
      base44.entities.GymProfile.list().then((g) => {
        const def = g.find((x) => x.is_default) || g[0] || null;
        if (def) setActiveGym(def);
      });
  }, [isPro]);

  const start = async (routine) => {
    let exercises = [];
    let weekIndex = 0;
    if (routine && (routine.exercises || []).length) {
      const history = workouts.length ? workouts : await base44.entities.Workout.filter({ status: "completed" }, "-date", 100);
      const prior = await base44.entities.Workout.filter({ routine_id: routine.id, status: "completed" }, "-date", 50);
      const built = buildWorkoutExercises(routine.exercises, history, prior.length, routine.periodization);
      exercises = built.exercises;
      weekIndex = built.weekIndex;
    }
    const w = await base44.entities.Workout.create({
      name: routine ? routine.name : "Quick workout",
      routine_id: routine?.id,
      date: new Date().toISOString(),
      status: "active",
      periodization_week: weekIndex,
      gym_profile_id: activeGym?.id || null,
      gym_profile_name: activeGym?.name || null,
      exercises,
    });
    navigate(`/workout/${w.id}`);
  };

  const days = Array.from({ length: 28 }, (_, i) => subDays(new Date(), 27 - i));
  const streak = (() => {
    let s = 0;
    for (let i = 0; i < 90; i++) {
      const d = subDays(new Date(), i);
      if (workouts.some((w) => isSameDay(new Date(w.date), d))) s++;
      else if (i > 0) break;
    }
    return s;
  })();

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{format(new Date(), "EEEE, d MMM")}</p>
        <h1 className="mt-2 text-4xl font-light tracking-tight">Train.</h1>
      </header>

      <GymSwitcher pro={isPro} value={activeGym} onChange={setActiveGym} onLocked={() => setPaywall(true)} />

      <button onClick={() => start(null)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 py-4 font-medium text-neutral-900">
        <Play className="h-4 w-4" /> Start empty workout
      </button>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.25em] text-neutral-500">Your routines</h2>
        {routines.length === 0 && <p className="text-sm text-neutral-500">No routines yet — <Link to="/routines" className="text-lime-300">create one</Link>.</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {routines.map((r) => (
            <button key={r.id} onClick={() => start(r)} className="rounded-2xl bg-neutral-900/70 p-4 text-left hover:bg-neutral-900">
              <p className="font-medium">{r.name}</p>
              <p className="mt-1 text-xs text-neutral-500">{(r.exercises || []).length} exercises · {r.folder}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-neutral-500">
          <Flame className="h-3 w-3 text-lime-300" /> Consistency · {streak} day streak
        </h2>
        <div className="grid grid-cols-14 gap-1" style={{ gridTemplateColumns: "repeat(14, minmax(0,1fr))" }}>
          {days.map((d) => {
            const on = workouts.some((w) => isSameDay(new Date(w.date), d));
            return <div key={d.toISOString()} className={`aspect-square rounded ${on ? "bg-lime-300" : "bg-neutral-800"}`} />;
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.25em] text-neutral-500">Recent sessions</h2>
        {workouts.slice(0, 6).map((w) => (
          <div key={w.id} className="flex items-center gap-3 rounded-2xl bg-neutral-900/70 p-4">
            <Dumbbell className="h-4 w-4 text-neutral-600" />
            <div className="flex-1">
              <p className="text-sm">{w.name}</p>
              <p className="text-xs text-neutral-500">{format(new Date(w.date), "d MMM")} · {(w.exercises || []).length} exercises</p>
            </div>
            <span className="font-mono text-sm text-lime-300">{Math.round(w.total_volume || workoutVolume(w))} kg</span>
          </div>
        ))}
        {!workouts.length && <p className="text-sm text-neutral-500">Your finished workouts will appear here.</p>}
      </section>

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="Gym profiles & contextual PRs" />
    </div>
  );
}