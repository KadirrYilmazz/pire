const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const client=fs.readFileSync(path.join(__dirname,'..','pire-account-honorific.js'),'utf8');
const api=require('../api/account-gender');

test('account form adds an explicit honorific without guessing from the name',()=>{
  assert.match(client,/name="gender" required/);
  assert.match(client,/value="Erkek">Bey/);
  assert.match(client,/value="Kadın">Hanım/);
  assert.doesNotMatch(client,/Ayşe|Mehmet|isimden|nameGender/);
});

test('honorific is persisted through canonical account API, not local account caches',()=>{
  assert.match(client,/fetch\("\/api\/account-gender"/);
  assert.doesNotMatch(client,/pire-local-admin-accounts-v2/);
  assert.doesNotMatch(client,/pire-user-accounts-cache-v1/);
  assert.doesNotMatch(client,/record\.gender=gender/);
  assert.doesNotMatch(client,/YON-0002|YON-0003/);
});

test('account gender API accepts active admin from singular or multi-role profile',()=>{
  assert.equal(api._test.isAdminProfile({status:'Aktif',role:'Yönetici',roles:[]}),true);
  assert.equal(api._test.isAdminProfile({status:'Aktif',role:'Eğitmen',roles:['Eğitmen','Yönetici']}),true);
  assert.equal(api._test.isAdminProfile({status:'Aktif',role:'Eğitmen',roles:['Eğitmen']}),false);
  assert.equal(api._test.isAdminProfile({status:'Pasif',role:'Yönetici',roles:['Yönetici']}),false);
});
