const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {registrationPayload}=require('../lib/student-registration');
const requestId='11111111-1111-4111-8111-111111111111';
const plan={course:'Piyano',createLesson:true,createPackage:true,teacher:'Eğitmen',room:'Derslik 1',lessonDate:'2026-10-20',startTime:'10:00',endTime:'11:00',totalLessons:8,packageStart:'2026-10-20',packageEnd:'2026-12-20'};
test('registration validates selected lesson and package before database access',()=>{
  const p=registrationPayload({registrationRequestId:requestId,registrationPlan:plan},{full_name:'Öğrenci'});
  assert.equal(p.p_request_id,requestId);assert.equal(p.p_plan.totalLessons,8);
  for(const change of [{endTime:'09:00'},{totalLessons:0},{packageEnd:'2026-01-01'},{createLesson:'false'}]){
    assert.throws(()=>registrationPayload({registrationRequestId:requestId,registrationPlan:{...plan,...change}},{}),e=>e.status===400);
  }
  assert.throws(()=>registrationPayload({registrationRequestId:'bad',registrationPlan:plan},{}),e=>e.status===400);
});
test('student-only plan omits unused lesson/package fields',()=>{
  const p=registrationPayload({registrationRequestId:requestId,registrationPlan:{...plan,createLesson:false,createPackage:false}},{});
  assert.deepEqual(p.p_plan,{course:'Piyano',createLesson:false,createPackage:false});
});
function api(rest,roles=['Yönetici']){
  const context={module:{exports:{}},console:{error(){}},require(path){
    if(path==='./_canonical')return {authenticate:async()=>({token:'test',identity:{roles}}),rest,
      send:(res,status,data)=>({status,data}),asNumber:Number,dateOnly:v=>v?String(v).slice(0,10):null,timeOnly:v=>v?String(v).slice(0,5):''};
    return require('../lib/student-registration');
  }};
  vm.runInNewContext(fs.readFileSync(require.resolve('../api/students'),'utf8'),context);
  return context.module.exports;
}
test('combined registration makes exactly one write and preserves response contract',async()=>{
  const calls=[];
  const handler=api(async(token,path,options)=>{calls.push({path,body:JSON.parse(options.body)});return {student:{id:1,full_name:'Öğrenci'},lesson_id:2,package_id:3,replayed:false}});
  const r=await handler({method:'POST',body:{name:'Öğrenci',registrationPlan:plan,registrationRequestId:requestId}},{});
  assert.equal(r.status,201);assert.equal(r.data.student.name,'Öğrenci');assert.equal(r.data.lessonId,2);
  assert.equal(calls.length,1);assert.equal(calls[0].path,'rpc/pire_register_student');
});
test('unauthorized registration never reaches the database',async()=>{
  let called=false;const handler=api(async()=>{called=true},['Öğrenci']);
  const r=await handler({method:'POST',body:{name:'Öğrenci',registrationPlan:plan,registrationRequestId:requestId}},{});
  assert.equal(r.status,403);assert.equal(called,false);
});
test('missing RPC fails closed without creating or deleting standalone records',async()=>{
  const calls=[];const handler=api(async(token,path)=>{calls.push(path);throw {status:502,detail:JSON.stringify({code:'PGRST202'})}});
  const r=await handler({method:'POST',body:{name:'Öğrenci',registrationPlan:plan,registrationRequestId:requestId}},{});
  assert.equal(r.status,503);assert.deepEqual(calls,['rpc/pire_register_student']);
});
test('retry returns existing student without claiming a new creation',async()=>{
  const handler=api(async()=>({student:{id:1,full_name:'Öğrenci'},replayed:true}));
  const r=await handler({method:'POST',body:{name:'Öğrenci',registrationPlan:plan,registrationRequestId:requestId}},{});
  assert.equal(r.status,200);assert.equal(r.data.replayed,true);
});
test('changed retry payload has a clear conflict response',async()=>{
  const handler=api(async()=>{throw {detail:JSON.stringify({message:'registration_request_conflict'})}});
  const r=await handler({method:'POST',body:{name:'Öğrenci',registrationPlan:plan,registrationRequestId:requestId}},{});
  assert.equal(r.status,409);
});
function client(fetch){
  const submit={disabled:true,textContent:''};
  const window={fetch};
  const context={window,fetch,Response,Headers,JSON,crypto:require('node:crypto').webcrypto,requestAnimationFrame:()=>1,
    document:{documentElement:{},querySelector:()=>({}),querySelectorAll:()=>[],head:{appendChild(){}},createElement:()=>({dataset:{}})},
    MutationObserver:class{observe(){}},setTimeout:()=>1};
  vm.runInNewContext(fs.readFileSync(require.resolve('../pire-student-wizard.js'),'utf8'),context);
  window.__PIRE_STUDENT_WIZARD_PENDING__={...plan,requestId,form:{querySelector:()=>submit}};
  return {window,submit};
}
test('wizard sends one combined request and releases submit after an HTTP failure',async()=>{
  const calls=[];const {window,submit}=client(async(url,options)=>{
    if(options){calls.push({url,options});return new Response('{}',{status:400})}
    return new Response('{}',{status:401});
  });
  const r=await window.fetch('/api/students',{method:'POST',body:JSON.stringify({name:'Öğrenci'})});
  assert.equal(r.status,400);assert.equal(submit.disabled,false);assert.equal(calls.length,1);
  assert.equal(JSON.parse(calls[0].options.body).registrationRequestId,requestId);
  assert.equal(JSON.parse(calls[0].options.body).registrationPlan.createPackage,true);
});
test('wizard network failure enables retry and never sends cleanup DELETEs',async()=>{
  const calls=[];const {window,submit}=client(async(url,options)=>{
    if(options){calls.push(url);throw new Error('offline')}
    return new Response('{}',{status:401});
  });
  const r=await window.fetch('/api/students',{method:'POST',body:'{}'});
  assert.equal(r.status,503);assert.equal(submit.disabled,false);assert.deepEqual(calls,['/api/students']);
});
