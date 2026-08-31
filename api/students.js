"use strict";

const {send,rest,authenticate,asNumber,dateOnly,timeOnly}=require("./_canonical");

function studentRow(row){return {
  id:Number(row.id),name:row.full_name,birthDate:dateOnly(row.birth_date),bloodGroup:row.blood_group,phone:row.phone,photoKey:null,
  address:row.address,nationalId:row.national_id,heardFrom:row.heard_from,registrationDate:dateOnly(row.registration_date),
  guardianName:row.guardian_name,guardianRelation:row.guardian_relation,guardianPhone:row.guardian_phone,guardianPhone2:row.guardian_phone_2,
  guardianNationalId:row.guardian_national_id,emergencyContact:row.emergency_contact,course:"",teacher:"",lessonDay:"",
  fee:asNumber(row.monthly_fee),paymentDay:Number(row.payment_day||1),status:row.status,notes:row.notes
}}
function directoryStudentRow(row){return {
  id:Number(row.student_id),name:row.full_name,birthDate:dateOnly(row.birth_date),bloodGroup:null,phone:null,photoKey:null,
  address:null,nationalId:null,heardFrom:null,registrationDate:null,guardianName:null,guardianRelation:null,guardianPhone:null,guardianPhone2:null,
  guardianNationalId:null,emergencyContact:null,course:"",teacher:"",lessonDay:"",fee:0,paymentDay:1,status:row.status,notes:null
}}
function paymentRow(row){return {id:Number(row.id),studentId:Number(row.student_id),month:String(row.billing_month||"").slice(0,7),amount:asNumber(row.amount_due),status:row.status,paidAt:row.paid_at||null}}
function text(value,max=200){const v=String(value??"").replace(/[\u0000-\u001f\u007f]/g,"").trim();return v?v.slice(0,max):null}
function date(value){const v=String(value??"").slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:null}
function number(value,max=1_000_000_000){const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=max?Math.round(n*100)/100:0}
function normalize(body,partial=false){
  const row={};const put=(key,value)=>{if(!partial||value!==undefined)row[key]=value};
  put("full_name",text(body?.name??body?.full_name,160));put("birth_date",date(body?.birthDate??body?.birth_date));put("blood_group",text(body?.bloodGroup??body?.blood_group,20));put("phone",text(body?.phone,40));
  put("address",text(body?.address,500));put("national_id",text(body?.nationalId??body?.national_id,40));put("heard_from",text(body?.heardFrom??body?.heard_from,120));put("registration_date",date(body?.registrationDate??body?.registration_date)||(!partial?new Date().toISOString().slice(0,10):undefined));
  put("guardian_name",text(body?.guardianName??body?.guardian_name,160));put("guardian_relation",text(body?.guardianRelation??body?.guardian_relation,60));put("guardian_phone",text(body?.guardianPhone??body?.guardian_phone,40));put("guardian_phone_2",text(body?.guardianPhone2??body?.guardian_phone_2,40));put("guardian_national_id",text(body?.guardianNationalId??body?.guardian_national_id,40));put("emergency_contact",text(body?.emergencyContact??body?.emergency_contact,240));
  put("monthly_fee",number(body?.fee??body?.monthly_fee));const pd=Number(body?.paymentDay??body?.payment_day);put("payment_day",Number.isInteger(pd)&&pd>=1&&pd<=31?pd:(!partial?1:undefined));
  const st=String(body?.status??"");put("status",["Aktif","Kayıt dondurmuş","Ayrılmış"].includes(st)?st:(!partial?"Aktif":undefined));put("notes",text(body?.notes,2000));Object.keys(row).forEach(k=>row[k]===undefined&&delete row[k]);return row;
}
function admin(identity){return identity?.roles?.includes("Yönetici")}
async function readAll(token,identity){
  const isAdmin=admin(identity);
  const studentRequest=isAdmin?rest(token,"pire_students?select=*&order=full_name.asc"):rest(token,"pire_student_directory?select=student_id,full_name,birth_date,status&order=full_name.asc");
  const [studentsRaw,paymentsRaw,packagesRaw,lessonsRaw,linksRaw]=await Promise.all([studentRequest,rest(token,"pire_payments?select=*&order=billing_month.desc,id.desc"),rest(token,"pire_packages?select=id,student_id,course_name,status,created_at&order=created_at.desc,id.desc"),rest(token,"pire_lessons?select=id,course_name,teacher_name,lesson_date,start_time&order=lesson_date.desc,start_time.desc,id.desc"),rest(token,"pire_lesson_students?select=lesson_id,student_id")]);
  const students=(studentsRaw||[]).map(isAdmin?studentRow:directoryStudentRow),byId=new Map(students.map(s=>[String(s.id),s]));const activeSeen=new Set();for(const p of packagesRaw||[]){const key=String(p.student_id);if(p.status==="Aktif"&&!activeSeen.has(key)&&byId.has(key)){byId.get(key).course=p.course_name||"";activeSeen.add(key)}}
  const lessonById=new Map((lessonsRaw||[]).map(x=>[String(x.id),x])),latestSeen=new Set();for(const link of linksRaw||[]){const sid=String(link.student_id);if(latestSeen.has(sid)||!byId.has(sid))continue;const lesson=lessonById.get(String(link.lesson_id));if(!lesson)continue;const student=byId.get(sid);if(!student.course)student.course=lesson.course_name||"";student.teacher=lesson.teacher_name||"";if(lesson.lesson_date){const d=new Date(`${dateOnly(lesson.lesson_date)}T12:00:00`);const weekday=Number.isNaN(d.getTime())?dateOnly(lesson.lesson_date):d.toLocaleDateString("tr-TR",{weekday:"long"});student.lessonDay=`${weekday} ${timeOnly(lesson.start_time)}`.trim()}latestSeen.add(sid)}
  return {students,payments:(paymentsRaw||[]).map(paymentRow)};
}

