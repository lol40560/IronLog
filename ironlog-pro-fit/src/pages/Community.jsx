import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users } from "lucide-react";
import WorkoutPost from "@/components/community/WorkoutPost";
import LeaderboardList from "@/components/community/LeaderboardList";
import StandardsView from "@/components/community/StandardsView";

const TABS = [
  { k: "feed", label: "Feed" },
  { k: "leaderboards", label: "Leaderboards" },
  { k: "standards", label: "Standards" },
];

export default function Community() {
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [feedScope, setFeedScope] = useState("everyone");

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me().catch(() => null);
      setMe(u);
      base44.entities.Workout.filter({ status: "completed" }, "-date", 40).then(setPosts);
      if (u) {
        const fs = await base44.entities.Follow.filter({ follower_id: u.id });
        setFollowingIds(new Set(fs.map((f) => f.following_id)));
      }
    })();
  }, []);

  const visible =
    feedScope === "following" && me
      ? posts.filter((p) => p.created_by_id === me.id || followingIds.has(p.created_by_id))
      : posts;

  return (
    <div className="space-y-5">
      <h1 className="text-4xl font-light tracking-tight">Community</h1>

      <div className="flex gap-1 rounded-full bg-neutral-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex-1 rounded-full py-1.5 text-xs font-medium transition-colors ${
              tab === t.k ? "bg-lime-300 text-neutral-900" : "text-neutral-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "feed" && (
        <>
          <div className="flex gap-1 rounded-full bg-neutral-900 p-1">
            {["everyone", "following"].map((s) => (
              <button
                key={s}
                onClick={() => setFeedScope(s)}
                className={`flex-1 rounded-full py-1 text-xs font-medium capitalize ${
                  feedScope === s ? "bg-neutral-100 text-neutral-900" : "text-neutral-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
              <Users className="h-8 w-8 text-neutral-600" />
              <p className="mt-4 text-sm text-neutral-400">No workouts here yet</p>
              <p className="mt-1 text-xs text-neutral-600">Follow athletes or complete a workout to populate the feed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((w) => <WorkoutPost key={w.id} workout={w} me={me} />)}
            </div>
          )}
        </>
      )}

      {tab === "leaderboards" && <LeaderboardList me={me} followingIds={followingIds} />}
      {tab === "standards" && <StandardsView />}
    </div>
  );
}