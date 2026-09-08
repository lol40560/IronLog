import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Pro access: a paying subscriber OR an admin (admins unlock for testing/ownership).
export function usePro() {
  const [state, setState] = useState({ isPro: false, loading: true });
  useEffect(() => {
    let cancelled = false;
    base44.auth
      .me()
      .then((u) => {
        if (cancelled) return;
        const isPro = u?.subscription_tier === "pro" || u?.role === "admin";
        setState({ isPro, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ isPro: false, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}