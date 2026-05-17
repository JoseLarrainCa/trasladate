import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { email, password } = await req.json();
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const userId = data.user!.id;
  const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role: "admin" });
  const { error: profErr } = await admin.from("profiles").insert({ user_id: userId, email });

  return new Response(JSON.stringify({ userId, roleErr: roleErr?.message, profErr: profErr?.message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
