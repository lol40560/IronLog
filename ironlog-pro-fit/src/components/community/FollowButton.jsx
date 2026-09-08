import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, UserCheck } from "lucide-react";

export default function FollowButton({ targetId, targetName, meId, meName }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId || !meId || targetId === meId) return;
    base44.entities.Follow.filter({ follower_id: meId, following_id: targetId }).then((r) => {
      setFollowing(r.length > 0);
      setLoading(false);
    });
  }, [targetId, meId]);

  if (!targetId || !meId || targetId === meId) return null;

  const toggle = async () => {
    if (following) {
      await base44.entities.Follow.deleteMany({ follower_id: meId, following_id: targetId });
      setFollowing(false);
    } else {
      await base44.entities.Follow.create({ follower_id: meId, following_id: targetId, following_name: targetName, follower_name: meName });
      setFollowing(true);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        following ? "border border-white/10 text-neutral-400" : "bg-lime-300 text-neutral-900"
      }`}
    >
      {following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
      {following ? "Following" : "Follow"}
    </button>
  );
}