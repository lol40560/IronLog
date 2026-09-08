import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Check, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExerciseCard from "@/components/workout/ExerciseCard";
import ExercisePicker from "@/components/workout/ExercisePicker";
import RestTimer from "@/components/workout/RestTimer";
import {
  epley1RM,
  workoutVolume,
  formatClock,
  isFreeWeight,
  inGym,
  effectiveLoad,
} from "@/lib/fitness";
import { usePro } from "@/lib/usePro";

export default function ActiveWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPro } = usePro();
  const [workout, setWorkout] = useState(null);
  const [history, setHistory] = useState([]);
  const [exerciseMap, setExerciseMap] = useState({});
  const [bodyweight, setBodyweight] = useState(0);
  const [picker, setPicker] = useState(false);
  const [rest, setRest] = useState(null);
  const [pr, setPr] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const refs = useRef({});

  useEffect(() => {
    base44.entities.Workout.get(id).then((w) => {
      setWorkout(w);
      setElapsed(Math.floor((Date.now() - new Date(w.date).getTime()) / 1000));
    });
    base44.entities.Workout.filter({ status: "completed" }, "-date", 50).then(setHistory);
    base44.entities.Exercise.list().then((list) =>
      setExerciseMap(Object.fromEntries(list.map((e) => [e.name, e])))
    );
    base44.entities.BodyMeasurement.filter({}, "-date", 1).then((bm) =>
      setBodyweight(bm[0]?.weight_kg || 0)
    );
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!pr) return;
    const t = setTimeout(() => setPr(null), 4000);
    return () => clearTimeout(t);
  }, [pr]);

  if (!workout) return <p className="text-neutral-500">Loading…</p>;

  const save = async (next) => {
    setWorkout(next);
    await base44.entities.Workout.update(id, { exercises: next.exercises, notes: next.notes });
  };

  // Free-weight movements use global history; machine/cable/etc. are scoped to the active gym.
  const scopedHistory = (name) => {
    const eq = exerciseMap[name]?.equipment;
    return isFreeWeight(eq)
      ? history
      : history.filter((w) => inGym(w, workout.gym_profile_id));
  };

  const previousFor = (name) => {
    for (const w of scopedHistory(name)) {
      const ex = (w.exercises || []).find((e) => e.exercise_name === name);
      if (ex) return ex.sets || [];
    }
    return [];
  };

  const bestFor = (name) => {
    const ex = exerciseMap[name];
    const assisted = ex?.mechanics_type === "assisted";
    let maxWeight = 0,
      max1rm = 0,
      maxReps = 0,
      maxEffective = 0;
    scopedHistory(name).forEach((w) =>
      (w.exercises || []).forEach((e) => {
        if (e.exercise_name !== name) return;
        (e.sets || []).forEach((s) => {
          if (!s.completed || s.type === "warmup") return;
          maxWeight = Math.max(maxWeight, s.weight || 0);
          maxReps = Math.max(maxReps, s.reps || 0);
          const load = assisted ? effectiveLoad(bodyweight, s.weight) : s.weight;
          max1rm = Math.max(max1rm, epley1RM(load, s.reps));
          maxEffective = Math.max(maxEffective, load);
        });
      })
    );
    return { maxWeight, max1rm, maxReps, maxEffective, assisted };
  };

  const handleSetCompleted = ({ exercise, set, index }) => {
    setRest({ seconds: exercise.rest_seconds || 120, key: Date.now() });
    const best = bestFor(exercise.exercise_name);
    if (set.weight && set.reps) {
      if (best.assisted) {
        const eff = effectiveLoad(bodyweight, set.weight);
        if (best.maxEffective && eff > best.maxEffective)
          setPr(`New effective load on ${exercise.exercise_name}: ${eff} kg`);
      } else {
        const e1 = epley1RM(set.weight, set.reps);
        if (best.max1rm && e1 > best.max1rm)
          setPr(`New estimated 1RM on ${exercise.exercise_name}: ${e1} kg`);
        else if (best.maxWeight && set.weight > best.maxWeight)
          setPr(`New max weight on ${exercise.exercise_name}: ${set.weight} kg`);
      }
    }
    if (exercise.group_type === "superset" || exercise.group_type === "circuit") {
      const next = workout.exercises[index + 1];
      if (next) refs.current[index + 1]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const finish = async () => {
    await base44.entities.Workout.update(id, {
      status: "completed",
      duration_seconds: elapsed,
      total_volume: workoutVolume(workout),
      exercises: workout.exercises,
      notes: workout.notes,
    });
    navigate("/");
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <input
            value={workout.name}
            onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
            onBlur={(e) => base44.entities.Workout.update(id, { name: e.target.value })}
            className="bg-transparent text-3xl font-light tracking-tight outline-none"
          />
          <p className="mt-1 font-mono text-sm text-lime-300">{formatClock(elapsed)}</p>
        </div>
        <button
          onClick={finish}
          className="flex items-center gap-1 rounded-full bg-lime-300 px-4 py-2 text-sm font-medium text-neutral-900"
        >
          <Check className="h-4 w-4" /> Finish
        </button>
      </header>

      <textarea
        value={workout.notes || ""}
        onChange={(e) => setWorkout({ ...workout, notes: e.target.value })}
        onBlur={() => save(workout)}
        placeholder="Session notes…"
        rows={2}
        className="w-full rounded-2xl bg-neutral-900/70 p-4 text-sm outline-none"
      />

      <div className="space-y-4">
        {(workout.exercises || []).map((ex, i) => (
          <ExerciseCard
            key={i}
            index={i}
            exercise={ex}
            meta={exerciseMap[ex.exercise_name]}
            bodyweight={bodyweight}
            pro={isPro}
            gymProfileId={workout.gym_profile_id}
            cardRef={(el) => (refs.current[i] = el)}
            previousSets={previousFor(ex.exercise_name)}
            onSetCompleted={handleSetCompleted}
            onRemove={() =>
              save({ ...workout, exercises: workout.exercises.filter((_, j) => j !== i) })
            }
            onChange={(nx) =>
              save({ ...workout, exercises: workout.exercises.map((o, j) => (j === i ? nx : o)) })
            }
          />
        ))}
      </div>

      <button
        onClick={() => setPicker(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-4 text-sm text-neutral-300"
      >
        <Plus className="h-4 w-4" /> Add exercise
      </button>

      <ExercisePicker
        open={picker}
        onOpenChange={setPicker}
        onPick={(e) =>
          save({
            ...workout,
            exercises: [
              ...(workout.exercises || []),
              {
                exercise_name: e.name,
                primary_muscle: e.primary_muscle,
                group_type: "normal",
                rest_seconds: e.default_rest_seconds || 120,
                is_time_based: e.is_time_based,
                sets: [{ type: "normal", completed: false }],
              },
            ],
          })
        }
      />

      {rest && <RestTimer key={rest.key} seconds={rest.seconds} onDone={() => setRest(null)} />}

      <AnimatePresence>
        {pr && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed inset-x-0 top-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-lime-300 px-5 py-3 text-neutral-900 shadow-xl"
          >
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-medium">{pr}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}