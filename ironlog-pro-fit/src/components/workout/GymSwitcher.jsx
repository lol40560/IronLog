import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Plus, Check, Lock, X } from "lucide-react";

// Pro-gated gym profile selector with per-gym plate inventory. Locked -> chip triggers onLocked.
export default function GymSwitcher({ pro, value, onChange, onLocked }) {
  const [gyms, setGyms] = useState([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (pro) base44.entities.GymProfile.list().then(setGyms);
  }, [pro]);

  if (!pro) {
    return (
      <button
        onClick={onLocked}
        className="flex w-full items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-neutral-400"
      >
        <Lock className="h-4 w-4 text-lime-300" />
        <span className="flex-1 text-left">Gym profiles &amp; contextual PRs — Pro</span>
      </button>
    );
  }

  const create = async () => {
    if (!name.trim()) return;
    const first = gyms.length === 0;
    const g = await base44.entities.GymProfile.create({ name: name.trim(), is_default: first });
    setGyms([...gyms, g]);
    setName("");
    if (first || !value) onChange(g);
  };

  const makeDefault = async (g) => {
    await base44.entities.GymProfile.update(g.id, { is_default: true });
    setGyms(gyms.map((x) => ({ ...x, is_default: x.id === g.id })));
    onChange(g);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm"
      >
        <MapPin className="h-4 w-4 text-lime-300" />
        <span className="flex-1 text-left">{value ? value.name : "No gym selected"}</span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Switch</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-neutral-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-400">Gym profile</h3>
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-neutral-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {gyms.map((g) => (
                <div
                  key={g.id}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                    value?.id === g.id ? "border-lime-300/40 bg-lime-300/5" : "border-white/10"
                  }`}
                >
                  <button
                    onClick={() => {
                      onChange(g);
                      setOpen(false);
                    }}
                    className="flex-1 text-left text-sm"
                  >
                    {g.name}
                    {g.is_default ? " · default" : ""}
                  </button>
                  {value?.id === g.id && <Check className="h-4 w-4 text-lime-300" />}
                  <button onClick={() => makeDefault(g)} className="text-[11px] text-neutral-500 hover:text-lime-300">
                    set default
                  </button>
                </div>
              ))}
              {!gyms.length && (
                <p className="text-xs text-neutral-500">Create a gym profile to scope machine/cable PRs by location.</p>
              )}
            </div>

            {value && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-neutral-500">Plate inventory (kg pairs)</p>
                <input
                  key={value.id}
                  defaultValue={(value.plate_inventory || []).join(", ")}
                  onBlur={async (e) => {
                    const inv = e.target.value.split(",").map((x) => Number(x.trim())).filter((n) => n > 0);
                    await base44.entities.GymProfile.update(value.id, { plate_inventory: inv });
                    setGyms(gyms.map((g) => (g.id === value.id ? { ...g, plate_inventory: inv } : g)));
                    onChange({ ...value, plate_inventory: inv });
                  }}
                  placeholder="25, 20, 15, 10, 5, 2.5, 1.25"
                  className="w-full rounded-xl bg-neutral-800 px-3 py-2.5 text-sm outline-none"
                />
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New gym name"
                className="flex-1 rounded-xl bg-neutral-800 px-3 py-2.5 text-sm outline-none"
              />
              <button onClick={create} className="rounded-xl bg-lime-300 px-4 text-sm font-medium text-neutral-900">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}