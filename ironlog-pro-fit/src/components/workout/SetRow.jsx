import React from "react";
import { Check } from "lucide-react";

const TYPES = [
  { key: "normal", label: "N", cls: "text-neutral-300" },
  { key: "warmup", label: "W", cls: "text-amber-300" },
  { key: "drop", label: "D", cls: "text-sky-300" },
  { key: "failure", label: "F", cls: "text-rose-300" },
];

export default function SetRow({ set, index, previous, isTimeBased, onChange, onToggle }) {
  const type = TYPES.find((t) => t.key === (set.type || "normal"));
  const cycle = () => {
    const i = TYPES.findIndex((t) => t.key === (set.type || "normal"));
    onChange({ ...set, type: TYPES[(i + 1) % TYPES.length].key });
  };

  const field = (key, placeholder) => (
    <input
      type="number"
      inputMode="decimal"
      value={set[key] ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange({ ...set, [key]: e.target.value === "" ? undefined : Number(e.target.value) })}
      className="w-full rounded-lg bg-neutral-800/80 py-2 text-center text-sm outline-none focus:bg-neutral-700"
    />
  );

  return (
    <div className={`grid grid-cols-[28px_64px_1fr_1fr_56px_36px] items-center gap-2 rounded-xl px-1 py-1 transition-colors ${set.completed ? "bg-lime-300/10" : ""}`}>
      <button onClick={cycle} className={`text-xs font-bold ${type.cls}`}>{index + 1}{type.key !== "normal" ? type.label : ""}</button>
      <span className="truncate text-[11px] text-neutral-500">{previous || "—"}</span>
      {isTimeBased ? (
        <div className="col-span-2">{field("duration_seconds", "sec")}</div>
      ) : (
        <>
          {field("weight", "kg")}
          {field("reps", "reps")}
        </>
      )}
      {field("rpe", "RPE")}
      <button
        onClick={onToggle}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          set.completed ? "bg-lime-300 text-neutral-900" : "bg-neutral-800 text-neutral-500"
        }`}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}