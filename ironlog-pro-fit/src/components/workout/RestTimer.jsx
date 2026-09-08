import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { formatClock } from "@/lib/fitness";

export default function RestTimer({ seconds, onDone }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [left]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="fixed bottom-20 inset-x-0 z-40 px-5"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-4 rounded-2xl border border-lime-300/30 bg-neutral-900 px-5 py-3 shadow-2xl">
          <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">Rest</span>
          <span className="font-mono text-2xl text-lime-300">{formatClock(left)}</span>
          <button
            onClick={() => setLeft((v) => v + 30)}
            className="ml-auto flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-300"
          >
            <Plus className="h-3 w-3" /> 30s
          </button>
          <button onClick={onDone} className="rounded-full p-1 text-neutral-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}