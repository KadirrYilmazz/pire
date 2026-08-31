"use strict";

const {send,rest,authenticate,asNumber,dateOnly}=require("./_canonical");

module.exports=async function handler(req,res){
  if(req.method!=="GET")return send(res,405,{error:"Yalnızca GET isteği kabul edilir."},{Allow:"GET"});
  try{
    const {token}=await authenticate(req);
    const [teachers,courses,links]=await Promise.all([
      rest(token,"pire_teachers?select=*&order=full_name.asc"),
      rest(token,"pire_courses?select=*&order=name.asc"),
      rest(token,"pire_teacher_courses?select=teacher_id,course_id")
    ]);
    const courseById=new Map((courses||[]).map(c=>[String(c.id),c.name]));
    const courseNamesByTeacher=new Map();
    for(const link of links||[]){const key=String(link.teacher_id);if(!courseNamesByTeacher.has(key))courseNamesByTeacher.set(key,[]);const name=courseById.get(String(link.course_id));if(name)courseNamesByTeacher.get(key).push(name)}
    return send(res,200,{
      teachers:(teachers||[]).map(row=>({
        id:Number(row.id),type:"teacher",name:row.full_name,phone:row.phone,backupPhone:row.backup_phone,nationalId:row.national_id,birthDate:dateOnly(row.birth_date),
        courses:JSON.stringify(courseNamesByTeacher.get(String(row.id))||[]),startDate:dateOnly(row.start_date),address:row.address,emergencyContact:row.emergency_contact,
        availability:row.availability,iban:row.iban,compensationType:row.compensation_type,compensationAmount:asNumber(row.compensation_amount),
        groupCompensationAmount:asNumber(row.group_compensation_amount),cancellationRule:row.cancellation_rule,status:row.status,notes:row.notes
      })),
      courses:(courses||[]).map(row=>({id:Number(row.id),type:"course",name:row.name,status:row.status}))
    });
  }catch(error){if(error?.detail)console.error("Canonical catalog failed",String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||"Katalog alınamadı."})}
};
