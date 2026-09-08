import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Check, Share2, Copy } from "lucide-react";
import ExercisePicker from "@/components/workout/ExercisePicker";
import PeriodizationEditor from "@/components/routine/PeriodizationEditor";

const GROUPS = ["normal", "superset", "circuit", "interval"];

export default function RoutineEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [routine, setRoutine] = useState(null);
  const [picker, setPicker] = useState(false);
  const [shareToken, setShareToken] = useState("");

  useEffect(() => { base44.entities.Routine.get(id).then((r) => { setRoutine(r); setShareToken(r.share_token || ""); }); }, [id]);
  if (!routine) return <p className="text-neutral-500">Loading…</p>;

  const update = (patch) => setRoutine({ ...routine, ...patch });

  const share = async () => {
    const token = shareToken || Math.random().toString(36).slice(2, 10);
    await base44.entities.Routine.update(id, { share_token: token, is_shared: true });
    setShareToken(token);
  };
  const setEx = (i, patch) => update({ exercises: routine.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  const save = async () => {
    await base44.entities.Routine.update(id, {
      name: routine.name, folder: routine.folder, description: routine.description, exercises: routine.exercises, periodization: routine.periodization,
    });
    navigate("/routines");
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <input value={routine.name} onChange={(e) => update({ name: e.target.value })} className="flex-1 bg-transparent text-3xl font-light tracking-tight outline-none" />
        <button onClick={save} className="flex items-center gap-1 rounded-full bg-lime-300 px-4 py-2 text-sm font-medium text-neutral-900"><Check className="h-4 w-4" /> Save</button>
      </header>

      {shareToken && (
        <div className="flex items-center gap-2 rounded-xl bg-neutral-900/70 p-3 text-xs">
          <span className="flex-1 truncate text-neutral-400">{window.location.origin}/share/{shareToken}</span>
          <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`)} className="text-lime-300"><Copy className="h-4 w-4" /></button>
        </div>
      )}
      <button onClick={share} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm text-neutral-300">
        <Share2 className="h-4 w-4" /> {shareToken ? "Regenerate share link" : "Create share link"}
      </button>

      <input value={routine.folder || ""} onChange={(e) => update({ folder: e.target.value })} placeholder="Folder" className="w-full rounded-xl bg-neutral-900/70 px-4 py-3 text-sm outline-none" />

      <PeriodizationEditor value={routine.periodization} onChange={(p) => update({ periodization: p })} />

      <div className="space-y-3">
        {(routine.exercises || []).map((ex, i) => (
          <div key={i} className="rounded-2xl bg-neutral-900/70 p-4">
            <div className="flex items-center">
              <p className="flex-1 font-medium">{ex.exercise_name}</p>
              <button onClick={() => update({ exercises: routine.exercises.filter((_, j) => j !== i) })} className="text-neutral-600 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-neutral-400">
              <label>Sets<input type="number" value={ex.target_sets ?? 3} onChange={(e) => setEx(i, { target_sets: Number(e.target.value) })} className="mt-1 w-full rounded-lg bg-neutral-800 px-2 py-2 text-center text-neutral-100 outline-none" /></label>
              <label>Reps<input type="number" value={ex.target_reps ?? 8} onChange={(e) => setEx(i, { target_reps: Number(e.target.value) })} className="mt-1 w-full rounded-lg bg-neutral-800 px-2 py-2 text-center text-neutral-100 outline-none" /></label>
              <label>Rest<input type="number" value={ex.rest_seconds ?? 120} onChange={(e) => setEx(i, { rest_seconds: Number(e.target.value) })} className="mt-1 w-full rounded-lg bg-neutral-800 px-2 py-2 text-center text-neutral-100 outline-none" /></label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              <div className="flex rounded-lg bg-neutral-800 p-0.5">
                {["absolute", "percent_1rm"].map((lt) => (
                  <button key={lt} onClick={() => setEx(i, { load_type: lt })} className={`rounded px-2 py-1 ${(ex.load_type || "absolute") === lt ? "bg-lime-300 text-neutral-900" : "text-neutral-400"}`}>
                    {lt === "absolute" ? "kg" : "%1RM"}
                  </button>
                ))}
              </div>
              {(ex.load_type || "absolute") === "percent_1rm" ? (
                <label>% 1RM<input type="number" value={ex.weight_percent ?? 75} onChange={(e) => setEx(i, { weight_percent: Number(e.target.value) })} className="ml-1 w-16 rounded-lg bg-neutral-800 px-2 py-1 text-center text-neutral-100 outline-none" /></label>
              ) : (
                <label>Target kg<input type="number" value={ex.target_weight ?? ""} onChange={(e) => setEx(i, { target_weight: e.target.value ? Number(e.target.value) : null })} className="ml-1 w-20 rounded-lg bg-neutral-800 px-2 py-1 text-center text-neutral-100 outline-none" /></label>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              {GROUPS.map((g) => (
                <button key={g} onClick={() => setEx(i, { group_type: g })} className={`rounded-full px-3 py-1 text-[11px] capitalize ${(ex.group_type || "normal") === g ? "bg-lime-300 text-neutral-900" : "border border-white/10 text-neutral-400"}`}>{g}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setPicker(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-4 text-sm text-neutral-300"><Plus className="h-4 w-4" /> Add exercise</button>

      <ExercisePicker open={picker} onOpenChange={setPicker} onPick={(e) => update({ exercises: [...(routine.exercises || []), { exercise_name: e.name, group_type: "normal", target_sets: 3, target_reps: 8, rest_seconds: e.default_rest_seconds || 120 }] })} />
    </div>
  );
}