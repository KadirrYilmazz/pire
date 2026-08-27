const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const client=fs.readFileSync(path.join(__dirname,'..','pire-account-honorific.js'),'utf8');
const assistant=fs.readFileSync(path.join(__dirname,'..','pire-assistant.js'),'utf8');
const bundle=fs.readFileSync(path.join(__dirname,'..','assets','page-C14w5Jqo.js'),'utf8');
const manager=fs.readFileSync(path.join(__dirname,'..','supabase','functions','pire-manage-users','index.ts'),'utf8');

test('account form adds an explicit honorific without guessing from the name',()=>{
  assert.match(client,/name="gender" required/);
  assert.match(client,/value="Erkek">Bey/);
  assert.match(client,/value="Kadın">Hanım/);
  assert.doesNotMatch(client,/Ayşe|Mehmet|isimden|nameGender/);
});

test('local accounts retain gender and approved Burak and Mustafa accounts are migrated',()=>{
  assert.match(client,/pire-local-admin-accounts-v2/);
  assert.match(client,/record\.gender=gender/);
  assert.match(client,/\["YON-0002",\/\^burak/);
  assert.match(client,/\["YON-0003",\/\^mustafa/);
  assert.match(client,/item\.gender="Erkek"/);
});

test('assistant falls back to the local account profile only for honorific',()=>{
  assert.match(assistant,/function localProfileGender\(\)/);
  assert.match(assistant,/pire-user-accounts-cache-v1/);
  assert.match(assistant,/Promise\.resolve\(localProfileGender\(\)\)/);
});

test('Supabase account persists the selected honorific even when a local cache record exists',()=>{
  assert.match(client,/if\(access\)fetch\("\/api\/account-gender"/);
  assert.doesNotMatch(client,/if\(!local&&access\)/);
});

test('parent account uses the registered guardian and sends relationship data',()=>{
  assert.match(client,/student\?\.guardianName/);
  assert.match(client,/fullName\.readOnly=true/);
  assert.match(client,/name="relationship"/);
  assert.match(bundle,/gender:String\(t\.get\(`gender`\)/);
  assert.match(bundle,/relationship:String\(t\.get\(`relationship`\)/);
});

test('server validates students, permits multiple parents and writes relationship rows',()=>{
  assert.match(manager,/from\("pire_ai_students"\).*select\("id"\)/s);
  assert.match(manager,/linkedStudentId\) && role === "Öğrenci"/);
  assert.match(manager,/from\("pire_profile_students"\)\.upsert/);
  assert.match(manager,/user_id: created\.user\.id/);
});
