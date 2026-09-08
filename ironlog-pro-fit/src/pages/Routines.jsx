import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Folder, Trash2 } from "lucide-react";

export default function Routines() {
  const [routines, setRoutines] = useState([]);

  const load = () => base44.entities.Routine.list("-created_date", 200).then(setRoutines);
  useEffect(() => { load(); }, []);

  const create = async () => {
    await base44.entities.Routine.create({ name: "New routine", folder: "My Routines", exercises: [] });
    load();
  };

  const copyTemplate = async (t) => {
    await base44.entities.Routine.create({ name: t.name, folder: "My Routines", description: t.description, exercises: t.exercises });
    load();
  };

  const mine = routines.filter((r) => !r.is_template);
  const templates = routines.filter((r) => r.is_template);
  const folders = [...new Set(mine.map((r) => r.folder || "My Routines"))];

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between">
        <h1 className="text-4xl font-light tracking-tight">Routines</h1>
        <button onClick={create} className="flex items-center gap-1 rounded-full bg-lime-300 px-4 py-2 text-sm font-medium text-neutral-900">
          <Plus className="h-4 w-4" /> New
        </button>
      </header>

      {folders.map((f) => (
        <section key={f} className="space-y-2">
          <h2 className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-neutral-500"><Folder className="h-3 w-3" /> {f}</h2>
          {mine.filter((r) => (r.folder || "My Routines") === f).map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-neutral-900/70 p-4">
              <Link to={`/routines/${r.id}`} className="flex-1">
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-neutral-500">{(r.exercises || []).length} exercises</p>
              </Link>
              <button onClick={async () => { await base44.entities.Routine.delete(r.id); load(); }} className="text-neutral-600 hover:text-rose-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </section>
      ))}
      {!mine.length && <p className="text-sm text-neutral-500">No routines yet. Create one or copy a program below.</p>}

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-[0.25em] text-neutral-500">Program library</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl bg-neutral-900/70 p-4">
              <p className="font-medium">{t.name}</p>
              <p className="mt-1 text-xs text-neutral-500">{t.category} · {(t.exercises || []).length} exercises</p>
              <p className="mt-2 text-xs text-neutral-400">{t.description}</p>
              <button onClick={() => copyTemplate(t)} className="mt-3 rounded-full border border-lime-300/40 px-3 py-1 text-xs text-lime-300">Copy to my routines</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}