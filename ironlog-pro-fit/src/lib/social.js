import { epley1RM } from "@/lib/fitness";

export const STRENGTH_LIFTS = ["Back Squat", "Bench Press", "Deadlift", "Overhead Press", "Pull-up"];

// thresholds = 1RM/bodyweight ratios for [novice, intermediate, advanced, elite]
const STANDARDS = {
  male: {
    "Back Squat": [0.8, 1.2, 1.6, 2.0],
    "Bench Press": [0.6, 0.9, 1.2, 1.5],
    "Deadlift": [1.0, 1.5, 2.0, 2.4],
    "Overhead Press": [0.4, 0.6, 0.85, 1.1],
    "Pull-up": [0.3, 0.5, 0.75, 1.0],
  },
  female: {
    "Back Squat": [0.5, 0.8, 1.1, 1.5],
    "Bench Press": [0.35, 0.55, 0.75, 1.0],
    "Deadlift": [0.65, 0.9, 1.3, 1.7],
    "Overhead Press": [0.2, 0.35, 0.5, 0.7],
    "Pull-up": [0.15, 0.3, 0.5, 0.7],
  },
};
const TIERS = ["Beginner", "Novice", "Intermediate", "Advanced", "Elite"];

export function strengthTier(lift, oneRM, bodyweight, gender = "male") {
  const table = STANDARDS[gender] || STANDARDS.male;
  const th = table[lift];
  if (!th || !bodyweight || !oneRM) return null;
  const ratio = oneRM / bodyweight;
  let idx = 0;
  for (let i = 0; i < th.length; i++) if (ratio >= th[i]) idx = i + 1;
  return { tier: TIERS[idx], ratio: Math.round(ratio * 100) / 100, thresholds: th, index: idx };
}

export function best1rmAcross(workouts, exerciseName, bodyweight = 0) {
  let best = 0;
  workouts.forEach((w) => (w.exercises || []).forEach((e) => {
    if (e.exercise_name !== exerciseName) return;
    (e.sets || []).forEach((s) => {
      if (!s.completed || s.type === "warmup") return;
      let load = s.weight || 0;
      if (exerciseName === "Pull-up") load += bodyweight;
      best = Math.max(best, epley1RM(load, s.reps));
    });
  }));
  return best;
}

export function leaderboardFor(workouts, exerciseName, scopeIds) {
  const map = {};
  workouts.forEach((w) => {
    const uid = w.created_by_id;
    if (scopeIds && !scopeIds.has(uid)) return;
    const best = best1rmAcross([w], exerciseName);
    if (best <= 0) return;
    if (!map[uid] || best > map[uid].best) {
      map[uid] = { id: uid, name: w.author_name || "Athlete", best };
    }
  });
  return Object.values(map).sort((a, b) => b.best - a.best);
}