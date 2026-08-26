const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const cleanup=fs.readFileSync(path.join(__dirname,'..','pire-customer-role-cleanup.js'),'utf8');
const language=fs.readFileSync(path.join(__dirname,'..','pire-language.js'),'utf8');
const page=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('customer is removed from account and visitor role choices',()=>{
  assert.match(cleanup,/function removeAccountRole\(\)/);
  assert.match(cleanup,/function removeVisitorRole\(\)/);
  assert.match(cleanup,/select\.dataset\.safeCustomerRole="1"/);
  assert.match(cleanup,/customerOptions\.forEach\(option=>option\.remove\(\)\)/);
  assert.match(cleanup,/\.visitor-role-grid button/);
  assert.match(cleanup,/if\(isCustomer\(label\)\)button\.remove\(\)/);
});

test('cleanup is loaded with the existing safe bootstrap',()=>{
  assert.match(language,/loadCustomerRoleCleanup/);
  assert.match(language,/pire-customer-role-cleanup\.js/);
});

test('customer CRM creation remains available outside user accounts',()=>{
  assert.match(page,/Müşteriler/);
  assert.match(page,/\+ Yeni müşteri/);
  assert.match(page,/Müşteriyi kaydet/);
  assert.match(page,/window\.PIRE_SAFE_CUSTOMER_CRM/);
});
