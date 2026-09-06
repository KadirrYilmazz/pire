'use strict';

const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'index.html');
let html=fs.readFileSync(file,'utf8');

// Fix133: React RSC root layout yalnızca <html lang="tr"> üretir. Kaynak
// snapshot'taki tema niteliği ve onu sonradan kaldıran ek script, hydration
// başlamadan önce iki ayrı kök ağaç farkı oluşturuyordu. Deploy çıktısını RSC
// köküyle fiziksel olarak aynı hale getir; React tema effect'i daha sonra
// kayıtlı light/dark tercihini güvenle uygular.
const hydrationThemePatch="<script data-pire-hydration-theme>document.documentElement.removeAttribute('data-theme')</script>\n";
html=html
  .replace('<html lang="tr" data-theme="dark">','<html lang="tr">')
  .replace(hydrationThemePatch,'');
if(html.includes('data-pire-hydration-theme'))throw new Error('Fix133 geçici hydration tema scripti temizlenemedi.');
if(/<html[^>]*data-theme=/.test(html))throw new Error('Fix133 RSC kökünde beklenmeyen data-theme niteliği kaldı.');

// Fix134: Bu uyumluluk dosyaları defer ile head içinde çalıştığında, özellikle
// language/student-wizard/login-notification yükleyicileri React hydration
// başlamadan DOM ve head yapısını değiştiriyordu. Etiketleri ilk HTML'den
// çıkarıp React istemcisi başladıktan ve iki frame tamamlandıktan sonra aynı
// sırayla module olarak yükle. Böylece özellikler korunur, hydration girdisi
// ise sunucunun ürettiği DOM ile aynı kalır.
const postHydrationScripts=[
  '/pire-notification-scope.js',
  '/pire-dashboard-calendar.js',
  '/pire-global-search.js',
  '/pire-student-wizard.js',
  '/pire-background-music.js',
  '/pire-language.js',
  '/pire-login-notification.js'
];
for(const src of postHydrationScripts){
  const tagPattern=new RegExp(`<script src="${src.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')}" defer[^>]*><\\/script>\\n?`);
  if(!tagPattern.test(html))throw new Error(`Fix134 ertelenecek script etiketi bulunamadı: ${src}`);
  html=html.replace(tagPattern,'');
}
const reactBootstrap='<script type="module" id="_R_">import "/assets/index-BS0ANsbn.js";</script>';
const serializedScripts=JSON.stringify([...postHydrationScripts,'/pire-canonical-customers.js?v=1']);
const safeBootstrap=`<script type="module" id="_R_">
await import("/assets/index-BS0ANsbn.js");
await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
for(const src of ${serializedScripts}) await import(src);
</script>`;
if(!html.includes(reactBootstrap))throw new Error('Fix134 React module başlangıcı bulunamadı.');
html=html.replace(reactBootstrap,safeBootstrap);
for(const src of postHydrationScripts){
  if(new RegExp(`<script src="${src.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')}"`).test(html))throw new Error(`Fix134 hydration öncesi script kaldı: ${src}`);
}

const backendStart='</main><script>\n(function(){\nconst SEED=';
const backendEnd='</script><script id="pire-header-safety-fix">';
const startIndex=html.indexOf(backendStart);
if(startIndex<0)throw new Error('Fix123 legacy backend başlangıç işareti bulunamadı.');
const endIndex=html.indexOf(backendEnd,startIndex);
if(endIndex<0)throw new Error('Fix123 legacy backend bitiş işareti bulunamadı.');
html=html.slice(0,startIndex)+'</main><script id="pire-header-safety-fix">'+html.slice(endIndex+backendEnd.length);

const customerStart='<script id="pire-safe-customer-crm">';
const customerEnd='<script id="pire-fix17b-remove-customer-discover">';
const customerStartIndex=html.indexOf(customerStart);
const customerEndIndex=html.indexOf(customerEnd,customerStartIndex);
if(customerStartIndex<0||customerEndIndex<0)throw new Error('Fix123 legacy müşteri CRM işaretleri bulunamadı.');
html=html.slice(0,customerStartIndex)+html.slice(customerEndIndex);

// Fix126: Yönetici option'ı zaten sayfa açılışında ve kullanıcı etkileşiminde kontrol ediliyor.
// Her 1.2 saniyede tüm select'leri tarayan kör polling production çıktısından kaldırılır.
html=html.replace('  setInterval(ensureAdminOption,1200);','  /* Fix126: periodic admin-option polling removed; event-driven checks remain. */');
if(html.includes('setInterval(ensureAdminOption,1200)'))throw new Error('Fix126 admin option polling temizlenemedi.');

