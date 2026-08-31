"use strict";

const {send,rest,authenticate,asNumber,dateOnly,timeOnly}=require("./_canonical");

function studentRow(row){return {
  id:Number(row.id),name:row.full_name,birthDate:dateOnly(row.birth_date),bloodGroup:row.blood_group,phone:row.phone,photoKey:null,
  address:row.address,nationalId:row.national_id,heardFrom:row.heard_from,registrationDate:dateOnly(row.registration_date),
  guardianName:row.guardian_name,guardianRelation:row.guardian_relation,guardianPhone:row.guardian_phone,guardianPhone2:row.guardian_phone_2,
  guardianNationalId:row.guardian_national_id,emergencyContact:row.emergency_contact,course:"",teacher:"",lessonDay:"",
  fee:asNumber(row.monthly_fee),paymentDay:Number(row.payment_day||1),status:row.status,notes:row.notes
}}

function paymentRow(row){return {id:Number(row.id),studentId:Number(row.student_id),month:String(row.billing_month||"").slice(0,7),amount:asNumber(row.amount_due),status:row.status,paidAt:row.paid_at||null}}

module.exports=async function handler(req,res){
  if(req.method!=="GET")return send(res,405,{error:"Yalnızca GET isteği kabul edilir."},{Allow:"GET"});
  try{
    const {token}=await authenticate(req);
    const [studentsRaw,paymentsRaw,packagesRaw,lessonsRaw,linksRaw]=await Promise.all([
      rest(token,"pire_students?select=*&order=full_name.asc"),
      rest(token,"pire_payments?select=*&order=billing_month.desc,id.desc"),
      rest(token,"pire_packages?select=id,student_id,course_name,status,created_at&order=created_at.desc,id.desc"),
      rest(token,"pire_lessons?select=id,course_name,teacher_name,lesson_date,start_time&order=lesson_date.desc,start_time.desc,id.desc"),
      rest(token,"pire_lesson_students?select=lesson_id,student_id")
    ]);
    const students=(studentsRaw||[]).map(studentRow),byId=new Map(students.map(s=>[String(s.id),s]));
    const activeSeen=new Set();
    for(const p of packagesRaw||[]){const key=String(p.student_id);if(p.status==="Aktif"&&!activeSeen.has(key)&&byId.has(key)){byId.get(key).course=p.course_name||"";activeSeen.add(key)}}
    const lessonById=new Map((lessonsRaw||[]).map(x=>[String(x.id),x]));
    const latestSeen=new Set();
    for(const link of linksRaw||[]){const sid=String(link.student_id);if(latestSeen.has(sid)||!byId.has(sid))continue;const lesson=lessonById.get(String(link.lesson_id));if(!lesson)continue;const student=byId.get(sid);if(!student.course)student.course=lesson.course_name||"";student.teacher=lesson.teacher_name||"";if(lesson.lesson_date){const d=new Date(`${dateOnly(lesson.lesson_date)}T12:00:00`);const weekday=Number.isNaN(d.getTime())?dateOnly(lesson.lesson_date):d.toLocaleDateString("tr-TR",{weekday:"long"});student.lessonDay=`${weekday} ${timeOnly(lesson.start_time)}`.trim()}latestSeen.add(sid)}
    return send(res,200,{students,payments:(paymentsRaw||[]).map(paymentRow)});
  }catch(error){if(error?.detail)console.error("Canonical students failed",String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||"Öğrenci kayıtları alınamadı."})}
};

module.exports._test={studentRow,paymentRow};
