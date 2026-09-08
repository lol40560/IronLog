import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, MessageCircle, Send, Dumbbell } from "lucide-react";
import { workoutVolume } from "@/lib/fitness";
import FollowButton from "@/components/community/FollowButton";

export default function WorkoutPost({ workout, me }) {
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const tid = workout.id;
  const isMine = me && workout.created_by_id === me.id;
  const author = workout.author_name || (isMine ? "You" : "Athlete");

  const load = () => {
    base44.entities.Like.filter({ target_type: "workout", target_id: tid }).then(setLikes);
    base44.entities.Comment.filter({ target_type: "workout", target_id: tid }).then(setComments);
  };
  useEffect(() => { load(); }, [tid]);

  const liked = me && likes.some((l) => l.user_id === me.id);

  const toggleLike = async () => {
    if (!me) return;
    if (liked) {
      await base44.entities.Like.deleteMany({ target_type: "workout", target_id: tid, user_id: me.id });
    } else {
      await base44.entities.Like.create({ target_type: "workout", target_id: tid, user_id: me.id, user_name: me.full_name || "You" });
    }
    load();
  };

  const addComment = async () => {
    if (!text.trim() || !me) return;
    await base44.entities.Comment.create({
      target_type: "workout", target_id: tid, user_id: me.id,
      author_name: me.full_name || "You", text: text.trim(),
    });
    setText("");
    load();
  };

  const vol = Math.round(workoutVolume(workout));
  const setCount = (workout.exercises || []).reduce((a, e) => a + (e.sets || []).filter((s) => s.completed).length, 0);
  const exNames = (workout.exercises || []).map((e) => e.exercise_name).slice(0, 4).join(" · ");

  return (
    <div className="space-y-3 rounded-2xl bg-neutral-900/70 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-300 text-sm font-semibold text-neutral-900">
            {(author[0] || "?").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">{author}</p>
            <p className="text-[11px] text-neutral-500">{new Date(workout.date).toLocaleDateString()}</p>
          </div>
        </div>
        <FollowButton targetId={workout.created_by_id} targetName={author} meId={me?.id} meName={me?.full_name} />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Dumbbell className="h-4 w-4 text-lime-300" />
        <span className="font-medium">{workout.name}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-neutral-800/60 py-2">
          <p className="font-mono text-lg text-lime-300">{vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol}</p>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">kg volume</p>
        </div>
        <div className="rounded-xl bg-neutral-800/60 py-2">
          <p className="font-mono text-lg text-neutral-200">{setCount}</p>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">sets</p>
        </div>
        <div className="rounded-xl bg-neutral-800/60 py-2">
          <p className="font-mono text-lg text-neutral-200">{(workout.exercises || []).length}</p>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">lifts</p>
        </div>
      </div>

      {exNames && <p className="text-xs text-neutral-400">{exNames}</p>}

      <div className="flex items-center gap-4 border-t border-white/5 pt-3">
        <button onClick={toggleLike} className="flex items-center gap-1.5 text-sm">
          <Heart className={`h-4 w-4 ${liked ? "fill-lime-300 text-lime-300" : "text-neutral-400"}`} />
          <span className="text-neutral-400">{likes.length}</span>
        </button>
        <button onClick={() => setShowComments((v) => !v)} className="flex items-center gap-1.5 text-sm text-neutral-400">
          <MessageCircle className="h-4 w-4" /> {comments.length}
        </button>
      </div>

      {showComments && (
        <div className="space-y-2 border-t border-white/5 pt-3">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-medium text-neutral-200">{c.author_name || "Athlete"}: </span>
              <span className="text-neutral-400">{c.text}</span>
            </div>
          ))}
          {me && (
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
                placeholder="Add a comment…"
                className="flex-1 rounded-lg bg-neutral-800 px-3 py-2 text-sm outline-none"
              />
              <button onClick={addComment} className="rounded-lg bg-lime-300 px-3 text-neutral-900">
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}