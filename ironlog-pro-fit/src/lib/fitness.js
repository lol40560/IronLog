// Shared training math helpers

export function epley1RM(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function warmupPlan(workingWeight) {
  if (!workingWeight) return [];
  const steps = [
    { pct: 0.4, reps: 8 },
    { pct: 0.6, reps: 5 },
    { pct: 0.75, reps: 3 },
    { pct: 0.9, reps: 1 },
  ];
  return steps.map((s) => ({
    pct: Math.round(s.pct * 100),
    reps: s.reps,
    weight: Math.round((workingWeight * s.pct) / 2.5) * 2.5,
  }));
}

export const BAR_WEIGHTS = { Barbell: 20, "EZ Bar": 10, Machine: 0 };
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export function platesFor(target, barWeight, inventory) {
  const perSide = (target - barWeight) / 2;
  if (perSide <= 0) return { perSide: [], leftover: 0, valid: target >= barWeight };
  let remaining = perSide;
  const result = [];
  const PL = (inventory && inventory.length ? inventory : PLATES).slice().sort((a, b) => b - a);
  for (const p of PL) {
    const count = Math.floor(remaining / p);
    if (count > 0) {
      result.push({ plate: p, count });
      remaining = Math.round((remaining - count * p) * 100) / 100;
    }
  }
  return { perSide: result, leftover: remaining, valid: true };
}

export function setVolume(s) {
  if (!s.completed || s.type === "warmup") return 0;
  return (s.weight || 0) * (s.reps || 0);
}

export function workoutVolume(workout) {
  return (workout.exercises || []).reduce(
    (t, ex) => t + (ex.sets || []).reduce((a, s) => a + setVolume(s), 0),
    0
  );
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

// --- Pro: Gym context & Assisted mechanics ---

export const FREE_WEIGHT_EQUIPMENT = ["barbell", "dumbbell", "bodyweight"];

export function isFreeWeight(equipment) {
  return FREE_WEIGHT_EQUIPMENT.includes(equipment);
}

// Include a workout in gym-scoped history. No gym selected -> include all (legacy).
export function inGym(workout, gymProfileId) {
  if (!gymProfileId) return true;
  return workout.gym_profile_id === gymProfileId;
}

// Assisted/counterweighted movements: logged weight is the assistance, not the load.
export function effectiveLoad(bodyweight, counterweight) {
  return Math.max(0, (bodyweight || 0) - (counterweight || 0));
}

// --- Dynamic %1RM & Auto-Progression ---

export function latest1RM(history, exerciseName) {
  let max = 0;
  for (const w of history || []) {
    for (const ex of w.exercises || []) {
      if (ex.exercise_name !== exerciseName) continue;
      for (const s of ex.sets || []) {
        if (!s.completed || s.type === "warmup") continue;
        max = Math.max(max, epley1RM(s.weight, s.reps));
      }
    }
  }
  return Math.round(max * 10) / 10;
}

export function roundToPlate(weight, step = 2.5) {
  return Math.round((weight || 0) / step) * step;
}

export function pickWeek(periodization, priorCount) {
  const weeks = periodization?.enabled ? periodization?.weeks : null;
  if (!weeks || !weeks.length) return { index: 0, week: { weight_pct: 100, reps_factor: 1 } };
  const index = Math.min(priorCount, weeks.length - 1);
  return { index, week: weeks[index] };
}

// Resolve a routine's exercises into concrete workout sets using latest 1RM
// and the active periodization week.
export function buildWorkoutExercises(routineExercises, history, priorCount, periodization) {
  const { index: weekIndex, week } = pickWeek(periodization, priorCount);
  const repsFactor = week.reps_factor ?? 1;
  const weightPct = (week.weight_pct ?? 100) / 100;

  const exercises = (routineExercises || []).map((e) => {
    const oneRm = e.load_type === "percent_1rm" ? latest1RM(history, e.exercise_name) : 0;
    const reps = Math.max(1, Math.round((e.target_reps || 0) * repsFactor));

    let loadNote = "";
    if (e.load_type === "percent_1rm") {
      loadNote = oneRm > 0
        ? `${e.weight_percent}% of ${oneRm} kg 1RM${weightPct !== 1 ? ` · wk ${weekIndex + 1}: ${Math.round(weightPct * 100)}%` : ""}`
        : `${e.weight_percent}% 1RM — log a max set first`;
    } else if (e.target_weight && weightPct !== 1) {
      loadNote = `${Math.round(weightPct * 100)}% of target`;
    }

    const sets = Array.from({ length: e.target_sets || 3 }, () => {
      let weight;
      if (e.load_type === "percent_1rm" && oneRm > 0) {
        const pct = (e.weight_percent ?? 0) / 100;
        weight = roundToPlate(oneRm * pct * weightPct);
      } else if (e.target_weight) {
        weight = roundToPlate(e.target_weight * weightPct);
      }
      return { type: "normal", weight, reps, completed: false };
    });

    return {
      exercise_name: e.exercise_name,
      primary_muscle: e.primary_muscle,
      group_type: e.group_type || "normal",
      rest_seconds: e.rest_seconds || 120,
      is_time_based: e.is_time_based,
      load_note: loadNote,
      sets,
    };
  });

  return { weekIndex, exercises };
}