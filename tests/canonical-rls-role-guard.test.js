const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

function read(rel){return fs.readFileSync(path.join(__dirname,'..',rel),'utf8')}

const studentGuard=read('supabase/migrations/20260901_fix123_student_access_role_guard.sql');
const financeGrant=read('supabase/migrations/20260901_fix123_finance_helper_execute_grant.sql');

test('linked_student_id access is restricted to student or parent roles',()=>{
  assert.match(studentGuard,/linked_student_id = target_student_id/);
  assert.match(studentGuard,/p\.role in \('Öğrenci','Veli'\)/);
  assert.match(studentGuard,/p\.roles && array\['Öğrenci','Veli'\]::text\[\]/);
});

test('teacher student access requires explicit teacher role and relationship',()=>{
  assert.match(studentGuard,/from public\.pire_teacher_students ts/);
  assert.match(studentGuard,/ts\.student_id = target_student_id/);
  assert.match(studentGuard,/p\.role = 'Eğitmen'/);
});

test('finance helper is executable only by authenticated users needed by RLS',()=>{
  assert.match(financeGrant,/revoke all on function private\.current_user_can_access_pire_student_finance\(bigint\) from public/);
  assert.match(financeGrant,/revoke all on function private\.current_user_can_access_pire_student_finance\(bigint\) from anon/);
  assert.match(financeGrant,/grant execute on function private\.current_user_can_access_pire_student_finance\(bigint\) to authenticated/);
});
