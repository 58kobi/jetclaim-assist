import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowRight, Loader2, Mail, Plane } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { statusTone } from "@/lib/jetclaim";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Claims — JetClaim Dashboard" },
      { name: "description", content: "Track the status of your flight compensation claims with JetClaim." },
      { property: "og:title", content: "My Claims — JetClaim Dashboard" },
      { property: "og:description", content: "Follow every step of your flight claim in one place." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: claims, isLoading } = useQuery({
    queryKey: ["claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold text-navy">Your Dashboard</h1>
          <Button asChild className="gap-2 bg-navy text-navy-foreground hover:bg-navy-deep">
            <Link to="/claim">New Claim <ArrowRight className="size-4" /></Link>
          </Button>
        </div>

        <Tabs defaultValue="claims" className="mt-8">
          <TabsList>
            <TabsTrigger value="claims">My Claims</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="mt-6 space-y-4">
            {isLoading ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : claims && claims.length > 0 ? (
              claims.map((claim) => (
                <Card key={claim.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                    <div>
                      <div className="flex items-center gap-2 text-lg font-bold text-navy">
                        <Plane className="size-4 -rotate-45 text-brand-blue" />
                        {claim.airline_name} · {claim.flight_number}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {claim.flight_date} · {claim.issue_type} · Ref {claim.reference}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusTone(claim.status))}>
                        {claim.status}
                      </span>
                      <Link
                        to="/claims/$claimId"
                        params={{ claimId: claim.id }}
                        className="text-sm font-semibold text-brand-blue hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">You haven't filed a claim yet.</p>
                  <Button asChild className="mt-4 bg-navy text-navy-foreground hover:bg-navy-deep">
                    <Link to="/claim">File your first claim</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ProfilePanel />
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-navy">Need a hand?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-brand-blue" /> jetclaimsupport@gmail.com
                </p>
                <p>Our claims team replies within 40 minutes, open Monday to Sunday.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}

function ProfilePanel() {
  const [saving, setSaving] = useState(false);
  const { data: profile, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [fullName, setFullName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName ?? profile?.full_name ?? "",
        phone: phone ?? profile?.phone ?? "",
      })
      .eq("id", auth.user!.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    refetch();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-navy">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pname">Full name</Label>
          <Input
            id="pname"
            maxLength={100}
            value={fullName ?? profile?.full_name ?? ""}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pemail">Email</Label>
          <Input id="pemail" value={profile?.email ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pphone">Phone</Label>
          <Input
            id="pphone"
            maxLength={30}
            value={phone ?? profile?.phone ?? ""}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <Button onClick={save} disabled={saving} className="bg-navy text-navy-foreground hover:bg-navy-deep">
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
