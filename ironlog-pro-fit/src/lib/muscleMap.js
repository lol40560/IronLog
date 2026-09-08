// Granular sub-muscle taxonomy + heatmap scoring (Pro)

export const SUB_MUSCLE_GROUPS = {
  Shoulders: ["Front Deltoid", "Side Deltoid", "Rear Deltoid"],
  Chest: ["Upper Chest (Clavicular)", "Mid Chest (Sternal)", "Lower Chest"],
  Back: ["Lats (Latissimus Dorsi)", "Upper Back / Rhomboids", "Traps (Upper/Mid/Lower)", "Erector Spinae"],
  Arms: ["Biceps Long Head", "Biceps Short Head", "Brachialis", "Triceps Lateral Head", "Triceps Long Head", "Triceps Medial Head", "Forearm Flexors/Extensors"],
  Legs: ["Quadriceps", "Hamstrings", "Gluteus Maximus", "Gluteus Medius", "Calves (Gastrocnemius/Soleus)", "Adductors"],
};

export const ALL_SUB_MUSCLES = Object.values(SUB_MUSCLE_GROUPS).flat();

// Weekly set volume per sub-muscle: primary target x1.0, secondary x0.5.
// exerciseMap: exercise_name -> Exercise record (with primary_sub_muscle + secondary_sub_muscles)
export function subMuscleVolumes(workouts, exerciseMap) {
  const vol = {};
  for (const sub of ALL_SUB_MUSCLES) vol[sub] = 0;
  (workouts || []).forEach((w) =>
    (w.exercises || []).forEach((e) => {
      const ex = exerciseMap?.[e.exercise_name];
      const primary = ex?.primary_sub_muscle;
      const secondary = ex?.secondary_sub_muscles || [];
      const doneSets = (e.sets || []).filter((s) => s.completed && s.type !== "warmup").length;
      if (!doneSets) return;
      if (primary && vol[primary] !== undefined) vol[primary] += doneSets * 1.0;
      secondary.forEach((s) => {
        if (vol[s] !== undefined) vol[s] += doneSets * 0.5;
      });
    })
  );
  return vol;
}

// Heatmap color gradient: 0 muted · 1-5 low · 6-12 optimal · 13+ high.
export function heatColor(sets) {
  if (!sets || sets <= 0) return "#262626";
  if (sets <= 5) return "#a3e635";
  if (sets <= 12) return "#22d3ee";
  return "#f97316";
}

export function heatTier(sets) {
  if (!sets || sets <= 0) return "Muted";
  if (sets <= 5) return "Low";
  if (sets <= 12) return "Optimal";
  return "High";
}