"use strict";

const {send,rest,authenticate,dateOnly}=require("./_canonical");
function short(v,m=200){return String(v??"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,m)}
function nullable(v,m=200){const x=short(v,m);return x||null}
function id(v){const n=Number(v);return Number.isSafeInteger(n)&&n>0?n:null}
function int(v,d=0,min=0,max=1_000_000){const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?Math.trunc(n):d}
function date(v){const x=short(v,10);return /^\d{4}-\d{2}-\d{2}$/.test(x)?x:null}
async function write(token,path,method,body){return rest(token,path,{method,body:body===undefined?undefined:JSON.stringify(body),headers:body===undefined?{}:{Prefer:"return=representation,resolution=merge-duplicates"}})}
async function resolveCourse(token,name){const n=short(name,80);if(!n)return null;const rows=await rest(token,"pire_courses?select=id,name");return (rows||[]).find(x=>String(x.name||'').trim().toLocaleLowerCase('tr-TR')===n.toLocaleLowerCase('tr-TR'))||null}
function packagePayload(body){const studentId=id(body?.studentId),course=short(body?.course??body?.courseName,80),total=int(body?.totalLessons,0,0);if(!studentId||!course||total<1)return null;const used=int(body?.usedLessons,0,0,total),remaining=body?.remainingLessons==null?Math.max(0,total-used):int(body.remainingLessons,0,0,total+100000);return {student_id:studentId,course_name:course,total_lessons:total,used_lessons:used,remaining_lessons:remaining,makeup_rights:int(body?.makeupRights,0,0),frozen_lessons:int(body?.frozenLessons,0,0),start_date:date(body?.startDate),end_date:date(body?.endDate),status:nullable(body?.status,80)||'Aktif',updated_at:new Date().toISOString()}}
async function getPackages(token){const [packages,adjustments]=await Promise.all([rest(token,"pire_packages?select=*&order=created_at.asc,id.asc"),rest(token,"pire_package_adjustments?select=*&order=created_at.asc,id.asc")]);const byPackage=new Map();for(const row of adjustments||[]){const key=String(row.package_id);if(!byPackage.has(key))byPackage.set(key,[]);byPackage.get(key).push({id:Number(row.id),packageId:Number(row.package_id),lessonChange:Number(row.lesson_change||0),makeupChange:Number(row.makeup_change||0),frozenChange:Number(row.frozen_change||0),reason:row.reason||'',createdAt:row.created_at})}return {packages:(packages||[]).map(row=>({id:Number(row.id),studentId:Number(row.student_id),course:row.course_name,totalLessons:Number(row.total_lessons||0),usedLessons:Number(row.used_lessons||0),remainingLessons:Number(row.remaining_lessons||0),makeupRights:Number(row.makeup_rights||0),frozenLessons:Number(row.frozen_lessons||0),startDate:dateOnly(row.start_date),endDate:dateOnly(row.end_date),status:row.status,createdAt:row.created_at,adjustments:byPackage.get(String(row.id))||[]}))}}

module.exports=async function handler(req,res){
  const method=String(req.method||'GET').toUpperCase();if(!['GET','POST','PATCH','PUT','DELETE'].includes(method))return send(res,405,{error:'Desteklenmeyen istek yöntemi.'},{Allow:'GET, POST, PATCH, PUT, DELETE'});
  try{
    const {token,identity}=await authenticate(req);if(method==='GET')return send(res,200,await getPackages(token));if(!identity.roles.includes('Yönetici'))return send(res,403,{error:'Paket değişiklikleri yalnızca Yönetici tarafından yapılabilir.'});
    const body=req.body||{},packageId=id(body.packageId??body.id);
    if(method==='DELETE'){
      if(!packageId)return send(res,400,{error:'Geçerli paket kimliği gerekiyor.'});
      if(body.permanent===true){const adjustments=await rest(token,`pire_package_adjustments?select=id&package_id=eq.${packageId}&limit=1`);if((adjustments||[]).length)return send(res,409,{error:'Bu paketin hareket geçmişi bulunduğu için kalıcı silme yapılamaz.'});await rest(token,`pire_packages?id=eq.${packageId}`,{method:'DELETE'});return send(res,200,{ok:true,packageId,deleted:true})}
      const updated=await write(token,`pire_packages?id=eq.${packageId}`,'PATCH',{status:'Süresi doldu',updated_at:new Date().toISOString()});return send(res,200,{ok:true,package:Array.isArray(updated)?updated[0]||null:updated,mode:'archived'});
    }
    const payload=packagePayload(body);if(!payload)return send(res,400,{error:'Geçerli öğrenci, branş ve toplam ders hakkı gerekiyor.'});const course=await resolveCourse(token,payload.course_name);payload.course_id=course?.id?Number(course.id):null;
    if(method==='POST'){const created=await write(token,'pire_packages','POST',[payload]),pkg=Array.isArray(created)?created[0]:created;if(!pkg?.id)return send(res,502,{error:'Paket oluşturuldu fakat kimliği alınamadı.'});return send(res,201,{ok:true,package:{...body,id:Number(pkg.id),studentId:Number(pkg.student_id),course:pkg.course_name,totalLessons:Number(pkg.total_lessons),usedLessons:Number(pkg.used_lessons),remainingLessons:Number(pkg.remaining_lessons),makeupRights:Number(pkg.makeup_rights),frozenLessons:Number(pkg.frozen_lessons),status:pkg.status,createdAt:pkg.created_at,adjustments:[]}})}
    if(!packageId)return send(res,400,{error:'Geçerli paket kimliği gerekiyor.'});const updated=await write(token,`pire_packages?id=eq.${packageId}`,'PATCH',payload),pkg=Array.isArray(updated)?updated[0]:updated;return send(res,200,{ok:true,package:{...body,id:packageId,studentId:Number(pkg?.student_id||payload.student_id),course:pkg?.course_name||payload.course_name,totalLessons:Number(pkg?.total_lessons||payload.total_lessons),usedLessons:Number(pkg?.used_lessons||payload.used_lessons),remainingLessons:Number(pkg?.remaining_lessons||payload.remaining_lessons),makeupRights:Number(pkg?.makeup_rights||payload.makeup_rights),frozenLessons:Number(pkg?.frozen_lessons||payload.frozen_lessons),status:pkg?.status||payload.status}})
  }catch(error){if(error?.detail)console.error('Canonical packages failed',String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||'Paket işlemi tamamlanamadı.'})}
};

module.exports._test={packagePayload};
