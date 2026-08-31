const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','api','catalog.js'),'utf8');
const migration=fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260901_fix123_safe_teacher_directory.sql'),'utf8');

test('non-admin catalog uses safe teacher directory instead of sensitive teacher table',()=>{
  assert.match(source,/identity\.roles\.includes\("Yönetici"\)\?await getAdminCatalog\(token\):await getSafeCatalog\(token\)/);
  const safe=source.slice(source.indexOf('async function getSafeCatalog'),source.indexOf('module.exports=async function handler'));
  assert.match(safe,/pire_teacher_directory\?select=teacher_id,full_name,status/);
  for(const sensitive of ['national_id','iban','compensation_amount','backup_phone','address','emergency_contact'])assert.doesNotMatch(safe,new RegExp(sensitive));
});

test('teacher directory migration exposes only safe columns with RLS',()=>{
  assert.match(migration,/create table if not exists public\.pire_teacher_directory/);
  assert.match(migration,/alter table public\.pire_teacher_directory enable row level security/);
  assert.match(migration,/grant select on table public\.pire_teacher_directory to authenticated/);
  assert.match(migration,/revoke insert, update, delete/);
  assert.match(migration,/private\.sync_pire_teacher_directory/);
  assert.doesNotMatch(migration,/grant execute on function public\.pire_get_safe_catalog/);
});
