"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { AppStatePayload } from "@/lib/types";

export function useLiveAppState() {
  const [state, setState] = useState<AppStatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load live state");
      const data = (await res.json()) as AppStatePayload;
      setState(data);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading state");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/state", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load live state");
        return (await res.json()) as AppStatePayload;
      })
      .then((data) => {
        if (!active) return;
        setState(data);
        setError(null);
        setLastUpdated(Date.now());
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Error loading state");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // 1. Local SSE stream (always active in local mode, harmless in Supabase mode)
    const eventSource = new EventSource("/api/events");
    eventSource.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        if (parsed.type === "state_changed") {
          refresh();
        }
      } catch {
        // Ignore malformed pings
      }
    };

    // 2. Supabase Realtime subscription (active whenever NEXT_PUBLIC_SUPABASE_URL is set)
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      ? supabase
          .channel("grassroot-live-changes")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            () => refresh()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "order_items" },
            () => refresh()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "recipes" },
            () => refresh()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "weekly_drops" },
            () => refresh()
          )
          .subscribe()
      : null;

    return () => {
      active = false;
      eventSource.close();
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [refresh]);

  return { state, loading, error, refresh, lastUpdated };
}
