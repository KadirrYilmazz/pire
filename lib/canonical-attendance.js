'use strict';

const {send,rest,authenticate,dateOnly}=require('../api/_canonical');

function short(v,m=1000){return String(v??'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,m)}
function id(v){const n=Number(v);return Number.isSafeInteger(n)&&n>0?n:null}
function int(v,d=0,min=0,max=100000){const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?Math.trunc(n):d}
function bool(v){return v===true||v===1||v==='1'||String(v).toLowerCase()==='true'}
function date(v){const x=short(v,10);return /^\d{4}-\d{2}-\d{2}$/.test(x)?x:null}

async function write(token,path,method,body){
  return rest(token,path,{method,body:body===undefined?undefined:JSON.stringify(body),headers:body===undefined?{}:{Prefer:'return=representation,resolution=merge-duplicates'}});
}

function attendancePayload(body){
  const lessonId=id(body?.lessonId),studentId=id(body?.studentId),status=short(body?.status,80);
  if(!lessonId||!studentId||!status)return null;
  return {
    p_lesson_id:lessonId,
    p_student_id:studentId,
    p_status:status,
    p_late_minutes:int(body?.lateMinutes,0,0,1440),
    p_absence_reason:short(body?.absenceReason,1000)||null,
    p_parent_notified:bool(body?.parentNotified),
    p_entered_by:short(body?.enteredBy,160)||null,
    p_entered_at:body?.enteredAt||null,
    p_attendance_id:id(body?.attendanceId??body?.id)
  };
}

function progressPayload(body){
  const lessonId=id(body?.lessonId),studentId=id(body?.studentId);
  if(!lessonId||!studentId)return null;
  return {lesson_id:lessonId,student_id:studentId,topic:short(body?.topic,500)||null,objective:short(body?.objective,1000)||null,performance:short(body?.performance,160)||null,gaps:short(body?.gaps,1000)||null,next_topic:short(body?.nextTopic,500)||null,homework:short(body?.homework,1000)||null,homework_due:date(body?.homeworkDue),private_note:short(body?.privateNote,2000)||null,visible_note:short(body?.visibleNote,2000)||null,math_questions:int(body?.mathQuestions),correct:int(body?.correct),wrong:int(body?.wrong),blank:int(body?.blank),music_piece:short(body?.musicPiece,500)||null,bpm:int(body?.bpm),technique:short(body?.technique,1000)||null,updated_at:new Date().toISOString()};
}

async function attendanceGet(token){
  const [attendance,progress,history]=await Promise.all([
    rest(token,'pire_attendance?select=*&order=entered_at.desc,id.desc'),
    rest(token,'pire_lesson_progress?select=*&order=updated_at.desc,id.desc'),
    rest(token,'pire_attendance_history?select=*&order=changed_at.desc,id.desc')
  ]);
  return {
    attendance:(attendance||[]).map(r=>({id:Number(r.id),lessonId:Number(r.lesson_id),studentId:Number(r.student_id),status:r.status,lateMinutes:Number(r.late_minutes||0),absenceReason:r.absence_reason,parentNotified:r.parent_notified?1:0,enteredBy:r.entered_by,enteredAt:r.entered_at,updatedAt:r.updated_at})),
    progress:(progress||[]).map(r=>({id:Number(r.id),lessonId:Number(r.lesson_id),studentId:Number(r.student_id),topic:r.topic,objective:r.objective,performance:r.performance,gaps:r.gaps,nextTopic:r.next_topic,homework:r.homework,homeworkDue:dateOnly(r.homework_due),privateNote:r.private_note,visibleNote:r.visible_note,mathQuestions:Number(r.math_questions||0),correct:Number(r.correct||0),wrong:Number(r.wrong||0),blank:Number(r.blank||0),musicPiece:r.music_piece,bpm:Number(r.bpm||0),technique:r.technique,updatedAt:r.updated_at})),
    history:(history||[]).map(r=>({id:Number(r.id),attendanceId:r.attendance_id==null?null:Number(r.attendance_id),lessonId:r.lesson_id==null?null:Number(r.lesson_id),studentId:r.student_id==null?null:Number(r.student_id),oldStatus:r.old_status,newStatus:r.new_status,packageId:r.package_id==null?null:Number(r.package_id),packageChange:Number(r.package_change||0),changedBy:r.changed_by,changedAt:r.changed_at}))
  };
}

async function attendanceHandler(req,res){
  const method=String(req.method||'GET').toUpperCase();
  if(!['GET','POST','PATCH','PUT'].includes(method))return send(res,405,{error:'Desteklenmeyen istek yöntemi.'},{Allow:'GET, POST, PATCH, PUT'});
  try{
    const {token,identity}=await authenticate(req);
    if(method==='GET')return send(res,200,await attendanceGet(token));
    if(!identity.roles.includes('Yönetici'))return send(res,403,{error:'Yoklama değişiklikleri şu aşamada yalnızca Yönetici tarafından yapılabilir.'});

    const body=req.body||{};
    const mode=short(body.type||body.kind||body.mode,30).toLocaleLowerCase('tr-TR');
    if(mode==='progress'||mode==='gelişim'||body.topic!==undefined||body.performance!==undefined){
      const payload=progressPayload(body);
      if(!payload)return send(res,400,{error:'Geçerli ders ve öğrenci kimliği gerekiyor.'});
      const progressId=id(body.progressId??body.id);
      if(method==='POST'){
        const created=await write(token,'pire_lesson_progress','POST',[payload]);
        const row=Array.isArray(created)?created[0]:created;
        return send(res,201,{ok:true,progress:{...body,id:Number(row.id)}});
      }
      if(!progressId)return send(res,400,{error:'Geçerli gelişim kaydı kimliği gerekiyor.'});
      const updated=await write(token,`pire_lesson_progress?id=eq.${progressId}`,'PATCH',payload);
      const row=Array.isArray(updated)?updated[0]:updated;
      return send(res,200,{ok:true,progress:{...body,id:progressId,updatedAt:row?.updated_at||payload.updated_at}});
    }

    const payload=attendancePayload(body);
    if(!payload)return send(res,400,{error:'Geçerli ders, öğrenci ve yoklama durumu gerekiyor.'});
    if(method!=='POST'&&!payload.p_attendance_id)return send(res,400,{error:'Geçerli yoklama kimliği gerekiyor.'});

    const result=await rest(token,'rpc/pire_record_attendance',{method:'POST',body:JSON.stringify(payload),headers:{'content-type':'application/json',Prefer:'return=representation'}});
    const row=Array.isArray(result)?result[0]:result;
    if(!row?.attendance_id)return send(res,502,{error:'Yoklama kaydedildi fakat kimliği alınamadı.'});
    const status=row.current_status||payload.p_status;
    const response={ok:true,attendance:{...body,id:Number(row.attendance_id),status,updatedAt:row.updated_at||new Date().toISOString()},mode:'atomic',created:Boolean(row.created),previousStatus:row.previous_status??null};
    return send(res,row.created?201:200,response);
  }catch(error){
    if(error?.detail)console.error('Canonical attendance failed',String(error.detail).slice(0,500));
    return send(res,error?.status||500,{error:error?.message||'Yoklama işlemi tamamlanamadı.'});
  }
}

module.exports={attendanceHandler,_test:{attendancePayload,progressPayload,id,int,bool,date}};
