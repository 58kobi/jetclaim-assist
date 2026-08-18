import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";

export function useAdminClaims() {
  const { isAdmin } = useIsAdmin();
  return useQuery({
    enabled: isAdmin,
    queryKey: ["admin-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false });
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
