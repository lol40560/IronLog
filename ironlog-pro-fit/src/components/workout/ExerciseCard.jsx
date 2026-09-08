import React, { useState } from "react";
import { Plus, Calculator, StickyNote, Timer, Trash2, Pin } from "lucide-react";
import SetRow from "./SetRow";
import Stopwatch from "./Stopwatch";
import ToolsSheet from "./ToolsSheet";
import { effectiveLoad } from "@/lib/fitness";

const GROUP_STYLE = {
  superset: "border-l-2 border-sky-400/70",
  circuit: "border-l-2 border-fuchsia-400/70",
  interval: "border-l-2 border-amber-400/70",
  normal: "border-l-2 border-transparent",
};

export default function ExerciseCard({
  exercise,
  index,
  previousSets,
  onChange,
  onRemove,
  onSetCompleted,
  cardRef,
  meta,
  bodyweight,
  pro,
  gymProfileId,
}) {
  const [tools, setTools] = useState(false);
  const [showNotes, setShowNotes] = useState(!!exercise.notes);

  const update = (patch) => onChange({ ...exercise, ...patch });
  const setSets = (sets) => update({ sets });

  const addSet = () => {
    const last = exercise.sets?.[exercise.sets.length - 1];
    setSets([
      ...(exercise.sets || []),
      { type: "normal", weight: last?.weight, reps: last?.reps, completed: false },
    ]);
  };

  const cycleGroup = () => {
    const order = ["normal", "superset", "circuit", "interval"];
    update({ group_type: order[(order.indexOf(exercise.group_type || "normal") + 1) % order.length] });
  };

  const assisted = meta?.mechanics_type === "assisted";
  const lastDone = [...(exercise.sets || [])].reverse().find((s) => s.completed);
  const effLabel =
    assisted && lastDone
      ? `Counterweight: ${lastDone.weight || 0} kg · Effective: ${effectiveLoad(bodyweight, lastDone.weight)} kg`
      : "";

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl bg-neutral-900/70 p-4 ${GROUP_STYLE[exercise.group_type || "normal"]}`}
    >
      <div className="mb-3 flex items-start gap-2">
        <div className="flex-1">
          <h3 className="text-base font-medium tracking-tight">{exercise.exercise_name}</h3>
          {exercise.load_note && (
            <p className="mt-0.5 text-[11px] text-lime-300/80">{exercise.load_note}</p>
          )}
          {effLabel && <p className="mt-0.5 text-[11px] text-sky-300/80">{effLabel}</p>}
          <button
            onClick={cycleGroup}
            className="mt-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500"
          >
            {exercise.group_type === "normal" || !exercise.group_type ? "Single" : exercise.group_type}
          </button>
        </div>
        <button onClick={() => setTools(true)} className="p-1 text-neutral-500 hover:text-lime-300">
          <Calculator className="h-4 w-4" />
        </button>
        <button onClick={() => setShowNotes((s) => !s)} className="p-1 text-neutral-500 hover:text-lime-300">
          <StickyNote className="h-4 w-4" />
        </button>
        <button onClick={onRemove} className="p-1 text-neutral-600 hover:text-rose-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {pro && meta?.pinned_cues ? (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-lime-300/20 bg-lime-300/5 p-3">
          <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime-300" />
          <p className="text-xs leading-relaxed text-neutral-200">{meta.pinned_cues}</p>
        </div>
      ) : null}

      {showNotes && (
        <textarea
          value={exercise.notes || ""}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Exercise notes…"
          className="mb-3 w-full rounded-xl bg-neutral-800/70 p-3 text-sm outline-none"
          rows={2}
        />
      )}

      <div className="mb-2 flex items-center gap-2 text-[11px] text-neutral-500">
        <Timer className="h-3 w-3" /> Rest
        <input
          type="number"
          value={exercise.rest_seconds ?? 120}
          onChange={(e) => update({ rest_seconds: Number(e.target.value) })}
          className="w-16 rounded bg-neutral-800 px-2 py-1 text-center text-neutral-300 outline-none"
        />
        sec
      </div>

      {exercise.is_time_based && (
        <div className="mb-3">
          <Stopwatch
            onStop={(sec) => {
              const sets = [...(exercise.sets || [])];
              const i = sets.findIndex((s) => !s.completed);
              if (i >= 0) {
                sets[i] = { ...sets[i], duration_seconds: sec, completed: true };
                setSets(sets);
              }
            }}
          />
        </div>
      )}

      <div className="space-y-1">
        {(exercise.sets || []).map((s, i) => (
          <SetRow
            key={i}
            set={s}
            index={i}
            isTimeBased={exercise.is_time_based}
            previous={previousSets?.[i] ? `${previousSets[i].weight || 0}×${previousSets[i].reps || 0}` : ""}
            onChange={(ns) => setSets(exercise.sets.map((o, j) => (j === i ? ns : o)))}
            onToggle={() => {
              const now = !s.completed;
              setSets(exercise.sets.map((o, j) => (j === i ? { ...o, completed: now } : o)));
              if (now) onSetCompleted({ exercise, set: s, index });
            }}
          />
        ))}
      </div>

      <button
        onClick={addSet}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-white/10 py-2 text-xs text-neutral-400 hover:text-lime-300"
      >
        <Plus className="h-3 w-3" /> Add set
      </button>

      <ToolsSheet
        open={tools}
        onOpenChange={setTools}
        weight={exercise.sets?.[0]?.weight}
        barType={exercise.bar_type || "olympic"}
        onBarTypeChange={(bt) => update({ bar_type: bt })}
        gymProfileId={gymProfileId}
      />
    </div>
  );
}