import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  Bell,
  BookOpen,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  ShieldAlert,
  Table2,
  Users,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAdminAppNotifications } from "@/hooks/useAdminAppNotifications";

function relativeTime(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useAdminAppNotifications();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-brand-blue text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold text-navy">Notifications</span>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="text-xs text-brand-blue hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length ? (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  markRead(n.id);
                  navigate({ to: "/admin/claims/$claimId", params: { claimId: n.case_id } });
                }}
                className="block w-full border-b border-border px-3 py-2 text-left hover:bg-muted/50"
              >
                <p className="text-sm text-navy">{n.message}</p>
                <p className="text-xs text-muted-foreground">{relativeTime(n.created_at)}</p>
              </button>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/claims", label: "Claims queue", icon: Table2, exact: false },
  { to: "/admin/airlines", label: "Airlines & regulations", icon: BookOpen, exact: false },
  { to: "/admin/users", label: "Users", icon: Users, exact: false },
  { to: "/admin/payments", label: "Payments & payouts", icon: BadgeDollarSign, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 text-center">
        <ShieldAlert className="size-10 text-warning" />
        <h1 className="mt-4 text-2xl font-extrabold text-navy">Restricted area</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The JetClaim admin console is available to the admin account only.
        </p>
        <Button asChild className="mt-6 bg-navy text-navy-foreground hover:bg-navy-deep">
          <Link to="/dashboard">Back to your dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-navy text-navy-foreground lg:flex">
        <div className="flex h-20 items-center border-b border-white/10 px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              activeProps={{ className: "bg-white/15 text-navy-foreground" }}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-navy-foreground/75 transition-colors hover:bg-white/10 hover:text-navy-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-navy-foreground/75 hover:bg-white/10 hover:text-navy-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div>
              <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                Admin console
              </span>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-2 py-2 lg:hidden">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeProps={{ className: "bg-navy text-navy-foreground" }}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
