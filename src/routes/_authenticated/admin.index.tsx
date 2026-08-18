import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plane } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminClaims } from "@/hooks/use-admin-claims";
import { useClaimsRealtime } from "@/hooks/use-claims-realtime";
import { formatMoney, statusTone } from "@/lib/jetclaim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — JetClaim" },
      { name: "description", content: "JetClaim internal admin console home with the most recent passenger claims." },
      { property: "og:title", content: "Admin Dashboard — JetClaim" },
      { property: "og:description", content: "Most recent passenger claims at a glance." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  useClaimsRealtime();
  const { data: claims, isLoading } = useAdminClaims();
  const recent = (claims ?? []).slice(0, 10);

  return (
    <AdminShell title="Dashboard" subtitle="Most recent claims across all clients.">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-navy">Recent claims</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/claims">Open claims queue</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No claims have been filed yet.</p>
          ) : (
            recent.map((c) => (
              <Link
                key={c.id}
                to="/admin/claims/$claimId"
                params={{ claimId: c.id }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3 hover:border-brand-blue"
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-navy">
                    <Plane className="size-4 -rotate-45 text-brand-blue" />
                    {c.airline_name} · {c.flight_number}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.client?.full_name ?? "Unknown client"} · {c.client?.email ?? "—"} · Ref {c.reference}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {formatMoney(
                      c.compensation_amount != null ? Number(c.compensation_amount) : null,
                      c.compensation_currency ?? "EUR",
                    )}
                  </span>
                  <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(c.status))}>
                    {c.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
