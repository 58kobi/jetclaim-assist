import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, Loader2, ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { CLAIM_STATUSES, REGULATION_BADGES, formatMoney } from "@/lib/jetclaim";

export const Route = createFileRoute("/_authenticated/admin/claims/$claimId")({
  head: () => ({
    meta: [
      { title: "Claim Review — JetClaim Admin" },
      { name: "description", content: "Internal review screen for a single JetClaim passenger claim." },
      { property: "og:title", content: "Claim Review — JetClaim Admin" },
      { property: "og:description", content: "Set compensation, fees, status and internal notes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminClaimReview,
});

function buildClaimLetter(claim: any, client: any) {
  const reg = REGULATION_BADGES.find((r) => r.code === claim.regulation_code);
  const amount = formatMoney(
    claim.compensation_amount != null ? Number(claim.compensation_amount) : null,
    claim.compensation_currency ?? "EUR",
  );
  return `To: ${claim.airline_name} — Customer Relations
Date: ${new Date().toLocaleDateString("en-GB")}
Re: Compensation claim ${claim.reference} — flight ${claim.flight_number} on ${claim.flight_date}

Dear Sir or Madam,

We act on behalf of ${client?.full_name ?? "our client"} (${client?.email ?? ""}${client?.phone ? `, ${client.phone}` : ""}) in relation to flight ${claim.flight_number} from ${claim.departure_airport} to ${claim.arrival_airport} on ${claim.flight_date}.

Incident type: ${claim.issue_type}
Passenger account: ${claim.description ?? "See attached documentation."}

Under ${reg ? `${reg.label} (${reg.detail})` : "the applicable international passenger rights regulation"}, our client is entitled to compensation for this disruption. We therefore request payment of ${amount} within 14 days of the date of this letter.

Please direct all correspondence regarding this matter to JetClaim at jetclaimsupport@gmail.com, quoting reference ${claim.reference}.

Yours faithfully,
JetClaim Claims Team
We Fight. You Fly.`;
}

function AdminClaimReview() {
  const { claimId } = Route.useParams();
  const { isAdmin, loading } = useIsAdmin();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);

  const [refundable, setRefundable] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [fee, setFee] = useState("");
  const [regulation, setRegulation] = useState("none");
  const [status, setStatus] = useState("Submitted");
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-claim", claimId],
    queryFn: async () => {
      const { data: claim, error } = await supabase.from("claims").select("*").eq("id", claimId).single();
      if (error) throw error;
      const { data: client } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .eq("id", claim.user_id)
        .maybeSingle();
      const { data: docs } = await supabase
        .from("claim_documents")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at");
      return { claim, client, docs: docs ?? [] };
    },
  });

  const claim = data?.claim;

  useEffect(() => {
    if (!claim) return;
    setRefundable(!!claim.is_refundable);
    setAmount(claim.compensation_amount != null ? String(claim.compensation_amount) : "");
    setCurrency(claim.compensation_currency ?? "EUR");
    setFee(claim.jetclaim_fee_amount != null ? String(claim.jetclaim_fee_amount) : "");
    setRegulation(claim.regulation_code ?? "none");
    setStatus(claim.status);
    setNotes(claim.internal_notes ?? "");
  }, [claim]);

  if (loading || (isAdmin && isLoading)) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-4 py-20">
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
          <p className="mt-2 text-sm text-muted-foreground">Admin access only.</p>
        </div>
      </PageShell>
    );
  }

  if (!claim) return null;

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("claims")
      .update({
        is_refundable: refundable,
        compensation_amount: amount === "" ? null : Number(amount),
        compensation_currency: currency,
        jetclaim_fee_amount: fee === "" ? null : Number(fee),
        regulation_code: regulation === "none" ? null : regulation,
        status,
        internal_notes: notes,
        fee_status: fee === "" ? "not_set" : data!.claim.fee_status === "settled" ? "settled" : "pending",
      })
      .eq("id", claimId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Claim updated.");
    queryClient.invalidateQueries({ queryKey: ["admin-claim", claimId] });
    queryClient.invalidateQueries({ queryKey: ["admin-claims"] });
  }

  async function openDocument(path: string) {
    const { data: signed, error } = await supabase.storage
      .from("claim-documents")
      .createSignedUrl(path, 300);
    if (error || !signed) {
      toast.error(error?.message ?? "Could not open document.");
      return;
    }
    window.open(signed.signedUrl, "_blank", "noopener");
  }

  function downloadLetter() {
    if (!letter) return;
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claim-letter-${data!.claim.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:underline">
          <ArrowLeft className="size-4" /> Back to queue
        </Link>

        <h1 className="mt-4 text-3xl font-extrabold text-navy">
          {claim.airline_name} · {claim.flight_number}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Reference {claim.reference}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-navy">Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Full name" value={data?.client?.full_name ?? "—"} />
                <Row label="Email" value={data?.client?.email ?? "—"} />
                <Row label="Phone" value={data?.client?.phone ?? "—"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-navy">Flight & incident</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Route" value={`${claim.departure_airport} → ${claim.arrival_airport}`} />
                <Row label="Date" value={claim.flight_date} />
                <Row label="Incident" value={claim.issue_type} />
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                    {claim.description || "No description provided."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-navy">Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data?.docs.length ? (
                  data.docs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => openDocument(d.file_path)}
                      className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:border-brand-blue"
                    >
                      <FileText className="size-4 text-brand-blue" />
                      <span className="truncate">{d.file_name}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-navy">Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                  <div>
                    <Label htmlFor="refundable">Refundable claim</Label>
                    <p className="text-xs text-muted-foreground">Turn on for compensation/refund cases.</p>
                  </div>
                  <Switch id="refundable" checked={refundable} onCheckedChange={setRefundable} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Compensation confirmed</Label>
                    <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="600" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["EUR", "GBP", "USD", "CAD", "INR", "BRL", "KES"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fee">JetClaim fee</Label>
                    <Input id="fee" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="150" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="regulation">Regulation matched</Label>
                    <Select value={regulation} onValueChange={setRegulation}>
                      <SelectTrigger id="regulation">
                        <SelectValue placeholder="Select regulation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not matched yet</SelectItem>
                        {REGULATION_BADGES.map((r) => (
                          <SelectItem key={r.code} value={r.code}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLAIM_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Internal notes (never shown to the client)</Label>
                  <Textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={save} disabled={saving} className="bg-navy text-navy-foreground hover:bg-navy-deep">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setLetter(buildClaimLetter(claim, data?.client))}>
                    <FileText className="size-4" /> Generate Claim Letter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {letter ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-navy">Claim letter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea rows={16} value={letter} onChange={(e) => setLetter(e.target.value)} className="font-mono text-xs" />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={downloadLetter}>
                      <Download className="size-4" /> Download
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(letter);
                        toast.success("Letter copied.");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}
