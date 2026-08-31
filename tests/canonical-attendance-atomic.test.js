'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const attendance=fs.readFileSync(path.join(__dirname,'..','lib','canonical-attendance.js'),'utf8');
const finance=fs.readFileSync(path.join(__dirname,'..','api','finance.js'),'utf8');
const migration=fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20260901_fix123_atomic_attendance.sql'),'utf8');

test('attendance writes use a single canonical RPC',()=>{
  assert.match(attendance,/rpc\/pire_record_attendance/);
  assert.doesNotMatch(attendance,/write\(token,'pire_attendance_history'/);
  assert.doesNotMatch(attendance,/write\(token,'pire_attendance','POST'/);
  assert.match(attendance,/mode:'atomic'/);
});

test('finance dispatcher routes attendance to atomic module',()=>{
  assert.match(finance,/canonical-attendance/);
  assert.match(finance,/if\(op==='attendance'\)return attendanceHandler/);
});

test('attendance RPC is invoker-secured and authenticated-only',()=>{
  assert.match(migration,/security invoker/);
  assert.match(migration,/current_user_is_pire_admin/);
  assert.match(migration,/revoke all on function public\.pire_record_attendance[\s\S]*from anon/);
  assert.match(migration,/grant execute on function public\.pire_record_attendance[\s\S]*to authenticated/);
  assert.match(migration,/insert into public\.pire_attendance_history/);
});
