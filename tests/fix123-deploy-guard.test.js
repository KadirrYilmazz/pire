const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const script=fs.readFileSync(path.join(__dirname,'..','scripts','fix123-strip-legacy-backend.js'),'utf8');
const vercel=JSON.parse(fs.readFileSync(path.join(__dirname,'..','vercel.json'),'utf8'));

test('Vercel build always runs the Fix123 legacy-backend stripping guard',()=>{
  assert.equal(vercel.buildCommand,'node scripts/fix123-strip-legacy-backend.js');
});

test('deploy guard rejects recovered backend, local CRM and local account/read caches',()=>{
  for(const marker of [
    'pire-recovered-backend-v1',
    'pire-customers-safe-v1',
    'pire-local-admin-accounts-v2',
    'pire-user-accounts-cache-v1',
    'pire-notification-role-reads-v1'
  ])assert.match(script,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(script,/Operasyonel localStorage kalıntısı bulundu/);
});

test('smart-alert read state is converted to sessionStorage during deploy',()=>{
  assert.match(script,/sessionStorage\.getItem\(SMART_READ_KEY\)/);
  assert.match(script,/sessionStorage\.setItem\(SMART_READ_KEY/);
});
