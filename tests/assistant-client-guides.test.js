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
