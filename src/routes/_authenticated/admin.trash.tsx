import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { setClaimTrashed, useAdminClaims } from "@/hooks/use-admin-claims";
import { useClaimsRealtime } from "@/hooks/use-claims-realtime";
import { statusTone } from "@/lib/jetclaim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/trash")({
  head: () => ({
    meta: [
      { title: "Trash — JetClaim Admin" },
      { name: "description", content: "Deleted JetClaim claims kept as a history, with the option to restore." },
      { property: "og:title", content: "Trash — JetClaim Admin" },
      { property: "og:description", content: "Review and restore deleted passenger claims." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTrash,
});

function AdminTrash() {
  useClaimsRealtime();
  const queryClient = useQueryClient();
  const { data: claims, isLoading } = useAdminClaims({ trashed: true });
  const [search, setSearch] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);

  const q = search.trim().toLowerCase();
  const rows = (claims ?? []).filter(
    (c) =>
      !q ||
      [c.client?.full_name, c.client?.email, c.airline_name, c.flight_number, c.reference]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
  );

  async function restore(id: string) {
    setRestoring(id);
    try {
      await setClaimTrashed(id, false);
      toast.success("Claim restored to the queue.");
      queryClient.invalidateQueries({ queryKey: ["admin-claims"] });
      queryClient.invalidateQueries({ queryKey: ["admin-claim", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not restore claim.");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <AdminShell title="Trash" subtitle="Deleted claims are kept here as a history. Restore any claim at any time.">
      <Input
        placeholder="Search client, airline, flight or reference"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm bg-background"
      />

      <Card className="mt-6 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Claim</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Deleted</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Loading trash…</td></tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <Trash2 className="mx-auto mb-2 size-6 opacity-50" />
                      Trash is empty.
                    </td>
                  </tr>
                ) : (
                  rows.map((c) => (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-navy">{c.client?.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{c.client?.email ?? ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{c.airline_name} · {c.flight_number}</div>
                        <div className="text-xs text-muted-foreground">Ref {c.reference} · {c.issue_type}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(c.status))}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.deleted_at ? new Date(c.deleted_at).toLocaleString("en-GB") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to="/admin/claims/$claimId"
                            params={{ claimId: c.id }}
                            className="text-sm font-medium text-brand-blue hover:underline"
                          >
                            View
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => restore(c.id)} disabled={restoring === c.id}>
                            {restoring === c.id ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                            Restore
                          </Button>
                        </div>
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