module.exports=async function handler(req,res){
  try{
    const {token,identity}=await authenticate(req);
    if(req.method==="GET")return send(res,200,await readAll(token,identity));
    if(!admin(identity))return send(res,403,{error:"Bu işlem yalnızca Yönetici tarafından yapılabilir."});
    if(req.method==="POST"){
      const row=normalize(req.body||{});if(!row.full_name)return send(res,400,{error:"Öğrenci adı zorunludur."});const created=await rest(token,"pire_students?select=*",{method:"POST",body:JSON.stringify(row),headers:{Prefer:"return=representation"}});return send(res,201,{student:studentRow(created?.[0]||{})});
    }
    if(req.method==="PATCH"||req.method==="PUT"){
      const id=Number(req.body?.studentId??req.body?.id);if(!Number.isSafeInteger(id)||id<1)return send(res,400,{error:"Geçerli öğrenci kimliği gerekiyor."});const row=normalize(req.body||{},true);if(!Object.keys(row).length)return send(res,400,{error:"Güncellenecek alan bulunamadı."});const updated=await rest(token,`pire_students?id=eq.${id}&select=*`,{method:"PATCH",body:JSON.stringify(row),headers:{Prefer:"return=representation"}});if(!updated?.length)return send(res,404,{error:"Öğrenci bulunamadı."});return send(res,200,{student:studentRow(updated[0])});
    }
    if(req.method==="DELETE"){
      const id=Number(req.body?.studentId??req.body?.id);if(!Number.isSafeInteger(id)||id<1)return send(res,400,{error:"Geçerli öğrenci kimliği gerekiyor."});if(req.body?.permanent===true){try{await rest(token,`pire_students?id=eq.${id}`,{method:"DELETE",headers:{Prefer:"return=representation"}});return send(res,200,{ok:true,studentId:id,mode:"permanent"})}catch(_){return send(res,409,{error:"Bağlı kayıtları bulunan öğrenci kalıcı silinemedi. Önce arşivleyin."})}}
      const updated=await rest(token,`pire_students?id=eq.${id}&select=*`,{method:"PATCH",body:JSON.stringify({status:"Ayrılmış"}),headers:{Prefer:"return=representation"}});if(!updated?.length)return send(res,404,{error:"Öğrenci bulunamadı."});return send(res,200,{ok:true,student:studentRow(updated[0]),mode:"archive"});
    }
    return send(res,405,{error:"Desteklenmeyen yöntem."},{Allow:"GET, POST, PUT, PATCH, DELETE"});
  }catch(error){if(error?.detail)console.error("Canonical students failed",String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||"Öğrenci işlemi tamamlanamadı."})}
};
module.exports._test={studentRow,directoryStudentRow,paymentRow,normalize};
