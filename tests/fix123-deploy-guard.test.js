const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const script=fs.readFileSync(path.join(__dirname,'..','scripts','fix123-strip-legacy-backend.js'),'utf8');
const vercel=JSON.parse(fs.readFileSync(path.join(__dirname,'..','vercel.json'),'utf8'));

test('Vercel build always runs the Fix123 legacy-backend stripping guard',()=>{
  assert.equal(vercel.buildCommand,'node scripts/fix123-strip-legacy-backend.js');
});

test('deploy guard rejects operational localStorage persistence while allowing read-only compatibility references',()=>{
  for(const marker of [
    'pire-customers-safe-v1',
    'pire-local-admin-accounts-v2',
    'pire-user-accounts-cache-v1',
    'pire-notification-role-reads-v1',
    'localStorage.setItem(DBKEY',
    'localStorage.removeItem(DBKEY'
  ])assert.match(script,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(script,/Operasyonel localStorage kalıcı yazma kalıntısı bulundu/);
  assert.match(script,/tarihsel uyumluluk kodu eski DB anahtarını salt-okunur olarak/);
});

test('smart-alert read state is converted to sessionStorage during deploy',()=>{
  assert.match(script,/sessionStorage\.getItem\(SMART_READ_KEY\)/);
  assert.match(script,/sessionStorage\.setItem\(SMART_READ_KEY/);
});

test('deploy output removes temporary theme mutations before React hydration',()=>{
  assert.match(script,/replace\('<html lang="tr" data-theme="dark">','<html lang="tr">'\)/);
  assert.match(script,/data-pire-hydration-theme/);
  assert.match(script,/RSC kökünde beklenmeyen data-theme niteliği kaldı/);
});

test('React bootstrap loads compatibility patches only after hydration frames',()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  assert.match(html,/<script type="module" id="_R_">import "\/assets\/index-BS0ANsbn\.js";<\/script>/);
  assert.doesNotMatch(html,/<script id="_R_">import\("\/assets\/index-BS0ANsbn\.js"\)<\/script>/);
  assert.match(script,/await import\("\/assets\/index-BS0ANsbn\.js"\)/);
  assert.match(script,/requestAnimationFrame\(\(\)=>requestAnimationFrame\(resolve\)\)/);
  for(const src of [
    '/pire-notification-scope.js',
    '/pire-dashboard-calendar.js',
    '/pire-global-search.js',
    '/pire-student-wizard.js',
    '/pire-background-music.js',
    '/pire-language.js',
    '/pire-login-notification.js',
    '/pire-canonical-customers.js?v=1'
  ])assert.match(script,new RegExp(src.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(script,/Fix134 hydration öncesi script kaldı/);
});
