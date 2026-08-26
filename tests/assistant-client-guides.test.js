const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'pire-assistant.js'), 'utf8');

test('receivables use a dedicated viewing guide', () => {
  assert.match(source, /id:"view-receivables"/);
  assert.match(source, /"finance\.receivables":"view-receivables"/);
  assert.match(source, /Ödeme Takibi/);
  assert.match(source, /Bekliyor/);
  assert.match(source, /Kısmi/);
  assert.match(source, /Gecikmiş/);
});

test('a related task is remembered for context follow-up', () => {
  assert.match(source, /if\(relatedGuide&&relatedGuide\.roles\.includes\(role\(\)\)\)/);
  assert.match(source, /state\.lastIntent=relatedGuide\.id/);
});

test('the client sends only the previous validated task identifiers as context', () => {
  assert.match(source, /previousTask:\{intent:state\.lastTask\.intent,targetModule:state\.lastTask\.targetModule\}/);
});

test('viewing guides show their own completion success instead of a save notice', () => {
  assert.match(source, /id:"view-receivables",\s+completion:"view"/);
  assert.match(source, /completedGuide\.completion==="view"/);
  assert.match(source, /Rehber başarıyla tamamlandı/);
  assert.match(source, /Doğru ekrana ulaştınız/);
  assert.match(source, /pire-guide-message\.success/);
});

test('student and parent tasks use private payment and lesson guides', () => {
  assert.match(source, /id:"view-own-payments"/);
  assert.match(source, /id:"view-own-lessons"/);
  assert.match(source, /"self\.payment\.view":"view-own-payments"/);
  assert.match(source, /\["Öğrenci","Veli"\]\.includes\(role\(\)\)/);
});

test('safe assistant actions open forms but never submit destructive controls', () => {
  assert.match(source, /const safeActions=/);
  assert.match(source, /student:\{label:"Öğrenci formunu hazırla"/);
  assert.match(source, /teacher:\{label:"Eğitmen formunu hazırla"/);
  assert.match(source, /lesson:\{label:"Ders formunu hazırla"/);
  assert.match(source, /data-guide-action="prepare"/);
  assert.match(source, /Kaydet düğmesine yalnızca siz basabilirsiniz/);
  assert.match(source, /kaydet\|sil\|onayla\|öde\|tamamla/);
});

test('safe actions remain limited by the verified visible role', () => {
  assert.match(source, /!guide\.roles\.includes\(role\(\)\)/);
  assert.match(source, /const action=safeActions\[guide\?\.id\]/);
});

test('assistant exposes a role-specific capabilities section', () => {
  assert.match(source, /const roleCapabilities=/);
  assert.match(source, /"Yönetici":\{/);
  assert.match(source, /"Eğitmen":\{/);
  assert.match(source, /"Öğrenci":\{/);
  assert.match(source, /"Veli":\{/);
  assert.match(source, /class="pire-guide-capabilities-toggle"/);
  assert.match(source, /function renderCapabilities\(\)/);
});

test('capability choices are rendered only from the current verified role', () => {
  assert.match(source, /const currentRole=role\(\),capability=roleCapabilities\[currentRole\]/);
  assert.match(source, /if\(!box\|\|!capability\)return/);
  assert.match(source, /capability\.items\.forEach/);
  assert.match(source, /data-capability-prompt/);
});

test('capabilities explain information, navigation and preparation levels', () => {
  assert.match(source, /kind:"info"/);
  assert.match(source, /kind:"open"/);
  assert.match(source, /kind:"prepare"/);
  assert.match(source, /Kaydet/);
});

test('conversation can be reset without affecting the authenticated session', () => {
  assert.match(source, /class="pire-guide-reset"/);
  assert.match(source, /function resetConversation\(\)/);
  assert.match(source, /window\.confirm/);
  assert.match(source, /state\.guide=null;state\.suggestedGuide=null;state\.step=0/);
  assert.match(source, /state\.lastIntent="";state\.lastTask=null/);
  assert.match(source, /messages\.innerHTML=""/);
  assert.match(source, /addMessage\(welcomeMessage\(\)\)/);
  assert.doesNotMatch(source, /resetConversation[\s\S]{0,900}(?:signOut|localStorage\.clear|sessionStorage\.clear)/);
});
