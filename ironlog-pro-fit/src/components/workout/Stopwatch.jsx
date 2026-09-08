import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { formatClock } from "@/lib/fitness";

export default function Stopwatch({ onStop }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (running) ref.current = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-neutral-800/60 px-4 py-2">
      <span className="font-mono text-lg text-lime-300">{formatClock(elapsed)}</span>
      <button onClick={() => setRunning((r) => !r)} className="text-neutral-300">
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button
        onClick={() => {
          setRunning(false);
          onStop?.(elapsed);
          setElapsed(0);
        }}
        className="ml-auto flex items-center gap-1 text-xs text-neutral-400"
      >
        <RotateCcw className="h-3 w-3" /> Log & reset
      </button>
    </div>
  );
}