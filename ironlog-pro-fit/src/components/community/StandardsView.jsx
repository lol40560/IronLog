import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { STRENGTH_LIFTS, strengthTier, best1rmAcross } from "@/lib/social";

const TIERS = ["Beginner", "Novice", "Intermediate", "Advanced", "Elite"];

export default function StandardsView() {
  const [workouts, setWorkouts] = useState([]);
  const [bodyweight, setBodyweight] = useState(0);
  const [gender, setGender] = useState("male");

  useEffect(() => {
    base44.entities.Workout.filter({ status: "completed" }, "date", 500).then(setWorkouts);
    base44.entities.BodyMeasurement.list("-date", 1).then((r) => {
      if (r[0]?.weight_kg) setBodyweight(r[0].weight_kg);
    });
  }, []);

  const lifts = useMemo(
    () =>
      STRENGTH_LIFTS.map((lift) => {
        const best = best1rmAcross(workouts, lift, bodyweight);
        const tier = strengthTier(lift, best, bodyweight, gender);
        return { lift, best, tier };
      }),
    [workouts, bodyweight, gender]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-neutral-900/70 p-4 sm:flex-row sm:items-center">
        <label className="flex-1 text-xs text-neutral-400">
          Bodyweight (kg)
          <input
            type="number"
            value={bodyweight || ""}
            onChange={(e) => setBodyweight(Number(e.target.value))}
            className="mt-1 w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none"
          />
        </label>
        <div className="flex gap-1 rounded-full bg-neutral-800 p-1">
          {["male", "female"].map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${
                gender === g ? "bg-lime-300 text-neutral-900" : "text-neutral-400"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {!bodyweight && (
        <p className="rounded-xl bg-amber-300/10 px-4 py-3 text-xs text-amber-300">
          Add a bodyweight (or log it on the Body tab) to benchmark your lifts.
        </p>
      )}

      <div className="space-y-3">
        {lifts.map(({ lift, best, tier }) => (
          <div key={lift} className="rounded-2xl bg-neutral-900/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{lift}</p>
              <p className="font-mono text-sm">
                {best ? `${best} kg` : <span className="text-neutral-600">no data</span>}
              </p>
            </div>
            <div className="mt-3 flex gap-1">
              {TIERS.map((t, i) => (
                <div
                  key={t}
                  className={`h-1.5 flex-1 rounded-full ${
                    tier && i <= tier.index ? "bg-lime-300" : "bg-neutral-800"
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-neutral-500">
              <span className={tier?.tier === "Beginner" ? "text-lime-300" : ""}>Beginner</span>
              <span className={tier?.tier === "Novice" ? "text-lime-300" : ""}>Nov</span>
              <span className={tier?.tier === "Intermediate" ? "text-lime-300" : ""}>Inter</span>
              <span className={tier?.tier === "Advanced" ? "text-lime-300" : ""}>Adv</span>
              <span className={tier?.tier === "Elite" ? "text-lime-300" : ""}>Elite</span>
            </div>
            {tier && (
              <p className="mt-2 text-xs text-neutral-400">
                <span className="text-lime-300">{tier.tier}</span> · {tier.ratio}× bodyweight
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}