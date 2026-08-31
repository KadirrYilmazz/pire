"use strict";

const assistant=require("./assistant");
const {getVerifiedIdentity,originAllowed}=assistant._test;

function send(res,status,payload,headers={}){
  Object.entries({"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}).forEach(([k,v])=>res.setHeader(k,v));
  return res.status(status).json(payload);
}
function integer(value,max=9_007_199_254_740_991){const n=Number(value);return Number.isSafeInteger(n)&&n>=0&&n<=max?n:null}
function short(value,max=200){return String(value??"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,max)}
function nullable(value,max=200){const v=short(value,max);return v||null}
function amount(value){const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=1_000_000_000?Math.round(n*100)/100:0}
function date(value){const v=short(value,10);return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:null}
function status(value,allowed,fallback){const v=short(value,40);return allowed.includes(v)?v:fallback}
function list(value,max){return Array.isArray(value)?value.slice(0,max):[]}
function parseCourses(value){
  if(Array.isArray(value))return value.map(x=>short(x,80)).filter(Boolean).slice(0,50);
  if(typeof value!=="string"||!value.trim())return [];
  try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed.map(x=>short(x,80)).filter(Boolean).slice(0,50):[]}
  catch(_){return value.split(",").map(x=>short(x,80)).filter(Boolean).slice(0,50)}
}

function sanitizeSnapshot(input){
  const students=list(input?.students?.students,5000).map(row=>{
    const id=integer(row?.id);const fullName=short(row?.name,160);if(id===null||!fullName)return null;
    const paymentDay=integer(row?.paymentDay,31);
    return {
      id,full_name:fullName,birth_date:date(row?.birthDate),blood_group:nullable(row?.bloodGroup,20),phone:nullable(row?.phone,40),
      address:nullable(row?.address,500),national_id:nullable(row?.nationalId,40),heard_from:nullable(row?.heardFrom,120),
      registration_date:date(row?.registrationDate)||new Date().toISOString().slice(0,10),guardian_name:nullable(row?.guardianName,160),
      guardian_relation:nullable(row?.guardianRelation,60),guardian_phone:nullable(row?.guardianPhone,40),guardian_phone_2:nullable(row?.guardianPhone2,40),
      guardian_national_id:nullable(row?.guardianNationalId,40),emergency_contact:nullable(row?.emergencyContact,240),monthly_fee:amount(row?.fee),
      payment_day:paymentDay&&paymentDay>=1?paymentDay:1,status:status(row?.status,["Aktif","Kayıt dondurmuş","Ayrılmış"],"Aktif"),
      notes:nullable(row?.notes,2000),updated_at:new Date().toISOString()
    };
  }).filter(Boolean);

  const teachers=list(input?.catalog?.teachers,500).map(row=>{
    const id=integer(row?.id);const fullName=short(row?.name,160);if(id===null||!fullName)return null;
    return {
      row:{id,full_name:fullName,phone:nullable(row?.phone,40),backup_phone:nullable(row?.backupPhone,40),national_id:nullable(row?.nationalId,40),
        birth_date:date(row?.birthDate),start_date:date(row?.startDate),address:nullable(row?.address,500),emergency_contact:nullable(row?.emergencyContact,240),
        availability:nullable(row?.availability,500),iban:nullable(row?.iban,80),compensation_type:nullable(row?.compensationType,100),
        compensation_amount:amount(row?.compensationAmount),group_compensation_amount:amount(row?.groupCompensationAmount),
        cancellation_rule:nullable(row?.cancellationRule,200),status:status(row?.status,["Aktif","Ayrılmış","Pasif"],"Aktif"),notes:nullable(row?.notes,2000),updated_at:new Date().toISOString()},
      courses:parseCourses(row?.courses)
    };
  }).filter(Boolean);

  const courseNames=[];const seen=new Set();
  for(const row of list(input?.catalog?.courses,1000)){
    const name=short(row?.name,80);const key=name.toLocaleLowerCase("tr-TR");if(name&&!seen.has(key)){seen.add(key);courseNames.push(name)}
  }
  for(const teacher of teachers)for(const name of teacher.courses){const key=name.toLocaleLowerCase("tr-TR");if(!seen.has(key)){seen.add(key);courseNames.push(name)}}

  return {students,teachers,courseNames};
}

function config(){
  const url=String(process.env.SUPABASE_URL||"").replace(/\/$/,"");
  const key=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw Object.assign(new Error("Supabase sunucu ayarları eksik."),{status:503});
  return {url,key};
}
async function rest(token,path,options={}){
  const {url,key}=config();
  const response=await fetch(`${url}/rest/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${token}`,Accept:"application/json",...(options.body?{"content-type":"application/json",Prefer:"resolution=merge-duplicates,return=representation"}:{}),...(options.headers||{})}});
  if(!response.ok)throw Object.assign(new Error("Canonical veri eşitlemesi başarısız."),{status:502,detail:await response.text().catch(()=>"")});
  return response;
}
async function upsert(token,table,rows){if(!rows.length)return [];const response=await rest(token,table,{method:"POST",body:JSON.stringify(rows)});return response.json().catch(()=>[])}
async function ensureCourses(token,names){
  const response=await rest(token,"pire_courses?select=id,name");const existing=await response.json();
  const map=new Map(existing.map(x=>[String(x.name).trim().toLocaleLowerCase("tr-TR"),x]));
  for(const name of names){const key=name.toLocaleLowerCase("tr-TR");if(map.has(key))continue;const created=await upsert(token,"pire_courses",[{name,status:"Aktif"}]);if(created[0])map.set(key,created[0])}
  return map;
}
async function syncCanonical(token,snapshot){
  await upsert(token,"pire_students",snapshot.students);
  await upsert(token,"pire_teachers",snapshot.teachers.map(x=>x.row));
  const courses=await ensureCourses(token,snapshot.courseNames);
  const links=[];
  for(const teacher of snapshot.teachers){for(const name of teacher.courses){const course=courses.get(name.toLocaleLowerCase("tr-TR"));if(course)links.push({teacher_id:teacher.row.id,course_id:course.id})}}
  if(links.length)await upsert(token,"pire_teacher_courses",links);
  return {students:snapshot.students.length,teachers:snapshot.teachers.length,courses:courses.size,teacher_courses:links.length};
}

module.exports=async function handler(req,res){
  if(req.method!=="POST")return send(res,405,{error:"Yalnızca POST isteği kabul edilir."},{Allow:"POST"});
  if(!originAllowed(req))return send(res,403,{error:"İstek kaynağına izin verilmiyor."});
  const authorization=String(req.headers.authorization||"");
  if(!authorization.startsWith("Bearer "))return send(res,401,{error:"Geçerli Pİ-RE oturumu gerekiyor."});
  try{
    const token=authorization.slice(7).trim(),identity=await getVerifiedIdentity(token);
    if(!identity.roles.includes("Yönetici"))return send(res,403,{error:"Canonical veri geçişi yalnızca doğrulanmış yönetici hesabıyla yapılabilir."});
    const snapshot=sanitizeSnapshot(req.body?.snapshot);
    if(!snapshot.students.length&&!snapshot.teachers.length)return send(res,400,{error:"Taşınacak öğrenci/eğitmen verisi bulunamadı."});
    const counts=await syncCanonical(token,snapshot);
    return send(res,200,{ok:true,counts,mode:"upsert-only"});
  }catch(error){
    if(error?.detail)console.error("Canonical sync failed",{detail:error.detail.slice(0,500)});
    return send(res,error?.status||500,{error:error?.message||"Canonical veri geçişi tamamlanamadı."});
  }
};

module.exports._test={sanitizeSnapshot,parseCourses,syncCanonical};
