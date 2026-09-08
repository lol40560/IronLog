import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Copy, ArrowLeft, Dumbbell } from "lucide-react";

export default function Share() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [routine, setRoutine] = useState(undefined);

  useEffect(() => {
    base44.entities.Routine.filter({ share_token: token }).then((r) => setRoutine(r[0] || null));
  }, [token]);

  if (routine === undefined) return <div className="min-h-screen bg-neutral-950 text-neutral-100" />;
  if (routine === null)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 text-neutral-100">
        <p className="text-sm text-neutral-500">This routine link is no longer available.</p>
        <button onClick={() => navigate("/")} className="rounded-full bg-lime-300 px-4 py-2 text-sm font-medium text-neutral-900">Go home</button>
      </div>
    );

  const copy = async () => {
    await base44.entities.Routine.create({
      name: routine.name + " (copy)",
      folder: "My Routines",
      description: routine.description,
      exercises: routine.exercises || [],
    });
    navigate("/routines");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto max-w-2xl px-5 py-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-200">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mt-6 space-y-4 rounded-2xl bg-neutral-900/70 p-5">
          <div className="flex items-center gap-2 text-sm text-lime-300">
            <Dumbbell className="h-4 w-4" /> Shared routine
          </div>
          <h1 className="text-3xl font-light tracking-tight">{routine.name}</h1>
          {routine.description && <p className="text-sm text-neutral-400">{routine.description}</p>}

          <div className="space-y-2 border-t border-white/5 pt-4">
            {(routine.exercises || []).map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{ex.exercise_name}</span>
                <span className="font-mono text-xs text-neutral-500">{ex.target_sets ?? 3} × {ex.target_reps ?? 8}</span>
              </div>
            ))}
            {!(routine.exercises || []).length && <p className="text-sm text-neutral-600">No exercises in this routine.</p>}
          </div>

          <button onClick={copy} className="flex w-full items-center justify-center gap-2 rounded-full bg-lime-300 py-3 text-sm font-medium text-neutral-900">
            <Copy className="h-4 w-4" /> Copy to my routines
          </button>
        </div>
      </div>
    </div>
  );
}