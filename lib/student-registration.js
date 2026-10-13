'use strict';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function bad(message){throw Object.assign(new Error(message),{status:400})}
function day(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):null}
function time(v){return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''))?String(v):null}
function short(v,max=160){return String(v??'').trim().slice(0,max)}
function registrationPayload(body,student){
  if(!UUID.test(String(body.registrationRequestId||'')))bad('Geçerli kayıt işlem kimliği gerekiyor.');
  const input=body.registrationPlan;
  if(!input||typeof input!=='object'||Array.isArray(input))bad('Kayıt planı gerekiyor.');
  if(typeof input.createLesson!=='boolean'||typeof input.createPackage!=='boolean')bad('Ders ve paket seçimleri geçersiz.');
  const plan={course:short(input.course,80),createLesson:input.createLesson,createPackage:input.createPackage};
  if(!plan.course)bad('Branş seçin.');
  if(plan.createLesson){
    Object.assign(plan,{teacher:short(input.teacher),room:short(input.room),lessonDate:day(input.lessonDate),startTime:time(input.startTime),endTime:time(input.endTime),recurrence:short(input.recurrence,80)||'Tek seferlik'});
    if(!plan.teacher||!plan.room||!plan.lessonDate||!plan.startTime||!plan.endTime||plan.endTime<=plan.startTime)bad('İlk ders için eğitmen, derslik, tarih ve geçerli saat aralığı gerekiyor.');
  }
  if(plan.createPackage){
    Object.assign(plan,{totalLessons:Number(input.totalLessons),packageStart:day(input.packageStart),packageEnd:day(input.packageEnd)});
    if(!Number.isSafeInteger(plan.totalLessons)||plan.totalLessons<1||plan.totalLessons>100000||!plan.packageStart||!plan.packageEnd||plan.packageEnd<plan.packageStart)bad('Paket için geçerli ders hakkı ve tarih aralığı gerekiyor.');
  }
  return {p_request_id:body.registrationRequestId,p_student:student,p_plan:plan};
}
module.exports={registrationPayload};