const forbidden=['const SEED=','async function localApi(','pire-recovered-backend-v1\';\nlet db','window.fetch=function(input,init)','pire-customers-safe-v1'];
for(const marker of forbidden){if(html.includes(marker))throw new Error('Legacy işareti temizlenemedi: '+marker)}
if(!html.includes('id="pire-header-safety-fix"'))throw new Error('Temizlik sonrası UI patch zinciri korunamadı.');
if(!html.includes('id="pire-student-edit-fix"'))throw new Error('Temizlik sonrası öğrenci düzenleme uyumluluğu korunamadı.');
if(!safeBootstrap.includes('/pire-canonical-customers.js?v=1'))throw new Error('Canonical müşteri CRM hydration sonrası loader listesine eklenemedi.');
fs.writeFileSync(file,html,'utf8');

// Akıllı uyarıların "okundu" görünümü kurumsal veri değildir; kalıcı cihaz DB'si
// olmaması için yalnızca mevcut sekme/oturum boyunca sessionStorage'da tutulur.
const dashboardPath=path.join(process.cwd(),'pire-dashboard-calendar.js');
let dashboard=fs.readFileSync(dashboardPath,'utf8');
dashboard=dashboard
  .replace('localStorage.getItem(SMART_READ_KEY)','sessionStorage.getItem(SMART_READ_KEY)')
  .replace('localStorage.setItem(SMART_READ_KEY,JSON.stringify([...read].slice(-100)))','sessionStorage.setItem(SMART_READ_KEY,JSON.stringify([...read].slice(-100)))');
if(dashboard.includes('localStorage.getItem(SMART_READ_KEY)')||dashboard.includes('localStorage.setItem(SMART_READ_KEY'))throw new Error('Akıllı uyarı localStorage kullanımı temizlenemedi.');
fs.writeFileSync(dashboardPath,dashboard,'utf8');

// Asistan hitabı Supabase profile'dan gelir. Eski yerel hesap cache'leri yalnızca
// tarihsel fallback idi; preview çıktısında tamamen çıkarılır.
const assistantPath=path.join(process.cwd(),'pire-assistant.js');
let assistant=fs.readFileSync(assistantPath,'utf8');
const profileStart='  function localProfileGender(){';
const profileEnd='  function requestProfileGender(){';
const profileStartIndex=assistant.indexOf(profileStart);
const profileEndIndex=assistant.indexOf(profileEnd,profileStartIndex);
if(profileStartIndex<0||profileEndIndex<0)throw new Error('Asistan yerel profil fallback işaretleri bulunamadı.');
assistant=assistant.slice(0,profileStartIndex)+assistant.slice(profileEndIndex);
assistant=assistant.replace(/localProfileGender\(\)/g,'""');
for(const marker of ['pire-local-admin-accounts-v2','pire-user-accounts-cache-v1','localProfileGender()']){
  if(assistant.includes(marker))throw new Error('Asistan local profil fallback temizlenemedi: '+marker);
}
fs.writeFileSync(assistantPath,assistant,'utf8');

// Son güvenlik ağı: tarihsel uyumluluk kodu eski DB anahtarını salt-okunur olarak
// referanslayabilir; fakat deploy çıktısında operasyonel veriyi localStorage'a
// kalıcı yazan, silen veya yeniden başlatan kod bulunamaz.
const deployFiles=['index.html','pire-account-honorific.js','pire-assistant.js','pire-dashboard-calendar.js'];
const forbiddenPersistentMarkers=[
  'pire-customers-safe-v1',
  'pire-local-admin-accounts-v2',
  'pire-user-accounts-cache-v1',
  'pire-notification-role-reads-v1',
  'localStorage.setItem(DBKEY',
  'localStorage.removeItem(DBKEY',
  "localStorage.setItem('pire-recovered-backend-v1'",
  'localStorage.setItem("pire-recovered-backend-v1"',
  "localStorage.removeItem('pire-recovered-backend-v1'",
  'localStorage.removeItem("pire-recovered-backend-v1"'
];
for(const deployFile of deployFiles){
  const text=fs.readFileSync(path.join(process.cwd(),deployFile),'utf8');
  for(const marker of forbiddenPersistentMarkers){
    if(text.includes(marker))throw new Error(`Operasyonel localStorage kalıcı yazma kalıntısı bulundu: ${deployFile} -> ${marker}`);
  }
}

console.log('Fix133 deploy temizliği doğrulandı: RSC kökü eşitlendi; legacy backend/local CRM çıkarıldı; operasyonel localStorage kalıcı yazması kalmadı.');
