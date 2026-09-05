const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const bundle=fs.readFileSync(path.join(__dirname,'..','assets','page-C14w5Jqo.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','pire-dashboard-compact.css'),'utf8');

test('eğitmen paneli React içinde beş ana sekme sunar',()=>{
  assert.match(bundle,/pire-teacher-tab/);
  assert.match(bundle,/className:`teacher-nav-tabs`/);
  assert.match(bundle,/[`overview`,`Genel Bakış`]/);
  assert.match(bundle,/[`program`,`Programım`]/);
  assert.match(bundle,/[`students`,`Öğrencilerim`]/);
  assert.match(bundle,/[`earnings`,`Hakedişim`]/);
  assert.match(bundle,/[`permissions`,`Yetkilerim`]/);
  assert.match(bundle,/Eğitmen paneli bölümleri/);
});

test('eğitmen sekmeleri yenilemede korunur',()=>{
  assert.match(bundle,/sessionStorage\.getItem\(`pire-teacher-tab`\)/);
  assert.match(bundle,/sessionStorage\.getItem\(`pire-teacher-sub-tab`\)/);
  assert.match(bundle,/sessionStorage\.setItem\(`pire-teacher-tab`,teacherTab\)/);
  assert.match(bundle,/sessionStorage\.setItem\(`pire-teacher-sub-tab`,teacherSubTab\)/);
  assert.match(bundle,/teacher-tab-\$\{teacherTab\} teacher-sub-\$\{teacherSubTab\}/);
});

test('program bilgileri bugün ve hafta alt sekmelerine ayrılır',()=>{
  assert.match(bundle,/teacher-sub-tabs/);
  assert.match(bundle,/[`today`,`Bugünkü Program`]/);
  assert.match(bundle,/[`week`,`Haftalık Program`]/);
  assert.match(css,/teacher-tab-program\.teacher-sub-today[\s\S]*teacher-panel-grid/);
  assert.match(css,/teacher-tab-program\.teacher-sub-week[\s\S]*teacher-panel-secondary-grid/);
});

test('her ana sekmede yalnızca ilgili eğitmen bilgisi görünür',()=>{
  assert.match(css,/teacher-tab-overview[\s\S]*teacher-panel-summary/);
  assert.match(css,/teacher-tab-students[\s\S]*teacher-my-students/);
  assert.match(css,/teacher-tab-earnings \.teacher-panel-secondary-grid\{display:grid/);
  assert.match(css,/teacher-tab-earnings \.teacher-week-program\{display:none/);
  assert.match(css,/teacher-tab-permissions[\s\S]*teacher-permissions/);
  assert.match(css,/@media \(max-width:760px\)/);
});
