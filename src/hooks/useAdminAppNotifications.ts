import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type AdminNotification = {
  id: string;
  case_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function useAdminAppNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    let active = true;
    supabase
      .from("admin_notifications")
      .select("id, case_id, type, message, is_read, created_at")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (active && data) setNotifications(data as AdminNotification[]);
      });

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const row = payload.new as AdminNotification;
          setNotifications((prev) => [row, ...prev]);
          toast.info(row.message);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    void supabase.from("admin_notifications").update({ is_read: true }).eq("id", id);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const ids = prev.filter((n) => !n.is_read).map((n) => n.id);
      if (ids.length) void supabase.from("admin_notifications").update({ is_read: true }).in("id", ids);
      return prev.map((n) => ({ ...n, is_read: true }));
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, markRead, markAllRead };
}
