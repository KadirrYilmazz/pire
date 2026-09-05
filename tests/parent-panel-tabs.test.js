const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const bundle=fs.readFileSync(path.join(__dirname,'..','assets','page-C14w5Jqo.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','pire-dashboard-compact.css'),'utf8');

test('veli paneli React içinde beş bilgi sekmesi sunar',()=>{
  assert.match(bundle,/pire-parent-tab/);
  assert.match(bundle,/\[\`overview\`,\`Genel Bakış\`\]/);
  assert.match(bundle,/\[\`lessons\`,\`Dersler\`\]/);
  assert.match(bundle,/\[\`progress\`,\`Gelişim\`\]/);
  assert.match(bundle,/\[\`payments\`,\`Ödemeler\`\]/);
  assert.match(bundle,/\[\`info\`,\`Bilgiler\`\]/);
  assert.match(bundle,/className:\`parent-nav-tabs\`/);
  assert.match(bundle,/Veli paneli bölümleri/);
  assert.doesNotMatch(bundle,/className:\`portal-parent-tabs\`/);
});

test('veli sekmesi yenilemede korunur ve yalnızca veli görünümüne uygulanır',()=>{
  assert.match(bundle,/sessionStorage\.getItem\(\`pire-parent-tab\`\)/);
  assert.match(bundle,/sessionStorage\.setItem\(\`pire-parent-tab\`,parentTab\)/);
  assert.match(bundle,/T===\`parentPanel\`\?\`parent-tab-\$\{parentTab\} parent-sub-\$\{parentSubTab\}\`/);
});

test('kartlar dersler, gelişim, ödemeler ve bilgiler sekmelerine dağıtılır',()=>{
  assert.match(css,/parent-tab-lessons[\s\S]*portal-program/);
  assert.match(css,/parent-tab-progress[\s\S]*portal-package-card/);
  assert.match(css,/parent-tab-progress[\s\S]*portal-homework-card/);
  assert.match(css,/parent-tab-payments[\s\S]*portal-payment-card/);
  assert.match(css,/parent-tab-info[\s\S]*portal-info-card/);
  assert.match(css,/@media \(max-width: 760px\)/);
});

test('dersler ve gelişim bilgileri kalıcı alt sekmelere ayrılır',()=>{
  assert.match(bundle,/pire-parent-sub-tab/);
  assert.match(bundle,/parent-sub-tabs/);
  assert.match(bundle,/\[\`upcoming\`,\`Yaklaşan Dersler\`\]/);
  assert.match(bundle,/\[\`makeups\`,\`Telafiler\`\]/);
  assert.match(bundle,/\[\`changes\`,\`Değişiklikler\`\]/);
  assert.match(bundle,/\[\`package\`,\`Paket\`\]/);
  assert.match(bundle,/\[\`homework\`,\`Ödevler\`\]/);
  assert.match(bundle,/\[\`notes\`,\`Değerlendirmeler\`\]/);
  assert.match(bundle,/\[\`attendance\`,\`Katılım\`\]/);
  assert.match(bundle,/\[\`history\`,\`Yoklama\`\]/);
  assert.match(bundle,/sessionStorage\.setItem\(\`pire-parent-sub-tab\`,parentSubTab\)/);
});

test('her veli alt sekmesinde yalnızca ilgili kart görünür',()=>{
  assert.match(css,/parent-sub-upcoming[\s\S]*portal-parent-grid/);
  assert.match(css,/parent-sub-makeups[\s\S]*portal-makeup-card/);
  assert.match(css,/parent-sub-changes[\s\S]*portal-changes-card/);
  assert.match(css,/parent-sub-package[\s\S]*portal-package-card/);
  assert.match(css,/parent-sub-homework[\s\S]*portal-homework-card/);
  assert.match(css,/parent-sub-notes[\s\S]*portal-notes-card/);
  assert.match(css,/parent-sub-attendance[\s\S]*portal-attendance-card/);
  assert.match(css,/parent-sub-history[\s\S]*portal-history-card/);
});

test('sekme çubuğu ekran koordinatına sabitlenmez',()=>{
  assert.match(css,/\.primary-nav \.parent-nav-tabs/);
  assert.doesNotMatch(css,/\.parent-nav-tabs\s*\{[^}]*position:\s*fixed/);
});
