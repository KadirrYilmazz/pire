const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','pire-canonical-ai-sync.js'),'utf8');
const loader=fs.readFileSync(path.join(__dirname,'..','pire-login-notification.js'),'utf8');

test('AI snapshot is rebuilt from canonical operational APIs',()=>{
  for(const route of ['/api/students','/api/lessons','/api/packages','/api/attendance','/api/finance'])assert.match(source,new RegExp(route.replaceAll('/','\\/')));
  assert.match(source,/\/api\/assistant-sync/);
  assert.match(source,/mode:'canonical-api-snapshot'/);
  assert.doesNotMatch(source,/pire-recovered-backend-v1|__PIRE_RECOVERED_BACKEND__/);
});

test('AI snapshot contains only minimized operational fields',()=>{
  for(const field of ['monthly_fee','payment_day','lesson_date','duration_minutes','amount_due','amount_paid','remaining_lessons','late_minutes'])assert.match(source,new RegExp(field));
  assert.doesNotMatch(source,/nationalId|national_id|guardianName|guardian_name|guardianPhone|guardian_phone|address:/);
  assert.doesNotMatch(source,/name:row\.name|phone:row\.phone/);
});

test('canonical AI sync loads after bridge and compatibility mirror',()=>{
  const bridge=loader.indexOf("load('/pire-canonical-read-bridge.js?v=4'");
  const compat=loader.indexOf("load('/pire-canonical-legacy-read-compat.js?v=1'");
  const ai=loader.indexOf("load('/pire-canonical-ai-sync.js?v=1'");
  assert.ok(bridge>=0&&compat>bridge&&ai>compat);
});

test('AI sync is rate-aware and only reschedules after successful writes',()=>{
  assert.match(source,/MIN_INTERVAL=15000/);
  assert.match(source,/method!==\'GET\'/);
  assert.match(source,/response\.status===403\)\{disabled=true/);
});
