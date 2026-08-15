import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/seed-admin")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = "jetclaimsupport@gmail.com";
        const password = "!NapendaKenya@900!";

        let userId: string | null = null;
        const created = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: "JetClaim Admin" },
        });
        if (created.data.user) {
          userId = created.data.user.id;
        } else {
          const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const found = list.data.users.find((u) => u.email === email);
          if (!found) return new Response(JSON.stringify({ error: created.error?.message }), { status: 500 });
          userId = found.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, { password, email_confirm: true });
        }

        const { error } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
      },
    },
  },
});
