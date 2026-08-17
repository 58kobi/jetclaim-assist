import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TRACKED = [
  "status",
  "fee_status",
  "jetclaim_fee_amount",
  "compensation_amount",
  "actual_payout_received_at",
] as const;

type ClaimRow = Record<string, unknown>;

/**
 * Live-refresh claim data whenever a claim row changes (e.g. admin status updates).
 * RLS on `claims` scopes the realtime stream to rows the signed-in user may read.
 * Returns `flash`: true briefly after a tracked field changes, for a visual cue.
 */
export function useClaimsRealtime(claimId?: string) {
  const queryClient = useQueryClient();
  const [flash, setFlash] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`claims-live-${claimId ?? "all"}`)
      .on(
        "postgres_changes",
        claimId
          ? { event: "*", schema: "public", table: "claims", filter: `id=eq.${claimId}` }
          : { event: "*", schema: "public", table: "claims" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["claims"] });
          queryClient.invalidateQueries({ queryKey: ["admin-claims"] });
          if (claimId) {
            queryClient.invalidateQueries({ queryKey: ["claims", claimId] });
            queryClient.invalidateQueries({ queryKey: ["admin-claim", claimId] });
          }

          const next = payload.new as ClaimRow | null;
          const prev = payload.old as ClaimRow | null;
          const changed =
            payload.eventType === "UPDATE" &&
            next &&
            TRACKED.some((f) => !prev || prev[f] !== next[f]);

          if (changed) {
            const status = typeof next?.status === "string" ? next.status : null;
            toast.info(
              status
                ? `Your claim status has been updated — ${status}`
                : "Your claim has been updated",
            );
            setFlash(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setFlash(false), 2500);
          }
        },
      )
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [claimId, queryClient]);

  return { flash };
}
