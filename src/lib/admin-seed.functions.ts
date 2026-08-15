import { createServerFn } from "@tanstack/react-start";

export const seedAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
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
    if (!found) throw new Error(created.error?.message ?? "admin user not found");
    userId = found.id;
    await supabaseAdmin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  }

  const { error } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  if (error) throw error;
  return { ok: true, userId };
});
