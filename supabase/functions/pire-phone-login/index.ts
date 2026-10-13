import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalizePhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("5")) return `+90${digits}`;
  if (digits.length === 11 && digits.startsWith("05")) return `+90${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("905")) return `+${digits}`;
  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Yalnızca POST desteklenir." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return reply(500, { error: "Giriş servisi hazır değil." });

  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return reply(400, { error: "Geçersiz istek." }); }
  const phone = normalizePhone(payload.phone);
  const password = String(payload.password || "");
  const genericError = "Telefon numarası veya şifre doğru değil.";
  if (!phone || password.length < 8) return reply(401, { error: genericError });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile } = await admin
    .from("pire_profiles")
    .select("id,email,status")
    .eq("phone", phone)
    .maybeSingle();
  if (!profile || profile.status !== "Aktif") return reply(401, { error: genericError });

  const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(profile.id);
  const email = authUser.user?.email || profile.email;
  if (authUserError || !email) return reply(401, { error: genericError });

  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) return reply(401, { error: genericError });

  await admin.from("pire_profiles").update({ last_login_at: new Date().toISOString() }).eq("id", profile.id);
  return reply(200, {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});
