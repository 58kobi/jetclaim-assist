import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { useAdminClaims } from "@/hooks/use-admin-claims";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — JetClaim Admin" },
      { name: "description", content: "Registered JetClaim clients and their claim counts." },
      { property: "og:title", content: "Users — JetClaim Admin" },
      { property: "og:description", content: "Registered clients and contact details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const { isAdmin } = useIsAdmin();
  const { data: claims } = useAdminClaims();
  const { data: profiles, isLoading } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const counts = new Map<string, number>();
  for (const c of claims ?? []) counts.set(c.user_id, (counts.get(c.user_id) ?? 0) + 1);

  return (
    <AdminShell title="Users" subtitle="Every registered client and how many claims they have filed.">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Claims</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto size-5 animate-spin" /></td></tr>
                ) : (profiles ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No users yet.</td></tr>
                ) : (
                  (profiles ?? []).map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-navy">{p.full_name ?? "—"}</td>
                      <td className="px-4 py-3">{p.email ?? "—"}</td>
                      <td className="px-4 py-3">{p.phone ?? "—"}</td>
                      <td className="px-4 py-3">{counts.get(p.id) ?? 0}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("en-GB")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
