import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function isAdminUser(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export function useIsAdmin() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["is-admin", userId],
    enabled: userId !== undefined && userId !== null,
    queryFn: () => isAdminUser(userId!),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (userId === undefined) return { isAdmin: false, loading: true };
  if (userId === null) return { isAdmin: false, loading: false };
  return { isAdmin: data === true, loading: isLoading || data === undefined };
}
