"use strict";

const {send,rest,authenticate,dateOnly}=require("./_canonical");

module.exports=async function handler(req,res){
  if(req.method!=="GET")return send(res,405,{error:"Yalnızca GET isteği kabul edilir."},{Allow:"GET"});
  try{
    const {token}=await authenticate(req);
    const [packages,adjustments]=await Promise.all([
      rest(token,"pire_packages?select=*&order=created_at.asc,id.asc"),
      rest(token,"pire_package_adjustments?select=*&order=created_at.asc,id.asc")
    ]);
    const byPackage=new Map();
    for(const row of adjustments||[]){const key=String(row.package_id);if(!byPackage.has(key))byPackage.set(key,[]);byPackage.get(key).push({
      id:Number(row.id),packageId:Number(row.package_id),lessonChange:Number(row.lesson_change||0),makeupChange:Number(row.makeup_change||0),
      frozenChange:Number(row.frozen_change||0),reason:row.reason||"",createdAt:row.created_at
    })}
    return send(res,200,{packages:(packages||[]).map(row=>({
      id:Number(row.id),studentId:Number(row.student_id),course:row.course_name,totalLessons:Number(row.total_lessons||0),usedLessons:Number(row.used_lessons||0),
      remainingLessons:Number(row.remaining_lessons||0),makeupRights:Number(row.makeup_rights||0),frozenLessons:Number(row.frozen_lessons||0),
      startDate:dateOnly(row.start_date),endDate:dateOnly(row.end_date),status:row.status,createdAt:row.created_at,adjustments:byPackage.get(String(row.id))||[]
    }))});
  }catch(error){if(error?.detail)console.error("Canonical packages failed",String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||"Paket kayıtları alınamadı."})}
};
