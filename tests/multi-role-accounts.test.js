const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const bundle=fs.readFileSync(path.join(__dirname,"../assets/page-C14w5Jqo.js"),"utf8");
const edge=fs.readFileSync(path.join(__dirname,"../supabase/functions/pire-manage-users/index.ts"),"utf8");
test("çoklu kimlik arayüzü",()=>{assert.match(bundle,/action:`update_roles`/);assert.match(bundle,/Kimlikleri düzenle/);assert.match(bundle,/function PireRoleEditor/)});
test("yönetici koruması",()=>{assert.match(bundle,/Açık yönetici oturumundan Yönetici kimliği kaldırılamaz/);assert.match(edge,/Kurumun son aktif Yönetici kimliği kaldırılamaz/)});
test("sunucu rol doğrulaması",()=>{assert.match(edge,/normalizeRoles\(payload\.roles\)/);assert.match(edge,/is_current: account\.id === userData\.user\.id/)});
