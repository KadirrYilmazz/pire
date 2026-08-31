const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','api','students.js'),'utf8');

test('non-admin student reads use the safe student directory',()=>{
  assert.match(source,/pire_student_directory\?select=student_id,full_name,birth_date,status/);
  assert.match(source,/const studentRequest=isAdmin\?rest\(token,"pire_students\?select=\*/);
});

test('safe student row never exposes sensitive profile fields',()=>{
  for(const field of ['phone:null','address:null','nationalId:null','guardianPhone:null','guardianNationalId:null','emergencyContact:null','notes:null']){
    assert.match(source,new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.match(source,/fee:0/);
});

test('student mutations remain admin-only',()=>{
  assert.match(source,/if\(!admin\(identity\)\)return send\(res,403/);
});
