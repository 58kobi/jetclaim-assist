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
  // Holds only unread notifications; read ones are removed immediately.
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const fetchUnread = useCallback(async () => {
    const { data } = await supabase
      .from("admin_notifications")
      .select("id, case_id, type, message, is_read, created_at")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data as AdminNotification[]);
  }, []);

  useEffect(() => {
    void fetchUnread();

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
      void supabase.removeChannel(channel);
    };
  }, [fetchUnread]);

  const markRead = useCallback((id: string) => {
    // Remove from the unread list right away so the badge count drops.
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    void supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("id", id)
      .then(({ error }) => {
        if (error) toast.error("Could not mark the notification as read.");
      });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const ids = prev.map((n) => n.id);
      if (ids.length) {
        void supabase
          .from("admin_notifications")
          .update({ is_read: true })
          .in("id", ids)
          .then(({ error }) => {
            if (error) toast.error("Could not mark notifications as read.");
          });
      }
      return [];
    });
  }, []);

  const unreadCount = notifications.length;

  return { notifications, unreadCount, markRead, markAllRead };
}
