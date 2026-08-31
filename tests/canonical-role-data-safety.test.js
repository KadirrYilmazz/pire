const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const students=fs.readFileSync(path.join(__dirname,'..','api','students.js'),'utf8');
const notifications=fs.readFileSync(path.join(__dirname,'..','lib','canonical-notifications.js'),'utf8');
const migration=fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260901_fix123_student_directory_finance_rls.sql'),'utf8');

test('non-admin student GET uses safe directory and omits private profile fields',()=>{
  assert.match(students,/pire_student_directory\?select=student_id,full_name,birth_date,status/);
  const safeRow=students.slice(students.indexOf('function directoryStudentRow'),students.indexOf('function paymentRow'));
  for(const field of ['nationalId:null','guardianNationalId:null','address:null','guardianPhone:null','notes:null'])assert.match(safeRow,new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('notification names come from safe student directory',()=>{
  assert.match(notifications,/pire_student_directory\?select=student_id,full_name/);
  assert.doesNotMatch(notifications,/pire_students\?select=id,full_name,payment_day/);
});

test('finance RLS excludes teacher relationship access',()=>{
  assert.match(migration,/current_user_can_access_pire_student_finance/);
  const financeHelper=migration.slice(migration.indexOf('create or replace function private.current_user_can_access_pire_student_finance'),migration.indexOf('revoke all on function private.current_user_can_access_pire_student_finance'));
  assert.doesNotMatch(financeHelper,/pire_teacher_students|Eğitmen/);
  assert.match(migration,/pire_payments_finance_select/);
  assert.match(migration,/pire_transactions_finance_select/);
});

test('sensitive student base table becomes admin-select only',()=>{
  assert.match(migration,/drop policy if exists pire_students_select_authorized/);
  assert.match(migration,/create policy pire_students_admin_select/);
  assert.match(migration,/using \(private\.current_user_is_pire_admin\(\)\)/);
});
