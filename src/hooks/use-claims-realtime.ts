import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Live-refresh claim data whenever a claim row changes (e.g. admin status updates). */
export function useClaimsRealtime(claimId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`claims-live-${claimId ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "claims" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["claims"] });
          queryClient.invalidateQueries({ queryKey: ["admin-claims"] });
          if (claimId) {
            queryClient.invalidateQueries({ queryKey: ["claims", claimId] });
            queryClient.invalidateQueries({ queryKey: ["admin-claim", claimId] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [claimId, queryClient]);
}
