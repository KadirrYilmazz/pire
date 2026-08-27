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
  assert.match(bundle,/T===\`parentPanel\`\?\`parent-tab-\$\{parentTab\}\`:\`\`/);
});

test('kartlar dersler, gelişim, ödemeler ve bilgiler sekmelerine dağıtılır',()=>{
  assert.match(css,/parent-tab-lessons[\s\S]*portal-program/);
  assert.match(css,/parent-tab-progress[\s\S]*portal-package-card/);
  assert.match(css,/parent-tab-progress[\s\S]*portal-homework-card/);
  assert.match(css,/parent-tab-payments[\s\S]*portal-payment-card/);
  assert.match(css,/parent-tab-info[\s\S]*portal-info-card/);
  assert.match(css,/@media \(max-width: 760px\)/);
});

test('sekme çubuğu ekran koordinatına sabitlenmez',()=>{
  assert.match(css,/\.primary-nav \.parent-nav-tabs/);
  assert.doesNotMatch(css,/\.parent-nav-tabs\s*\{[^}]*position:\s*fixed/);
});
