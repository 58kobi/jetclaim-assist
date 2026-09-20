import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, CreditCard, Info, Loader2 } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useClaimsRealtime } from "@/hooks/use-claims-realtime";
import { PaymentAppPicker, PaymentAppLinks } from "@/components/PaymentAppFlow";
import { useAdminRedirect } from "@/components/admin/admin-redirect";
import {
  COMPLAINT_TIMELINE,
  REFUNDABLE_TIMELINE,
  formatMoney,
  statusTone,
} from "@/lib/jetclaim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/claims/$claimId")({
  head: () => ({
    meta: [
      { title: "Claim Details — JetClaim" },
      { name: "description", content: "See the status, compensation and payout details of your flight claim." },
      { property: "og:title", content: "Claim Details — JetClaim" },
      { property: "og:description", content: "Track your flight claim from review to payout." },
    ],
  }),
  component: ClaimDetail,
});

function ClaimDetail() {
  const { claimId } = Route.useParams();
  const adminGuard = useAdminRedirect();
  const queryClient = useQueryClient();
  const { flash } = useClaimsRealtime(claimId);

  const { data: claim, isLoading } = useQuery({
    queryKey: ["claims", claimId],
    queryFn: async () => {
      const { data, error } = await supabase.from("claims").select("*").eq("id", claimId).single();
      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: true,
  });

  const { data: bank } = useQuery({
    queryKey: ["bank-details", claimId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_details")
        .select("*")
        .eq("claim_id", claimId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (adminGuard) return <PageShell>{adminGuard}</PageShell>;

  if (isLoading || !claim) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl px-4 py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const timeline = claim.is_refundable ? REFUNDABLE_TIMELINE : COMPLAINT_TIMELINE;
  const currentIndex = Math.max(
    0,
    (timeline as readonly string[]).findIndex((s) => s === claim.status),
  );
  const feeSettled = claim.fee_status === "settled";
  const netPayout =
    claim.compensation_amount != null && claim.jetclaim_fee_amount != null
      ? Number(claim.compensation_amount) - Number(claim.jetclaim_fee_amount)
      : null;

  async function settleFee(method: string) {
    const { error } = await supabase
      .from("claims")
      .update({ fee_status: "settled", status: "Awaiting Payout" })
      .eq("id", claimId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Fee settlement recorded via ${method}.`);
    queryClient.invalidateQueries({ queryKey: ["claims"] });
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:underline">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-navy">
              {claim.airline_name} · {claim.flight_number}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {claim.flight_date} · {claim.departure_airport} → {claim.arrival_airport} · Ref{" "}
              {claim.reference}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-500",
              statusTone(claim.status),
              flash && "ring-2 ring-brand-blue ring-offset-2 scale-105",
            )}
          >
            {claim.status}
          </span>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-navy">
              {claim.is_refundable ? "Compensation progress" : "Complaint progress"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {timeline.map((label, i) => (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border text-xs font-bold",
                      i <= currentIndex
                        ? "border-brand-blue bg-brand-blue text-navy-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {i <= currentIndex ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className={cn("text-sm", i <= currentIndex ? "font-semibold text-navy" : "text-muted-foreground")}>
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {claim.description ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-navy">What you told us</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{claim.description}</CardContent>
          </Card>
        ) : null}

        {claim.status === "Forwarded to Airline" && !claim.payment_app ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-navy">Choose where to receive your payout</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Select up to two apps you will download, then tell us which one you would like to
                receive your payout with.
              </p>
              <PaymentAppPicker caseId={claimId} />
            </CardContent>
          </Card>
        ) : null}

        {claim.payment_app ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-navy">Your payment apps</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentAppLinks
                caseId={claimId}
                apps={claim.apps_selected ?? []}
                payWith={claim.payment_app}
              />
            </CardContent>
          </Card>
        ) : null}

        {claim.is_refundable ? (
          <>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-navy">Compensation & fee breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <BreakdownRow
                  label="Compensation confirmed"
                  value={formatMoney(
                    claim.compensation_amount != null ? Number(claim.compensation_amount) : null,
                    claim.compensation_currency ?? "EUR",
                  )}
                />
                <BreakdownRow
                  label="JetClaim fee"
                  value={formatMoney(
                    claim.jetclaim_fee_amount != null ? Number(claim.jetclaim_fee_amount) : null,
                    claim.compensation_currency ?? "EUR",
                  )}
                />
                <BreakdownRow
                  label="You receive"
                  value={formatMoney(netPayout, claim.compensation_currency ?? "EUR")}
                  strong
                />
                {claim.jetclaim_fee_amount == null ? (
                  <p className="flex items-start gap-2 rounded-md bg-surface p-3 text-muted-foreground">
                    <Info className="mt-0.5 size-4 shrink-0 text-brand-blue" />
                    Your fee is agreed upfront. We'll show it here as soon as our team confirms your
                    compensation amount.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {feeSettled ? (
              <BankDetailsCard claimId={claimId} existing={bank} payoutWindow={claim.expected_payout_window} />
            ) : null}
          </>
        ) : null}
      </div>
    </PageShell>
  );
}

function BreakdownRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(strong ? "text-base font-bold text-navy" : "font-medium text-navy")}>{value}</span>
    </div>
  );
}

type BankRow = {
  account_holder: string;
  account_number: string;
  swift_bic: string | null;
  bank_name: string;
  country: string;
  currency: string;
} | null;

function BankDetailsCard({
  claimId,
  existing,
  payoutWindow,
}: {
  claimId: string;
  existing: BankRow | undefined;
  payoutWindow: string | null;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    account_holder: "",
    account_number: "",
    swift_bic: "",
    bank_name: "",
    country: "",
    currency: "EUR",
  });

  async function save() {
    if (!form.account_holder || !form.account_number || !form.bank_name || !form.country) {
      toast.error("Please complete all required bank fields.");
      return;
    }
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("bank_details").upsert(
      { claim_id: claimId, user_id: auth.user!.id, ...form },
      { onConflict: "claim_id" },
    );
    if (!error) {
      await supabase
        .from("claims")
        .update({ bank_details_submitted_at: new Date().toISOString(), status: "Awaiting Payout" })
        .eq("id", claimId);
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bank details submitted");
    queryClient.invalidateQueries({ queryKey: ["bank-details", claimId] });
    queryClient.invalidateQueries({ queryKey: ["claims", claimId] });
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-navy">Payout bank details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {existing ? (
          <div className="space-y-2 text-sm">
            <BreakdownRow label="Account holder" value={existing.account_holder} />
            <BreakdownRow label="Account / IBAN" value={existing.account_number} />
            <BreakdownRow label="Bank" value={`${existing.bank_name}, ${existing.country}`} />
            <BreakdownRow label="Currency" value={existing.currency} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account holder name" value={form.account_holder} onChange={(v) => setForm({ ...form, account_holder: v })} />
            <Field label="IBAN / account number" value={form.account_number} onChange={(v) => setForm({ ...form, account_number: v })} />
            <Field label="SWIFT / BIC" value={form.swift_bic} onChange={(v) => setForm({ ...form, swift_bic: v })} />
            <Field label="Bank name" value={form.bank_name} onChange={(v) => setForm({ ...form, bank_name: v })} />
            <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["EUR", "GBP", "USD", "CAD", "INR", "BRL", "TRY"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!existing ? (
          <Button onClick={save} disabled={saving} className="bg-navy text-navy-foreground hover:bg-navy-deep">
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Add Bank Details"}
          </Button>
        ) : null}

        <p className="rounded-md bg-surface p-3 text-sm text-muted-foreground">
          Once your bank details are submitted, payout typically takes{" "}
          {payoutWindow ?? "1–3 weeks (up to 6 weeks in some cases)"}.
        </p>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input maxLength={64} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
