import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePro } from "@/lib/usePro";
import SubMusclePicker from "@/components/exercise/SubMusclePicker";

const MUSCLES = ["all", "chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "core", "cardio"];

export default function Exercises() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", primary_muscle: "chest", equipment: "barbell", instructions: "", primary_sub_muscle: "", secondary_sub_muscles: [] });
  const { isPro } = usePro();

  const load = () => base44.entities.Exercise.list("name", 500).then(setList);
  useEffect(() => { load(); }, []);

  const filtered = list.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()) && (muscle === "all" || e.primary_muscle === muscle));

  const create = async () => {
    if (!draft.name) return;
    await base44.entities.Exercise.create({ ...draft, custom: true });
    setOpen(false);
    setDraft({ name: "", primary_muscle: "chest", equipment: "barbell", instructions: "", primary_sub_muscle: "", secondary_sub_muscles: [] });
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <h1 className="text-4xl font-light tracking-tight">Library</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 rounded-full bg-lime-300 px-4 py-2 text-sm font-medium text-neutral-900"><Plus className="h-4 w-4" /> Custom</button>
      </header>

      <div className="flex items-center gap-2 rounded-xl bg-neutral-900/70 px-4">
        <Search className="h-4 w-4 text-neutral-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises" className="w-full bg-transparent py-3 text-sm outline-none" />
      </div>

      <div className="flex flex-wrap gap-2">
        {MUSCLES.map((m) => (
          <button key={m} onClick={() => setMuscle(m)} className={`rounded-full px-3 py-1 text-[11px] capitalize ${muscle === m ? "bg-lime-300 text-neutral-900" : "border border-white/10 text-neutral-400"}`}>{m}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((e) => (
          <div key={e.id} className="rounded-2xl bg-neutral-900/70 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{e.name}</p>
              <span className="text-[11px] uppercase tracking-widest text-neutral-500">{e.equipment}</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500 capitalize">{e.primary_muscle}{e.secondary_muscles?.length ? ` · ${e.secondary_muscles.join(", ")}` : ""}</p>
            {e.primary_sub_muscle && <p className="text-[11px] text-lime-300/70">{e.primary_sub_muscle}{e.secondary_sub_muscles?.length ? ` · ${e.secondary_sub_muscles.join(", ")}` : ""}</p>}
            {e.instructions && <p className="mt-2 text-xs leading-relaxed text-neutral-400">{e.instructions}</p>}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-neutral-900 text-neutral-100">
          <DialogHeader><DialogTitle className="font-light">Custom exercise</DialogTitle></DialogHeader>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm outline-none" />
          <select value={draft.primary_muscle} onChange={(e) => setDraft({ ...draft, primary_muscle: e.target.value })} className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm outline-none">
            {MUSCLES.filter((m) => m !== "all").map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={draft.equipment} onChange={(e) => setDraft({ ...draft, equipment: e.target.value })} className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm outline-none">
            {["barbell", "dumbbell", "machine", "cable", "bodyweight", "kettlebell", "band", "smith_machine", "specialty_bar", "other"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <textarea value={draft.instructions} onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} placeholder="Execution notes" rows={3} className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm outline-none" />
          {isPro && (
            <SubMusclePicker
              primary={draft.primary_sub_muscle}
              secondary={draft.secondary_sub_muscles}
              onChange={({ primary, secondary }) => setDraft({ ...draft, primary_sub_muscle: primary, secondary_sub_muscles: secondary })}
            />
          )}
          <button onClick={create} className="rounded-full bg-lime-300 py-3 text-sm font-medium text-neutral-900">Create</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}