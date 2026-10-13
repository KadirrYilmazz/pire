const test=require('node:test');
const assert=require('node:assert/strict');
const {normalize}=require('../api/students')._test;

test('name-only update preserves existing contact, guardian and fee data',()=>{
  const existing={full_name:'Eski ad',phone:'05550000000',guardian_name:'Veli',monthly_fee:3200,birth_date:'2010-01-01',notes:'Not'};
  const patch=normalize({name:'Yeni ad'},true);
  assert.deepEqual(patch,{full_name:'Yeni ad'});
  assert.deepEqual({...existing,...patch},{...existing,full_name:'Yeni ad'});
});

test('missing, unknown and undefined fields produce no update',()=>{
  assert.deepEqual(normalize({},true),{});
  assert.deepEqual(normalize({id:12,unknown:'x',phone:undefined},true),{});
});

test('explicit clearing and zero fee update only requested fields',()=>{
  assert.deepEqual(normalize({phone:'',guardianName:null,notes:null,fee:0},true),{
    phone:null,guardian_name:null,notes:null,monthly_fee:0
  });
});

test('camelCase and database field names are both supported',()=>{
  assert.deepEqual(normalize({birthDate:'2010-01-01',guardianPhone:'05550000000',paymentDay:15},true),{
    birth_date:'2010-01-01',guardian_phone:'05550000000',payment_day:15
  });
  assert.deepEqual(normalize({birth_date:'2010-01-01',guardian_phone:'05550000000',payment_day:15},true),{
    birth_date:'2010-01-01',guardian_phone:'05550000000',payment_day:15
  });
});

test('explicit null in preferred field is not replaced by an alias',()=>{
  assert.deepEqual(normalize({guardianName:null,guardian_name:'Alias'},true),{guardian_name:null});
});

test('new student defaults remain available',()=>{
  const row=normalize({name:'Öğrenci'});
  assert.equal(row.full_name,'Öğrenci');
  assert.equal(row.status,'Aktif');
  assert.equal(row.payment_day,1);
  assert.equal(row.monthly_fee,0);
  assert.match(row.registration_date,/^\d{4}-\d{2}-\d{2}$/);
});
