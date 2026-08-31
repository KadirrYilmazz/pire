const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ops=require('../lib/canonical-ops');

const source=fs.readFileSync(path.join(__dirname,'..','lib','canonical-ops.js'),'utf8');

test('canonical ops artık eski yoklama handlerını içermez',()=>{
  assert.doesNotMatch(source,/function attendanceHandler/);
  assert.doesNotMatch(source,/pire_attendance_history/);
  assert.equal(typeof ops.makeupsHandler,'function');
});

test('telafi hakkı payloadı öğrenci kimliğini zorunlu tutar',()=>{
  assert.equal(ops._test.makeupPayload({reason:'x'}),null);
  assert.deepEqual(ops._test.makeupPayload({studentId:12,reason:'  Sağlık  ',status:'Aktif'}),{
    student_id:12,source_lesson_id:null,makeup_lesson_id:null,reason:'Sağlık',expires_at:null,status:'Aktif'
  });
});

test('ders değişikliği payloadı ders kimliğini zorunlu tutar',()=>{
  assert.equal(ops._test.changePayload({action:'Ertele'}),null);
  const row=ops._test.changePayload({lessonId:5,action:'Ertele',oldDate:'2026-09-01',newDate:'2026-09-08'});
  assert.equal(row.lesson_id,5);
  assert.equal(row.action,'Ertele');
  assert.equal(row.old_date,'2026-09-01');
  assert.equal(row.new_date,'2026-09-08');
});
