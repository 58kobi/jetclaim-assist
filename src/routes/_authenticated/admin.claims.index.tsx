import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpDown } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminClaims } from "@/hooks/use-admin-claims";
import { useClaimsRealtime } from "@/hooks/use-claims-realtime";
import { CLAIM_STATUSES, REGULATION_BADGES, formatMoney, statusTone } from "@/lib/jetclaim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/claims/")({
  head: () => ({
    meta: [
      { title: "Claims Queue — JetClaim Admin" },
      { name: "description", content: "Internal JetClaim queue for reviewing passenger compensation claims." },
      { property: "og:title", content: "Claims Queue — JetClaim Admin" },
      { property: "og:description", content: "Review, price and progress passenger claims." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminQueue,
});

type SortKey = "created_at" | "airline_name" | "issue_type" | "status" | "compensation_amount" | "client";

function AdminQueue() {
  useClaimsRealtime();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [regulation, setRegulation] = useState("all");
  const [airline, setAirline] = useState("all");
  const [kind, setKind] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [asc, setAsc] = useState(false);

  const { data: claims, isLoading } = useAdminClaims();

  const airlines = useMemo(
    () => Array.from(new Set((claims ?? []).map((c) => c.airline_name))).sort(),
    [claims],
  );

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
    if (regulation !== "all")
      list = list.filter((c) =>
        regulation === "none" ? !effectiveRegulation(c) : effectiveRegulation(c) === regulation,
      );
    if (airline !== "all") list = list.filter((c) => c.airline_name === airline);
    if (kind !== "all") list = list.filter((c) => (kind === "refundable" ? c.is_refundable : !c.is_refundable));
    if (from) list = list.filter((c) => c.flight_date >= from);
    if (to) list = list.filter((c) => c.flight_date <= to);
    return [...list].sort((a, b) => {
      const va = sortKey === "client" ? (a.client?.full_name ?? "") : ((a[sortKey] as string | number | null) ?? "");
      const vb = sortKey === "client" ? (b.client?.full_name ?? "") : ((b[sortKey] as string | number | null) ?? "");
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (asc ? 1 : -1);
    });
  }, [claims, search, status, regulation, airline, kind, from, to, sortKey, asc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
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
    <AdminShell title="Claims queue" subtitle="Review, price and progress every passenger claim.">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search client, airline, flight or reference"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-background"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44 bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CLAIM_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={regulation} onValueChange={setRegulation}>
          <SelectTrigger className="w-44 bg-background"><SelectValue placeholder="Regulation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regulations</SelectItem>
            <SelectItem value="none">Not matched</SelectItem>
            {REGULATION_BADGES.map((r) => (
              <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={airline} onValueChange={setAirline}>
          <SelectTrigger className="w-44 bg-background"><SelectValue placeholder="Airline" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All airlines</SelectItem>
            {airlines.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-48 bg-background"><SelectValue placeholder="Claim type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Refundable & complaint</SelectItem>
            <SelectItem value="refundable">Refundable only</SelectItem>
            <SelectItem value="complaint">Complaint only</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40 bg-background" aria-label="Flights from" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40 bg-background" aria-label="Flights to" />
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
                        <button type="button" onClick={() => toggleSort(h.key as SortKey)} className="inline-flex items-center gap-1 hover:text-navy">
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
                  <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-muted-foreground">Loading claims…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-muted-foreground">No claims match this filter.</td></tr>
                ) : (
                  rows.map((c) => (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-navy">{c.client?.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{c.client?.email ?? ""}</div>
                        <div className="text-xs text-muted-foreground">{c.client?.phone ?? ""}</div>
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
                          View details
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
    </AdminShell>
  );
}
