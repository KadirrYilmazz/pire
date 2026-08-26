import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "Yönetici" | "Eğitmen" | "Öğrenci" | "Veli";
type CreateRole = Exclude<Role, "Yönetici">;
type Gender = "Erkek" | "Kadın" | "Belirtilmedi";
const allowedRelationships = ["Kendi", "Anne", "Baba", "Vasi", "Diğer"];
const allowedRoles: Role[] = ["Yönetici", "Eğitmen", "Öğrenci", "Veli"];
const createRoles: CreateRole[] = ["Eğitmen", "Öğrenci", "Veli"];
const prefixes: Record<CreateRole, string> = { "Eğitmen": "EGT", "Öğrenci": "OGR", "Veli": "VEL" };

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalizeRoles(value: unknown): Role[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String))].filter((role): role is Role => allowedRoles.includes(role as Role));
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
  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!supabaseUrl || !anonKey || !serviceKey || !token) return reply(401, { error: "Oturum doğrulanamadı." });

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser(token);
  if (userError || !userData.user) return reply(401, { error: "Oturum geçersiz veya süresi dolmuş." });

  const { data: caller, error: callerError } = await callerClient
    .from("pire_profiles")
    .select("id,role,roles,status")
    .eq("id", userData.user.id)
    .single();
  const callerRoles = Array.isArray(caller?.roles) ? caller.roles : [caller?.role];
  if (callerError || !caller || !callerRoles.includes("Yönetici") || caller.status !== "Aktif") {
    return reply(403, { error: "Bu işlem yalnızca aktif yönetici hesabına açıktır." });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return reply(400, { error: "Geçersiz istek." }); }
  const action = String(payload.action || "");

  try {
    if (action === "set_own_phone") {
      const phone = normalizePhone(payload.phone);
      if (!phone) return reply(400, { error: "Geçerli bir Türkiye telefon numarası girin." });
      const { error: authError } = await admin.auth.admin.updateUserById(userData.user.id, { phone, phone_confirm: true });
      if (authError) throw authError;
      const { error: profileError } = await admin.from("pire_profiles").update({ phone, updated_at: new Date().toISOString() }).eq("id", userData.user.id);
      if (profileError) throw profileError;
      return reply(200, { ok: true, phone });
    }

    if (action === "list") {
      const { data, error } = await admin
        .from("pire_profiles")
        .select("id,institution_id,email,phone,full_name,role,roles,status,must_change_password,linked_student_id,linked_teacher_id,gender,last_login_at,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return reply(200, { accounts: (data || []).map((account) => ({ ...account, is_current: account.id === userData.user.id })) });
    }

    if (action === "create") {
      const role = String(payload.role || "") as CreateRole;
      const phone = normalizePhone(payload.phone);
      const password = String(payload.password || "");
      const fullName = String(payload.full_name || "").trim();
      const gender = String(payload.gender || "Belirtilmedi") as Gender;
      const relationship = role === "Öğrenci" ? "Kendi" : String(payload.relationship || "Diğer");
      if (!createRoles.includes(role)) return reply(400, { error: "Geçersiz kullanıcı rolü." });
      if (!phone) return reply(400, { error: "Geçerli bir Türkiye telefon numarası girin." });
      if (password.length < 8) return reply(400, { error: "Geçici şifre en az 8 karakter olmalıdır." });
      if (!fullName) return reply(400, { error: "Ad soyad zorunludur." });
      if (!["Erkek", "Kadın", "Belirtilmedi"].includes(gender)) return reply(400, { error: "Geçersiz hitap bilgisi." });
      if ((role === "Öğrenci" || role === "Veli") && !allowedRelationships.includes(relationship)) return reply(400, { error: "Geçersiz yakınlık bilgisi." });

      const linkedStudentId = payload.linked_student_id ? Number(payload.linked_student_id) : null;
      const linkedTeacherId = payload.linked_teacher_id ? String(payload.linked_teacher_id) : null;
      if (role === "Eğitmen" && !linkedTeacherId) return reply(400, { error: "Eğitmen hesabı için bağlı eğitmen kaydı zorunludur." });
      if ((role === "Öğrenci" || role === "Veli") && !Number.isFinite(linkedStudentId)) return reply(400, { error: "Bu hesap için bağlı öğrenci kaydı zorunludur." });
      if (Number.isFinite(linkedStudentId)) {
        const { data: student, error: studentError } = await admin.from("pire_ai_students").select("id").eq("id", linkedStudentId).maybeSingle();
        if (studentError) throw studentError;
        if (!student) return reply(400, { error: "Seçilen öğrenci kaydı bulunamadı. Önce öğrenci verilerini eşitleyin." });
      }
      if (linkedTeacherId) {
        const { data: existingLink, error: linkError } = await admin.from("pire_profiles").select("institution_id").eq("linked_teacher_id", linkedTeacherId).neq("status", "Pasif").maybeSingle();
        if (linkError) throw linkError;
        if (existingLink) return reply(409, { error: `Bu eğitmen zaten ${existingLink.institution_id} kimliğiyle kayıtlı.` });
      }
      if (Number.isFinite(linkedStudentId) && role === "Öğrenci") {
        const { data: existingLinks, error: linkError } = await admin.from("pire_profiles").select("institution_id,roles").eq("linked_student_id", linkedStudentId).contains("roles", ["Öğrenci"]);
        if (linkError) throw linkError;
        if (existingLinks?.length) return reply(409, { error: `Bu kişi zaten ${existingLinks[0].institution_id} kimliğiyle kayıtlı.` });
      }

      const prefix = prefixes[role];
      const { data: ids, error: idsError } = await admin.from("pire_profiles").select("institution_id").like("institution_id", `${prefix}-%`);
      if (idsError) throw idsError;
      const next = (ids || []).reduce((max: number, row: { institution_id: string }) => {
        const value = Number(row.institution_id.split("-")[1]);
        return Number.isFinite(value) ? Math.max(max, value) : max;
      }, 0) + 1;
      const institutionId = `${prefix}-${String(next).padStart(4, "0")}`;
      const internalEmail = `${phone.replace(/\D/g, "")}@phone.pire.local`;

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: internalEmail,
        email_confirm: true,
        phone,
        password,
        phone_confirm: true,
        app_metadata: { pire_role: role, pire_roles: [role], pire_institution_id: institutionId },
        user_metadata: { full_name: fullName },
      });
      if (createError || !created.user) throw createError || new Error("Hesap oluşturulamadı.");

      const { error: updateError } = await admin.from("pire_profiles").update({
        institution_id: institutionId,
        phone,
        email: internalEmail,
        full_name: fullName,
        role,
        roles: [role],
        status: "Aktif",
        must_change_password: true,
        linked_student_id: Number.isFinite(linkedStudentId) ? linkedStudentId : null,
        linked_teacher_id: linkedTeacherId || null,
        gender,
        created_by: userData.user.id,
        updated_at: new Date().toISOString(),
      }).eq("id", created.user.id);
      if (updateError) {
        await admin.auth.admin.deleteUser(created.user.id);
        throw updateError;
      }
      if (Number.isFinite(linkedStudentId)) {
        const { error: relationError } = await admin.from("pire_profile_students").upsert({ profile_id: created.user.id, student_id: linkedStudentId, relationship }, { onConflict: "profile_id,student_id" });
        if (relationError) {
          await admin.auth.admin.deleteUser(created.user.id);
          throw relationError;
        }
      }
      return reply(200, { ok: true, institution_id: institutionId, user_id: created.user.id, phone });
    }

    const targetId = String(payload.user_id || "");
    if (!targetId) return reply(400, { error: "Geçersiz hedef hesap." });
    const { data: target, error: targetError } = await admin.from("pire_profiles").select("id,role,roles,status").eq("id", targetId).single();
    if (targetError || !target) return reply(400, { error: "Bu hesap üzerinde işlem yapılamaz." });
    const targetRoles = Array.isArray(target.roles) ? target.roles : [target.role];

    if (action === "update_roles") {
      const roles = normalizeRoles(payload.roles);
      const primaryRole = String(payload.primary_role || "") as Role;
      if (!roles.length || !roles.includes(primaryRole)) return reply(400, { error: "En az bir kimlik ve bu kimliklerden bir ana rol seçin." });
      if (targetId === userData.user.id && !roles.includes("Yönetici")) return reply(400, { error: "Açık yönetici oturumundan Yönetici kimliği kaldırılamaz." });
      if (targetRoles.includes("Yönetici") && !roles.includes("Yönetici")) {
        const { data: managers, error: managerError } = await admin.from("pire_profiles").select("id").contains("roles", ["Yönetici"]).eq("status", "Aktif").neq("id", targetId).limit(1);
        if (managerError) throw managerError;
        if (!managers?.length) return reply(400, { error: "Kurumun son aktif Yönetici kimliği kaldırılamaz." });
      }
      const linkedStudentId = payload.linked_student_id ? Number(payload.linked_student_id) : null;
      const linkedTeacherId = payload.linked_teacher_id ? String(payload.linked_teacher_id) : null;
      if (roles.includes("Eğitmen") && !linkedTeacherId) return reply(400, { error: "Eğitmen kimliği için bağlı eğitmen kaydı zorunludur." });
      if ((roles.includes("Öğrenci") || roles.includes("Veli")) && !Number.isFinite(linkedStudentId)) return reply(400, { error: "Öğrenci veya Veli kimliği için bağlı öğrenci kaydı zorunludur." });
      if (Number.isFinite(linkedStudentId)) {
        const { data: student, error: studentError } = await admin.from("pire_ai_students").select("id").eq("id", linkedStudentId).maybeSingle();
        if (studentError) throw studentError;
        if (!student) return reply(400, { error: "Seçilen öğrenci kaydı bulunamadı." });
      }
      if (linkedTeacherId) {
        const { data: existingLink, error: linkError } = await admin.from("pire_profiles").select("institution_id").eq("linked_teacher_id", linkedTeacherId).neq("id", targetId).neq("status", "Pasif").maybeSingle();
        if (linkError) throw linkError;
        if (existingLink) return reply(409, { error: "Bu eğitmen zaten " + existingLink.institution_id + " kimliğiyle kayıtlı." });
      }
      if (roles.includes("Öğrenci") && Number.isFinite(linkedStudentId)) {
        const { data: existingLinks, error: linkError } = await admin.from("pire_profiles").select("institution_id").eq("linked_student_id", linkedStudentId).contains("roles", ["Öğrenci"]).neq("id", targetId).limit(1);
        if (linkError) throw linkError;
        if (existingLinks?.length) return reply(409, { error: "Bu öğrenci zaten " + existingLinks[0].institution_id + " kimliğiyle kayıtlı." });
      }
      const { error: profileError } = await admin.from("pire_profiles").update({ role: primaryRole, roles, linked_student_id: Number.isFinite(linkedStudentId) ? linkedStudentId : null, linked_teacher_id: linkedTeacherId || null, updated_at: new Date().toISOString() }).eq("id", targetId);
      if (profileError) throw profileError;
      await admin.from("pire_profile_students").delete().eq("profile_id", targetId);
      if (Number.isFinite(linkedStudentId)) {
        const relationship = roles.includes("Öğrenci") ? "Kendi" : "Diğer";
        const { error: relationError } = await admin.from("pire_profile_students").upsert({ profile_id: targetId, student_id: linkedStudentId, relationship }, { onConflict: "profile_id,student_id" });
        if (relationError) throw relationError;
      }
      return reply(200, { ok: true, role: primaryRole, roles });
    }
    if (targetId === userData.user.id || targetRoles.includes("Yönetici")) return reply(400, { error: "Bu hesap üzerinde bu işlem yapılamaz." });

    if (action === "set_status") {
      const status = String(payload.status || "");
      if (!["Aktif", "Pasif"].includes(status)) return reply(400, { error: "Geçersiz hesap durumu." });
      const { error } = await admin.from("pire_profiles").update({ status, updated_at: new Date().toISOString() }).eq("id", targetId);
      if (error) throw error;
      return reply(200, { ok: true });
    }
    if (action === "sync_phone") {
      const phone = normalizePhone(payload.phone);
      if (!phone) return reply(400, { error: "Bağlı kartta geçerli bir telefon numarası bulunmuyor." });
      const { error: authError } = await admin.auth.admin.updateUserById(targetId, { phone, phone_confirm: true });
      if (authError) throw authError;
      const { error: profileError } = await admin.from("pire_profiles").update({ phone, updated_at: new Date().toISOString() }).eq("id", targetId);
      if (profileError) throw profileError;
      return reply(200, { ok: true, phone });
    }
    if (action === "reset_password") {
      const password = String(payload.password || "");
      if (password.length < 8) return reply(400, { error: "Yeni geçici şifre en az 8 karakter olmalıdır." });
      const { error } = await admin.auth.admin.updateUserById(targetId, { password });
      if (error) throw error;
      await admin.from("pire_profiles").update({ must_change_password: true, updated_at: new Date().toISOString() }).eq("id", targetId);
      return reply(200, { ok: true });
    }
    if (action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error) throw error;
      return reply(200, { ok: true });
    }
    return reply(400, { error: "Bilinmeyen işlem." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İşlem tamamlanamadı.";
    return reply(400, { error: message });
  }
});

