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
  assert.match(script,/postHydrationStyles/);
  for(const href of ['/pire-dashboard-compact.css','/pire-global-search.css','/pire-student-wizard.css']){
    assert.match(script,new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.match(script,/document\.head\.appendChild\(link\)/);
  assert.match(script,/postHydrationInlineScripts/);
  assert.match(script,/__PIRE_INLINE_PATCHES__/);
  assert.match(script,/script\.textContent=code/);
  assert.match(script,/pire-header-safety-fix/);
  assert.match(script,/pire-student-edit-fix/);
  assert.match(script,/pire-hydration-main\.html/);
  assert.match(script,/class="visitor-workspace"/);
  assert.match(script,/kanonik hydration main güvenli olmayan içerik barındırıyor/);
  assert.match(script,/rscOutsideMarker/);
  assert.match(script,/self\.__VINEXT_RSC_DONE__=true/);
  assert.match(script,/html\.endsWith\(closedDocument\)/);
  assert.match(script,/Zr\.hydrateRoot/);
  assert.match(script,/Zr\.createRoot/);
  assert.match(script,/Fix136 tekil Vinext document hydration çağrısı bulunamadı/);
  assert.match(script,/hydrateExportMarker/);
  assert.match(script,/createRootExport/);
  assert.match(script,/Fix136 tekil React hydrateRoot exportu bulunamadı/);
  const hydrationMain=fs.readFileSync(path.join(__dirname,'..','pire-hydration-main.html'),'utf8');
  assert.match(hydrationMain,/^<main [\s\S]*class="visitor-workspace"[\s\S]*<\/main>$/);
  assert.doesNotMatch(hydrationMain,/<script\b|localStorage|sessionStorage|access_token/i);
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
