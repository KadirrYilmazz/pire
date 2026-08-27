const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const bundle=fs.readFileSync(path.join(__dirname,'..','assets','page-C14w5Jqo.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','pire-dashboard-compact.css'),'utf8');
const assistant=fs.readFileSync(path.join(__dirname,'..','pire-assistant.js'),'utf8');

test('öğrenci paneli React içinde altı ana sekme sunar',()=>{
  assert.match(bundle,/className:`student-nav-tabs`/);
  assert.match(bundle,/[`overview`,`Genel Bakış`]/);
  assert.match(bundle,/[`lessons`,`Derslerim`]/);
  assert.match(bundle,/[`learning`,`Çalışmalarım`]/);
  assert.match(bundle,/[`package`,`Paketim`]/);
  assert.match(bundle,/[`payments`,`Ödemelerim`]/);
  assert.match(bundle,/[`info`,`Bilgilerim`]/);
});

test('öğrenci sekme seçimi yenilemede korunur',()=>{
  assert.match(bundle,/sessionStorage\.getItem\(`pire-student-tab`\)/);
  assert.match(bundle,/sessionStorage\.getItem\(`pire-student-sub-tab`\)/);
  assert.match(bundle,/sessionStorage\.setItem\(`pire-student-tab`,studentTab\)/);
  assert.match(bundle,/student-tab-\$\{studentTab\} student-sub-\$\{studentSubTab\}/);
});

test('ders ve çalışma alanları alt sekmelere ayrılır',()=>{
  assert.match(bundle,/className:`student-sub-tabs`/);
  assert.match(bundle,/[`upcoming`,`Yaklaşan Dersler`]/);
  assert.match(bundle,/[`history`,`Yoklama Geçmişi`]/);
  assert.match(bundle,/[`homework`,`Ödevler`]/);
  assert.match(bundle,/[`notes`,`Değerlendirmeler`]/);
  assert.match(css,/student-tab-lessons\.student-sub-upcoming[\s\S]*portal-program/);
  assert.match(css,/student-tab-learning\.student-sub-homework[\s\S]*portal-homework-card/);
});

test('öğrenci rolü Türkçe karakter nedeniyle asistanı gizlemez',()=>{
  assert.match(assistant,/\["Öğrenci",\/\(\?:Öğrenci\|Student\)\/i\]/);
  assert.match(assistant,/function authenticated\(\)\{return Boolean\(role\(\)&&fullName\(\)\)\}/);
});
