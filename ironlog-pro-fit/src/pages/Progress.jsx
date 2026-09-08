import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Camera, Plus } from "lucide-react";

const FIELDS = [
  ["weight_kg", "Weight (kg)"],
  ["body_fat", "Body fat %"],
  ["chest_cm", "Chest (cm)"],
  ["waist_cm", "Waist (cm)"],
  ["hips_cm", "Hips (cm)"],
  ["arm_cm", "Arm (cm)"],
  ["thigh_cm", "Thigh (cm)"],
];

export default function Progress() {
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [draft, setDraft] = useState({ date: format(new Date(), "yyyy-MM-dd") });
  const [uploading, setUploading] = useState(false);

  const load = () => {
    base44.entities.BodyMeasurement.list("date", 200).then(setEntries);
    base44.entities.ProgressPhoto.list("-date", 100).then(setPhotos);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    await base44.entities.BodyMeasurement.create(draft);
    setDraft({ date: format(new Date(), "yyyy-MM-dd") });
    load();
  };

  const upload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ProgressPhoto.create({ date: format(new Date(), "yyyy-MM-dd"), photo_url: file_url });
    setUploading(false);
    load();
  };

  const chartData = entries.filter((e) => e.weight_kg).map((e) => ({ date: format(new Date(e.date), "d MMM"), weight: e.weight_kg }));

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-light tracking-tight">Body</h1>

      {chartData.length > 1 && (
        <section className="rounded-2xl bg-neutral-900/70 p-4">
          <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-neutral-500">Body weight</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#171717", border: "none", borderRadius: 12 }} />
              <Line type="monotone" dataKey="weight" stroke="#bef264" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      <section className="space-y-3 rounded-2xl bg-neutral-900/70 p-4">
        <h2 className="text-xs uppercase tracking-[0.25em] text-neutral-500">Log measurements</h2>
        <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm outline-none" />
        <div className="grid grid-cols-2 gap-2">
          {FIELDS.map(([key, label]) => (
            <input key={key} type="number" placeholder={label} value={draft[key] ?? ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value === "" ? undefined : Number(e.target.value) })} className="rounded-xl bg-neutral-800 px-4 py-3 text-sm outline-none" />
          ))}
        </div>
        <button onClick={save} className="flex w-full items-center justify-center gap-1 rounded-full bg-lime-300 py-3 text-sm font-medium text-neutral-900"><Plus className="h-4 w-4" /> Save entry</button>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.25em] text-neutral-500">Progress photos</h2>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-6 text-sm text-neutral-400">
          <Camera className="h-4 w-4" /> {uploading ? "Uploading…" : "Add photo"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl bg-neutral-900">
              <Image src={p.photo_url} alt={p.date} className="aspect-[3/4] w-full object-cover" />
              <p className="p-2 text-[11px] text-neutral-500">{format(new Date(p.date), "d MMM yyyy")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-[0.25em] text-neutral-500">History</h2>
        {[...entries].reverse().map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-2xl bg-neutral-900/70 px-4 py-3 text-sm">
            <span>{format(new Date(e.date), "d MMM yyyy")}</span>
            <span className="text-neutral-400">{e.weight_kg ? `${e.weight_kg} kg` : ""}{e.body_fat ? ` · ${e.body_fat}%` : ""}</span>
          </div>
        ))}
      </section>
    </div>
  );
}