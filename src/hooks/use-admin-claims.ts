import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";

export function useAdminClaims({ trashed = false }: { trashed?: boolean } = {}) {
  const { isAdmin } = useIsAdmin();
  return useQuery({
    enabled: isAdmin,
    queryKey: ["admin-claims", trashed ? "trash" : "active"],
    queryFn: async () => {
      let query = supabase.from("claims").select("*");
      query = trashed
        ? query.not("deleted_at", "is", null).order("deleted_at", { ascending: false })
        : query.is("deleted_at", null).order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((c) => c.user_id)));
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email, phone").in("id", ids)
        : { data: [] as Array<{ id: string; full_name: string | null; email: string | null; phone: string | null }> };
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((c) => ({ ...c, client: byId.get(c.user_id) ?? null }));
    },
    refetchOnWindowFocus: true,
  });
}

export async function setClaimTrashed(claimId: string, trashed: boolean) {
  const { error } = await supabase
    .from("claims")
    .update({ deleted_at: trashed ? new Date().toISOString() : null })
    .eq("id", claimId);
  if (error) throw error;
}
