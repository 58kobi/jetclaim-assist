import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { REGULATION_DETAILS } from "@/lib/jetclaim";

export const Route = createFileRoute("/_authenticated/admin/airlines")({
  head: () => ({
    meta: [
      { title: "Airlines & Regulations — JetClaim Admin" },
      { name: "description", content: "Reference list of covered airlines and passenger rights regulations." },
      { property: "og:title", content: "Airlines & Regulations — JetClaim Admin" },
      { property: "og:description", content: "Covered carriers and regulation reference." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAirlines,
});

function AdminAirlines() {
  const { isAdmin } = useIsAdmin();
  const { data: airlines, isLoading } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-airlines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("airlines").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminShell title="Airlines & regulations" subtitle="Reference data used when matching and pricing claims.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-navy">Airlines ({airlines?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <ul className="max-h-[28rem] space-y-1 overflow-y-auto text-sm">
                {(airlines ?? []).map((a) => (
                  <li key={a.id} className="flex justify-between border-b border-border/60 py-1.5">
                    <span className="text-navy">{a.name}</span>
                    <span className="text-muted-foreground">{a.iata_code ?? ""} {a.country ?? ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-navy">Regulations</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {REGULATION_DETAILS.map((r) => (
              <div key={r.code} className="rounded-md border border-border p-3">
                <p className="font-semibold text-navy">{r.name}</p>
                <p className="mt-1 text-muted-foreground">{r.compensation}</p>
                <p className="mt-1 text-xs text-muted-foreground">Deadline: {r.deadline}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
