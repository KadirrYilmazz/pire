const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const client=fs.readFileSync(path.join(__dirname,'..','pire-account-honorific.js'),'utf8');
const assistant=fs.readFileSync(path.join(__dirname,'..','pire-assistant.js'),'utf8');

test('account form adds an explicit honorific without guessing from the name',()=>{
  assert.match(client,/name="gender" required/);
  assert.match(client,/value="Erkek">Bey/);
  assert.match(client,/value="Kadın">Hanım/);
  assert.doesNotMatch(client,/Ayşe|Mehmet|isimden|nameGender/);
});

test('local accounts retain gender and the approved Burak account is migrated',()=>{
  assert.match(client,/pire-local-admin-accounts-v2/);
  assert.match(client,/record\.gender=gender/);
  assert.match(client,/institution_id==="YON-0002"/);
  assert.match(client,/burak\.gender="Erkek"/);
});

test('assistant falls back to the local account profile only for honorific',()=>{
  assert.match(assistant,/function localProfileGender\(\)/);
  assert.match(assistant,/pire-user-accounts-cache-v1/);
  assert.match(assistant,/Promise\.resolve\(localProfileGender\(\)\)/);
});
