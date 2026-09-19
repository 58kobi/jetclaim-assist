import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { PAYMENT_APPS, detectPlatform, type AppKey } from "@/lib/paymentApps";

const APP_KEYS = Object.keys(PAYMENT_APPS) as AppKey[];

export function PaymentAppPicker({ caseId }: { caseId: string }) {
  const [selected, setSelected] = useState<AppKey[]>([]);
  const [payWith, setPayWith] = useState<AppKey | "">("");
  const [saving, setSaving] = useState(false);

  function toggle(app: AppKey, checked: boolean) {
    const next = checked ? [...selected, app] : selected.filter((a) => a !== app);
    setSelected(next);
    if (payWith && !next.includes(payWith)) setPayWith("");
  }

  async function submit() {
    if (!payWith) return;
    setSaving(true);
    const { error } = await supabase.rpc("set_payment_apps", {
      _case_id: caseId,
      _apps: selected,
      _payment_app: payWith,
      _platform: detectPlatform(),
    });
    setSaving(false);
    if (error) toast.error(error.message);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {APP_KEYS.map((app) => {
          const checked = selected.includes(app);
          const disabled = !checked && selected.length >= 2;
          return (
            <div key={app} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
              <Checkbox
                id={`app-${app}`}
                checked={checked}
                disabled={disabled}
                onCheckedChange={(v) => toggle(app, v === true)}
              />
              <Label htmlFor={`app-${app}`} className="cursor-pointer text-sm font-medium text-navy">
                {PAYMENT_APPS[app].name}
              </Label>
            </div>
          );
        })}
      </div>

      {selected.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy">Which one will you receive the payment with?</p>
          <RadioGroup value={payWith} onValueChange={(v) => setPayWith(v as AppKey)} className="space-y-2">
            {selected.map((app) => (
              <div key={app} className="flex items-center gap-3">
                <RadioGroupItem value={app} id={`pay-${app}`} />
                <Label htmlFor={`pay-${app}`} className="cursor-pointer text-sm">
                  {PAYMENT_APPS[app].name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ) : null}

      <Button
        onClick={submit}
        disabled={!payWith || saving}
        className="bg-navy text-navy-foreground hover:bg-navy-deep"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : "Continue"}
      </Button>
    </div>
  );
}

export function PaymentAppLinks({ caseId, apps, payWith }: { caseId: string; apps: string[]; payWith: string }) {
  const platform = detectPlatform();
  const storeLabel = platform === "ios" ? "iPhone · App Store" : "Android · Google Play";

  return (
    <div className="space-y-3">
      {apps.map((app) => {
        const meta = PAYMENT_APPS[app as AppKey];
        if (!meta) return null;
        return (
          <div
            key={app}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-navy">{meta.name}</span>
              <Badge variant="secondary">{storeLabel}</Badge>
              {app === payWith ? <Badge>Payment app</Badge> : null}
            </div>
            <a
              href={meta[platform]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                supabase.rpc("log_app_download_click", { _case_id: caseId, _app: app }).then(
                  () => {},
                  () => {},
                );
              }}
              className="rounded-md bg-brand-blue px-3 py-1.5 text-sm font-semibold text-white"
            >
              Download
            </a>
          </div>
        );
      })}
    </div>
  );
}
