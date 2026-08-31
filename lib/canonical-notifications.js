"use strict";

const {send,rest,authenticate,asNumber,dateOnly}=require('../api/_canonical');
const DEFAULTS={'Ders hatırlatması':true,'Yoklama':true,'Telafi':true,'Ödeme':true,'Paket':true,'Ödev':true,'Devamsızlık':true,'Duyuru':true};
const iso=()=>new Date().toISOString();
const day=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?null:d};
const fmtDate=v=>{const d=day(v);return d?d.toLocaleDateString('tr-TR'):'-'};
async function write(token,path,method,body){return rest(token,path,{method,body:JSON.stringify(body),headers:{Prefer:'return=representation,resolution=merge-duplicates'}})}
async function getState(token,profileId){
  const [prefRows,readRows,students,payments,packages,lessons,links,attendance,progress,makeups,announcements,announcementReads]=await Promise.all([
    rest(token,`pire_notification_preferences?select=preferences&profile_id=eq.${profileId}`).catch(()=>[]),
    rest(token,`pire_notification_reads?select=notification_key&profile_id=eq.${profileId}`).catch(()=>[]),
    rest(token,'pire_student_directory?select=student_id,full_name'),rest(token,'pire_payments?select=id,student_id,billing_month,amount_due,amount_paid,status'),
    rest(token,'pire_packages?select=id,student_id,course_name,remaining_lessons,total_lessons,end_date,status'),
    rest(token,'pire_lessons?select=id,course_name,teacher_name,lesson_date,start_time,status'),rest(token,'pire_lesson_students?select=lesson_id,student_id'),
    rest(token,'pire_attendance?select=lesson_id,student_id,status'),rest(token,'pire_lesson_progress?select=id,student_id,homework,homework_due'),
    rest(token,'pire_makeup_rights?select=id,student_id,expires_at,status'),rest(token,'pire_announcements?select=*&order=created_at.desc,id.desc'),
    rest(token,`pire_announcement_reads?select=announcement_id&profile_id=eq.${profileId}`).catch(()=>[])
  ]);
  const prefs={...DEFAULTS,...(prefRows?.[0]?.preferences||{})},reads=new Set((readRows||[]).map(x=>String(x.notification_key))),annRead=new Set((announcementReads||[]).map(x=>String(x.announcement_id))),studentNames=new Map((students||[]).map(x=>[String(x.student_id),x.full_name]));
  const now=new Date(),today=now.toISOString().slice(0,10),notifications=[];
  const push=n=>{if(prefs[n.type]===false)return;n.read=reads.has(n.key)||Boolean(n.read);notifications.push(n)};
  for(const p of payments||[]){const due=asNumber(p.amount_due)-asNumber(p.amount_paid);if(due<=0||String(p.status)==='Ödendi')continue;const month=String(dateOnly(p.billing_month)||'').slice(0,7),key=`payment-${p.id}-due`;push({key,type:'Ödeme',title:'Bekleyen ödeme',detail:`${studentNames.get(String(p.student_id))||'Öğrenci'} · ₺${Math.max(0,due).toLocaleString('tr-TR')}`,time:month||today,priority:'high',target:'payments'})}
  for(const p of packages||[]){if(String(p.status)!=='Aktif')continue;const remaining=Number(p.remaining_lessons||0),total=Number(p.total_lessons||0);if(remaining<=2)push({key:`package-${p.id}-${remaining}`,type:'Paket',title:'Paket hakkı azalıyor',detail:`${studentNames.get(String(p.student_id))||'Öğrenci'} · ${remaining}/${total} ders kaldı`,time:p.end_date?fmtDate(p.end_date):'',priority:remaining<=1?'high':'medium',target:'students'})}
  const attendanceSet=new Set((attendance||[]).map(x=>`${x.lesson_id}:${x.student_id}`));
  const studentsByLesson=new Map();for(const l of links||[]){const k=String(l.lesson_id);if(!studentsByLesson.has(k))studentsByLesson.set(k,[]);studentsByLesson.get(k).push(String(l.student_id))}
  for(const l of lessons||[]){if(!l.lesson_date||String(l.lesson_date)>today)continue;for(const sid of studentsByLesson.get(String(l.id))||[]){if(attendanceSet.has(`${l.id}:${sid}`))continue;push({key:`attendance-${l.id}-${sid}`,type:'Yoklama',title:'Yoklama girişi bekleniyor',detail:`${l.course_name||'Ders'} · ${studentNames.get(sid)||'Öğrenci'}`,time:fmtDate(l.lesson_date),priority:'high',target:'attendance'})}}
  for(const p of progress||[]){if(!p.homework||!p.homework_due||String(p.homework_due)>=today)continue;push({key:`homework-${p.id}-${p.homework_due}`,type:'Ödev',title:'Ödev teslimi gecikti',detail:`${studentNames.get(String(p.student_id))||'Öğrenci'} · ${String(p.homework).slice(0,160)}`,time:fmtDate(p.homework_due),priority:'high',target:'attendance'})}
  for(const m of makeups||[]){if(!['Bekliyor','Planlandı'].includes(String(m.status)))continue;push({key:`makeup-${m.id}-${m.status}`,type:'Telafi',title:m.status==='Planlandı'?'Telafi dersi planlandı':'Telafi hakkı bekliyor',detail:`${studentNames.get(String(m.student_id))||'Öğrenci'}${m.expires_at?' · Son kullanım '+fmtDate(m.expires_at):''}`,time:m.expires_at?fmtDate(m.expires_at):'',priority:'medium',target:'makeups'})}
  for(const a of announcements||[]){push({key:`announcement:${a.id}`,type:'Duyuru',title:a.title,detail:a.message,time:fmtDate(a.created_at||a.starts_at),priority:a.priority||'medium',target:'announcements',read:annRead.has(String(a.id))})}
  notifications.sort((a,b)=>(a.read===b.read?0:a.read?1:-1));
  return {notifications,unread:notifications.filter(x=>!x.read).length,preferences:prefs,channel:'Uygulama içi',generatedAt:iso()};
}
async function notificationsHandler(req,res){
  const method=String(req.method||'GET').toUpperCase();if(!['GET','POST','PATCH'].includes(method))return send(res,405,{error:'Desteklenmeyen istek yöntemi.'});
  try{const {token,identity}=await authenticate(req),profileId=encodeURIComponent(identity.id);if(method==='GET')return send(res,200,await getState(token,profileId));const b=req.body||{};
    if(method==='PATCH'){const type=String(b.type||'').trim();if(!type)return send(res,400,{error:'Bildirim türü gerekiyor.'});const rows=await rest(token,`pire_notification_preferences?select=preferences&profile_id=eq.${profileId}`).catch(()=>[]),preferences={...DEFAULTS,...(rows?.[0]?.preferences||{}),[type]:b.enabled!==false};await write(token,'pire_notification_preferences','POST',[{profile_id:identity.id,preferences,updated_at:iso()}]);return send(res,200,{preferences})}
    const state=await getState(token,profileId),keys=b.all?state.notifications.map(x=>x.key):[String(b.key||'')].filter(Boolean);if(!keys.length)return send(res,400,{error:'Bildirim anahtarı gerekiyor.'});
    const announcementIds=keys.filter(k=>k.startsWith('announcement:')).map(k=>Number(k.split(':')[1])).filter(Number.isFinite);if(announcementIds.length)await write(token,'pire_announcement_reads','POST',announcementIds.map(announcement_id=>({announcement_id,profile_id:identity.id})));
    const dynamicKeys=keys.filter(k=>!k.startsWith('announcement:'));if(dynamicKeys.length)await write(token,'pire_notification_reads','POST',dynamicKeys.map(notification_key=>({profile_id:identity.id,notification_key,read_at:iso()})));
    const after=await getState(token,profileId);return send(res,200,{ok:true,unread:after.unread});
  }catch(e){return send(res,e?.status||500,{error:e?.message||'Bildirim işlemi tamamlanamadı.'})}
}
module.exports={notificationsHandler};
