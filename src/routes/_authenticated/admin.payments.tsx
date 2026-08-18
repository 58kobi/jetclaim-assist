import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminClaims } from "@/hooks/use-admin-claims";
import { useClaimsRealtime } from "@/hooks/use-claims-realtime";
import { formatMoney } from "@/lib/jetclaim";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments & Payouts — JetClaim Admin" },
      { name: "description", content: "Fee status and payout tracking for refundable JetClaim claims." },
      { property: "og:title", content: "Payments & Payouts — JetClaim Admin" },
      { property: "og:description", content: "Track fees, payouts and settlement status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPayments,
});

function AdminPayments() {
  useClaimsRealtime();
  const { data: claims } = useAdminClaims();
  const rows = (claims ?? []).filter((c) => c.is_refundable);

  return (
    <AdminShell title="Payments & payouts" subtitle="Refundable claims with fee and payout status.">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Compensation</th>
                  <th className="px-4 py-3 font-semibold">JetClaim fee</th>
                  <th className="px-4 py-3 font-semibold">Client receives</th>
                  <th className="px-4 py-3 font-semibold">Fee status</th>
                  <th className="px-4 py-3 font-semibold">Payout</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No refundable claims yet.</td></tr>
                ) : (
                  rows.map((c) => {
                    const comp = c.compensation_amount != null ? Number(c.compensation_amount) : null;
                    const fee = c.jetclaim_fee_amount != null ? Number(c.jetclaim_fee_amount) : null;
                    const cur = c.compensation_currency ?? "EUR";
                    return (
                      <tr key={c.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium text-navy">{c.client?.full_name ?? "—"}</td>
                        <td className="px-4 py-3">{c.reference}</td>
                        <td className="px-4 py-3">{formatMoney(comp, cur)}</td>
                        <td className="px-4 py-3">{formatMoney(fee, cur)}</td>
                        <td className="px-4 py-3">{comp == null ? "—" : formatMoney(comp - (fee ?? 0), cur)}</td>
                        <td className="px-4 py-3 capitalize">{c.fee_status.replace("_", " ")}</td>
                        <td className="px-4 py-3">
                          {c.actual_payout_received_at
                            ? new Date(c.actual_payout_received_at).toLocaleDateString("en-GB")
                            : c.expected_payout_window ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to="/admin/claims/$claimId" params={{ claimId: c.id }} className="text-sm font-medium text-brand-blue hover:underline">
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
