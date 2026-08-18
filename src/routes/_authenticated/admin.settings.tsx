import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { CLAIM_STATUSES } from "@/lib/jetclaim";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — JetClaim Admin" },
      { name: "description", content: "Admin account details and JetClaim workflow configuration." },
      { property: "og:title", content: "Settings — JetClaim Admin" },
      { property: "og:description", content: "Admin account and workflow reference." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const { user } = useAuth();
  return (
    <AdminShell title="Settings" subtitle="Admin account and workflow configuration.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-navy">Admin account</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Signed in as</span> <span className="font-medium text-navy">{user?.email ?? "—"}</span></p>
            <p className="text-muted-foreground">
              This is the single restricted admin account. Admin access is granted by role in the database — no self-registration is possible.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-navy">Claim workflow</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              {CLAIM_STATUSES.map((s) => (<li key={s}>{s}</li>))}
            </ol>
            <p className="pt-2 text-muted-foreground">Support inbox: jetclaimsupport@gmail.com — replies within 40 minutes, Monday to Sunday.</p>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
