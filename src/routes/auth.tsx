import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/hooks/use-admin";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log In or Sign Up — JetClaim" },
      {
        name: "description",
        content: "Access your JetClaim account to track flight compensation claims and payouts.",
      },
      { property: "og:title", content: "Log In or Sign Up — JetClaim" },
      { property: "og:description", content: "Track your flight compensation claims with JetClaim." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const signupSchema = credentials.extend({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^\+?[0-9\s-]{7,20}$/, "Enter a valid phone number (digits, optional +)"),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const admin = await isAdminUser(data.user.id);
      navigate({ to: admin ? "/admin" : "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    const admin = data.user ? await isAdminUser(data.user.id) : false;
    setLoading(false);
    navigate({ to: admin ? "/admin" : "/dashboard", replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ email, password, fullName, phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. You're signed in.");
    navigate({ to: "/dashboard" });
  }

  return (
    <PageShell>
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-navy">Welcome to JetClaim</CardTitle>
            <CardDescription>Log in or create an account to manage your claims.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-navy text-navy-foreground hover:bg-navy-deep">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : "Log In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name">Full name</Label>
                    <Input id="signup-name" maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone">Phone number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      inputMode="tel"
                      maxLength={20}
                      placeholder="+44 7700 900123"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Required so our claims team can reach you about your case.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-navy text-navy-foreground hover:bg-navy-deep">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
