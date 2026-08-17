import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Loader2, ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { useClaimsRealtime } from "@/hooks/use-claims-realtime";
import { CLAIM_STATUSES, formatMoney, statusTone } from "@/lib/jetclaim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Claims Queue — JetClaim Admin" },
      { name: "description", content: "Internal JetClaim admin console for reviewing passenger compensation claims." },
      { property: "og:title", content: "Claims Queue — JetClaim Admin" },
      { property: "og:description", content: "Review, price and progress passenger claims." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminQueue,
});

type SortKey = "created_at" | "airline_name" | "issue_type" | "status" | "compensation_amount" | "client";

function AdminQueue() {
  const { isAdmin, loading } = useIsAdmin();
  useClaimsRealtime();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [asc, setAsc] = useState(false);

  const { data: claims, isLoading } = useQuery({
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
  });

  const rows = useMemo(() => {
    let list = claims ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        [c.client?.full_name, c.client?.email, c.airline_name, c.flight_number, c.reference, c.issue_type]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    if (status !== "all") list = list.filter((c) => c.status === status);
    return [...list].sort((a, b) => {
      const va = sortKey === "client" ? (a.client?.full_name ?? "") : (a[sortKey] ?? "");
      const vb = sortKey === "client" ? (b.client?.full_name ?? "") : (b[sortKey] ?? "");
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (asc ? 1 : -1);
    });
  }, [claims, search, status, sortKey, asc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <ShieldAlert className="mx-auto size-10 text-warning" />
          <h1 className="mt-4 text-2xl font-extrabold text-navy">Restricted area</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This console is available to the JetClaim admin account only.
          </p>
          <Button asChild className="mt-6 bg-navy text-navy-foreground hover:bg-navy-deep">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const headers: Array<{ key: SortKey | null; label: string }> = [
    { key: "client", label: "Client" },
    { key: "airline_name", label: "Airline" },
    { key: null, label: "Flight" },
    { key: "issue_type", label: "Incident" },
    { key: null, label: "Regulation" },
    { key: "compensation_amount", label: "Est. value" },
    { key: "status", label: "Status" },
    { key: null, label: "" },
  ];

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold text-navy">Claims queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review, price and progress every passenger claim.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Input
            placeholder="Search client, airline, flight or reference"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CLAIM_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="mt-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {headers.map((h) => (
                      <th key={h.label} className="px-4 py-3 font-semibold">
                        {h.key ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(h.key as SortKey)}
                            className="inline-flex items-center gap-1 hover:text-navy"
                          >
                            {h.label} <ArrowUpDown className="size-3" />
                          </button>
                        ) : (
                          h.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={headers.length} className="px-4 py-10 text-center text-muted-foreground">
                        Loading claims…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length} className="px-4 py-10 text-center text-muted-foreground">
                        No claims match this filter.
                      </td>
                    </tr>
                  ) : (
                    rows.map((c) => (
                      <tr key={c.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <div className="font-medium text-navy">{c.client?.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{c.client?.email ?? ""}</div>
                        </td>
                        <td className="px-4 py-3">{c.airline_name}</td>
                        <td className="px-4 py-3">
                          <div>{c.flight_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.flight_date} · {c.departure_airport}→{c.arrival_airport}
                          </div>
                        </td>
                        <td className="px-4 py-3">{c.issue_type}</td>
                        <td className="px-4 py-3">{c.regulation_code ?? "—"}</td>
                        <td className="px-4 py-3">
                          {formatMoney(
                            c.compensation_amount != null ? Number(c.compensation_amount) : null,
                            c.compensation_currency ?? "EUR",
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(c.status))}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to="/admin/claims/$claimId"
                            params={{ claimId: c.id }}
                            className="text-sm font-medium text-brand-blue hover:underline"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
