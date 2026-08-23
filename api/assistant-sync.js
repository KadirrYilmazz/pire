"use strict";

const assistant=require("./assistant");
const {getVerifiedIdentity,originAllowed}=assistant._test;
const buckets=new Map();

function send(res,status,payload,headers={}){
  Object.entries({"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}).forEach(([key,value])=>res.setHeader(key,value));
  return res.status(status).json(payload);
}
function rateOkay(key){
  const now=Date.now(),current=buckets.get(key);
  if(!current||now-current.startedAt>=60_000){buckets.set(key,{startedAt:now,count:1});return true}
  current.count+=1;return current.count<=12;
}
function integer(value,max=9_007_199_254_740_991){const n=Number(value);return Number.isSafeInteger(n)&&n>=0&&n<=max?n:null}
function amount(value){const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=1_000_000_000?Math.round(n*100)/100:0}
function short(value,max=80){return String(value??"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,max)}
function date(value,nullable=false){const text=short(value,10);return /^\d{4}-\d{2}-\d{2}$/.test(text)?text:(nullable?null:"")}
function time(value){const text=short(value,8);return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(text)?text:null}
function timestamp(value){const text=short(value,40);return text&&!Number.isNaN(Date.parse(text))?new Date(text).toISOString():null}
function list(value,max){return Array.isArray(value)?value.slice(0,max):[]}

function sanitizeSnapshot(input){
  const validStudents=new Set();
  const students=list(input?.students,5000).map(row=>{
    const id=integer(row?.id);if(id===null)return null;validStudents.add(String(id));
    const day=integer(row?.payment_day,31);
    return {id,status:short(row?.status,40)||"Aktif",monthly_fee:amount(row?.monthly_fee),payment_day:day>=1?day:1,updated_at:new Date().toISOString()};
  }).filter(Boolean);
  const validLessons=new Set();
  const lessons=list(input?.lessons,10000).map(row=>{
    const id=integer(row?.id),lessonDate=date(row?.lesson_date);if(id===null||!lessonDate)return null;validLessons.add(String(id));
    const duration=integer(row?.duration_minutes,1440);
    return {id,course:short(row?.course,80),teacher_ref:null,lesson_date:lessonDate,start_time:time(row?.start_time),duration_minutes:duration>=1?duration:60,status:short(row?.status,40)||"Planlandı",updated_at:new Date().toISOString()};
  }).filter(Boolean);
  const lessonStudents=list(input?.lesson_students,30000).map(row=>({lesson_id:integer(row?.lesson_id),student_id:integer(row?.student_id)})).filter(row=>row.lesson_id!==null&&row.student_id!==null&&validLessons.has(String(row.lesson_id))&&validStudents.has(String(row.student_id)));
  const payments=list(input?.payments,20000).map(row=>{
    const id=integer(row?.id),studentId=integer(row?.student_id),month=date(row?.billing_month);if(id===null||studentId===null||!month||!validStudents.has(String(studentId)))return null;
    return {id,student_id:studentId,billing_month:month,amount_due:amount(row?.amount_due),amount_paid:amount(row?.amount_paid),status:short(row?.status,40)||"Bekliyor",paid_at:timestamp(row?.paid_at),updated_at:new Date().toISOString()};
  }).filter(Boolean);
  const packages=list(input?.packages,20000).map(row=>{
    const id=integer(row?.id),studentId=integer(row?.student_id);if(id===null||studentId===null||!validStudents.has(String(studentId)))return null;
    return {id,student_id:studentId,course:short(row?.course,80),total_lessons:integer(row?.total_lessons,100000)||0,remaining_lessons:integer(row?.remaining_lessons,100000)||0,makeup_rights:integer(row?.makeup_rights,100000)||0,frozen_lessons:integer(row?.frozen_lessons,100000)||0,status:short(row?.status,40)||"Aktif",start_date:date(row?.start_date,true),end_date:date(row?.end_date,true),updated_at:new Date().toISOString()};
  }).filter(Boolean);
  const attendance=list(input?.attendance,30000).map(row=>{
    const id=integer(row?.id),lessonId=integer(row?.lesson_id),studentId=integer(row?.student_id);if(id===null||lessonId===null||studentId===null||!validLessons.has(String(lessonId))||!validStudents.has(String(studentId)))return null;
    return {id,lesson_id:lessonId,student_id:studentId,status:short(row?.status,40)||"Bilinmiyor",late_minutes:integer(row?.late_minutes,1440)||0,occurred_at:timestamp(row?.occurred_at),updated_at:new Date().toISOString()};
  }).filter(Boolean);
  return {students,lessons,lesson_students:lessonStudents,payments,packages,attendance};
}

function config(){
  const url=String(process.env.SUPABASE_URL||"").replace(/\/$/,"");
  const key=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw Object.assign(new Error("Supabase sunucu ayarları eksik."),{status:503});
  return {url,key};
}
async function rest(token,path,options={}){
  const {url,key}=config();
  const response=await fetch(`${url}/rest/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${token}`,Accept:"application/json",...(options.body?{"content-type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"}:{}),...(options.headers||{})}});
  if(!response.ok)throw Object.assign(new Error("Güvenli AI verileri eşitlenemedi."),{status:502,detail:await response.text().catch(()=>"")});
  return response;
}
async function upsert(token,table,rows){if(rows.length)await rest(token,table,{method:"POST",body:JSON.stringify(rows)})}
async function removeStale(token,table,desiredIds){
  const response=await rest(token,`${table}?select=id`);
  const existing=await response.json();const wanted=new Set(desiredIds.map(String));
  const stale=existing.map(row=>row.id).filter(id=>!wanted.has(String(id)));
  if(stale.length)await rest(token,`${table}?id=in.(${stale.join(",")})`,{method:"DELETE"});
}
async function syncSnapshot(token,snapshot){
  await upsert(token,"pire_ai_students",snapshot.students);
  await upsert(token,"pire_ai_lessons",snapshot.lessons);
  await upsert(token,"pire_ai_payments",snapshot.payments);
  await upsert(token,"pire_ai_packages",snapshot.packages);
  await upsert(token,"pire_ai_attendance",snapshot.attendance);
  await rest(token,"pire_ai_lesson_students?lesson_id=not.is.null",{method:"DELETE"});
  await upsert(token,"pire_ai_lesson_students",snapshot.lesson_students);
  await removeStale(token,"pire_ai_attendance",snapshot.attendance.map(row=>row.id));
  await removeStale(token,"pire_ai_payments",snapshot.payments.map(row=>row.id));
  await removeStale(token,"pire_ai_packages",snapshot.packages.map(row=>row.id));
  await removeStale(token,"pire_ai_lessons",snapshot.lessons.map(row=>row.id));
}

module.exports=async function handler(req,res){
  if(req.method!=="POST")return send(res,405,{error:"Yalnızca POST isteği kabul edilir."},{Allow:"POST"});
  if(!originAllowed(req))return send(res,403,{error:"İstek kaynağına izin verilmiyor."});
  const authorization=String(req.headers.authorization||"");
  if(!authorization.startsWith("Bearer "))return send(res,401,{error:"Geçerli Pİ-RE oturumu gerekiyor."});
  try{
    const token=authorization.slice(7).trim(),identity=await getVerifiedIdentity(token);
    if(!identity.roles.includes("Yönetici"))return send(res,403,{error:"AI veri eşitlemesi yalnızca doğrulanmış yönetici hesabıyla yapılabilir."});
    if(!rateOkay(identity.userId))return send(res,429,{error:"Çok sık eşitleme isteği gönderildi.",retryAfter:60},{"retry-after":"60"});
    const snapshot=sanitizeSnapshot(req.body?.snapshot);
    await syncSnapshot(token,snapshot);
    return send(res,200,{ok:true,counts:Object.fromEntries(Object.entries(snapshot).map(([key,value])=>[key,value.length]))});
  }catch(error){
    if(error?.detail)console.error("AI snapshot sync failed",{detail:error.detail.slice(0,500)});
    return send(res,error?.status||500,{error:error?.message||"AI veri eşitlemesi tamamlanamadı."});
  }
};

module.exports._test={sanitizeSnapshot,syncSnapshot,rateOkay,buckets};
