import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";

export default function ExercisePicker({ open, onOpenChange, onPick }) {
  const [exercises, setExercises] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) base44.entities.Exercise.list("name", 500).then(setExercises);
  }, [open]);

  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-neutral-900 text-neutral-100">
        <DialogHeader><DialogTitle className="font-light">Add exercise</DialogTitle></DialogHeader>
        <div className="flex items-center gap-2 rounded-xl bg-neutral-800 px-3">
          <Search className="h-4 w-4 text-neutral-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full bg-transparent py-3 text-sm outline-none" />
        </div>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => { onPick(e); onOpenChange(false); }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-neutral-800"
            >
              <span className="text-sm">{e.name}</span>
              <span className="text-[11px] uppercase tracking-widest text-neutral-500">{e.primary_muscle}</span>
            </button>
          ))}
          {!filtered.length && <p className="py-6 text-center text-sm text-neutral-500">No exercises found.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}