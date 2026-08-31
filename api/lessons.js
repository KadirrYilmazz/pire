"use strict";

const {send,rest,authenticate,asNumber,dateOnly,timeOnly}=require("./_canonical");
function short(v,m=200){return String(v??"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,m)}
function nullable(v,m=200){const x=short(v,m);return x||null}
function num(v,d=0,min=0,max=1_000_000_000){const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:d}
function id(v){const n=Number(v);return Number.isSafeInteger(n)&&n>0?n:null}
function date(v){const x=short(v,10);return /^\d{4}-\d{2}-\d{2}$/.test(x)?x:null}
function time(v){const x=short(v,8);return /^\d{2}:\d{2}(:\d{2})?$/.test(x)?x:null}
function ids(v){if(typeof v==='string'){try{v=JSON.parse(v)}catch(_){v=v.split(',')}}return (Array.isArray(v)?v:[]).map(id).filter(Boolean).slice(0,100)}
async function write(token,path,method,body){return rest(token,path,{method,body:body===undefined?undefined:JSON.stringify(body),headers:body===undefined?{}:{Prefer:"return=representation,resolution=merge-duplicates"}})}
async function replaceLessonStudents(token,lessonId,studentIds){return rest(token,'rpc/pire_replace_lesson_students',{method:'POST',body:JSON.stringify({p_lesson_id:lessonId,p_student_ids:studentIds}),headers:{Prefer:'return=representation'}})}
async function resolveCourse(token,name){const n=short(name,80);if(!n)return null;const rows=await rest(token,"pire_courses?select=id,name");return (rows||[]).find(x=>String(x.name||'').trim().toLocaleLowerCase('tr-TR')===n.toLocaleLowerCase('tr-TR'))||null}
async function resolveTeacher(token,name){const n=short(name,160);if(!n)return null;const rows=await rest(token,"pire_teachers?select=id,full_name");return (rows||[]).find(x=>String(x.full_name||'').trim().toLocaleLowerCase('tr-TR')===n.toLocaleLowerCase('tr-TR'))||null}
function lessonPayload(body){
  const course=short(body?.course??body?.courseName,80),lessonDate=date(body?.lessonDate);if(!course||!lessonDate)return null;
  const start=time(body?.startTime),end=time(body?.endTime);let duration=num(body?.duration,60,1,1440);
  if(start&&end&&!body?.duration){const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);const d=(eh*60+em)-(sh*60+sm);if(d>0)duration=d}
  return {series_id:nullable(body?.seriesId,120),course_name:course,teacher_name:nullable(body?.teacher,160),lesson_type:nullable(body?.lessonType,80)||"Birebir ders",lesson_date:lessonDate,start_time:start,end_time:end,duration_minutes:duration,room:nullable(body?.room,160),recurrence:nullable(body?.recurrence,80)||"Tek seferlik",recurrence_end:date(body?.recurrenceEnd),pricing_type:nullable(body?.pricingType,80)||"Ders paketi",fee:num(body?.fee,0,0),capacity:Math.trunc(num(body?.capacity,1,1,500)),status:nullable(body?.status,80)||"Planlandı",counts_as_held:Boolean(Number(body?.countsAsHeld)||body?.countsAsHeld===true),cancelled_at:body?.cancelledAt||null,notes:nullable(body?.notes,2000),updated_at:new Date().toISOString()};
}
async function getLessons(token){const [lessons,links]=await Promise.all([rest(token,"pire_lessons?select=*&order=lesson_date.asc,start_time.asc,id.asc"),rest(token,"pire_lesson_students?select=lesson_id,student_id")]);const studentsByLesson=new Map();for(const link of links||[]){const key=String(link.lesson_id);if(!studentsByLesson.has(key))studentsByLesson.set(key,[]);studentsByLesson.get(key).push(String(link.student_id))}return {lessons:(lessons||[]).map(row=>({id:Number(row.id),seriesId:row.series_id,course:row.course_name,lessonType:row.lesson_type||"Birebir ders",studentIds:JSON.stringify(studentsByLesson.get(String(row.id))||[]),teacher:row.teacher_name||"",lessonDate:dateOnly(row.lesson_date),startTime:timeOnly(row.start_time),endTime:timeOnly(row.end_time),duration:Number(row.duration_minutes||60),room:row.room||"",recurrence:row.recurrence||"Tek seferlik",recurrenceEnd:dateOnly(row.recurrence_end),pricingType:row.pricing_type||"Ders paketi",fee:asNumber(row.fee),capacity:Number(row.capacity||1),status:row.status,countsAsHeld:row.counts_as_held?1:0,cancelledAt:row.cancelled_at||null,notes:row.notes}))}}

module.exports=async function handler(req,res){
  const method=String(req.method||'GET').toUpperCase();if(!['GET','POST','PATCH','PUT','DELETE'].includes(method))return send(res,405,{error:'Desteklenmeyen istek yöntemi.'},{Allow:'GET, POST, PATCH, PUT, DELETE'});
  try{
    const {token,identity}=await authenticate(req);if(method==='GET')return send(res,200,await getLessons(token));if(!identity.roles.includes('Yönetici'))return send(res,403,{error:'Ders değişiklikleri yalnızca Yönetici tarafından yapılabilir.'});
    const body=req.body||{},lessonId=id(body.lessonId??body.id);
    if(method==='DELETE'){
      if(!lessonId)return send(res,400,{error:'Geçerli ders kimliği gerekiyor.'});
      try{await rest(token,`pire_lessons?id=eq.${lessonId}`,{method:'DELETE'});return send(res,200,{ok:true,lessonId,deleted:true})}catch(error){if(error?.status===409||String(error?.detail||'').includes('foreign key'))return send(res,409,{error:'Bu derse bağlı yoklama veya geçmiş kayıtları bulunduğu için kalıcı silme yapılamaz.'});throw error}
    }
    const payload=lessonPayload(body);if(!payload)return send(res,400,{error:'Ders branşı ve tarihi gerekiyor.'});
    const [course,teacher]=await Promise.all([resolveCourse(token,payload.course_name),resolveTeacher(token,payload.teacher_name)]);payload.course_id=course?.id?Number(course.id):null;payload.teacher_id=teacher?.id?Number(teacher.id):null;
    if(method==='POST'){
      const created=await write(token,'pire_lessons','POST',[payload]),lesson=Array.isArray(created)?created[0]:created;if(!lesson?.id)return send(res,502,{error:'Ders oluşturuldu fakat kimliği alınamadı.'});
      const studentIds=ids(body.studentIds);try{await replaceLessonStudents(token,Number(lesson.id),studentIds)}catch(error){await rest(token,`pire_lessons?id=eq.${lesson.id}`,{method:'DELETE'}).catch(()=>{});throw error}
      return send(res,201,{ok:true,lesson:{...body,id:Number(lesson.id),course:lesson.course_name,teacher:lesson.teacher_name||'',studentIds:JSON.stringify(studentIds)}});
    }
    if(!lessonId)return send(res,400,{error:'Geçerli ders kimliği gerekiyor.'});
    const updated=await write(token,`pire_lessons?id=eq.${lessonId}`,'PATCH',payload);
    if(body.studentIds!==undefined)await replaceLessonStudents(token,lessonId,ids(body.studentIds));
    const lesson=Array.isArray(updated)?updated[0]:updated;return send(res,200,{ok:true,lesson:{...body,id:lessonId,course:lesson?.course_name||payload.course_name,teacher:lesson?.teacher_name||payload.teacher_name||''}});
  }catch(error){if(error?.detail)console.error('Canonical lessons failed',String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||'Ders işlemi tamamlanamadı.'})}
};

module.exports._test={lessonPayload,ids};
