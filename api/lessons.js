"use strict";

const {send,rest,authenticate,asNumber,dateOnly,timeOnly}=require("./_canonical");

module.exports=async function handler(req,res){
  if(req.method!=="GET")return send(res,405,{error:"Yalnızca GET isteği kabul edilir."},{Allow:"GET"});
  try{
    const {token}=await authenticate(req);
    const [lessons,links]=await Promise.all([
      rest(token,"pire_lessons?select=*&order=lesson_date.asc,start_time.asc,id.asc"),
      rest(token,"pire_lesson_students?select=lesson_id,student_id")
    ]);
    const studentsByLesson=new Map();
    for(const link of links||[]){const key=String(link.lesson_id);if(!studentsByLesson.has(key))studentsByLesson.set(key,[]);studentsByLesson.get(key).push(String(link.student_id))}
    return send(res,200,{lessons:(lessons||[]).map(row=>({
      id:Number(row.id),seriesId:row.series_id,course:row.course_name,lessonType:row.lesson_type||"Birebir ders",
      studentIds:JSON.stringify(studentsByLesson.get(String(row.id))||[]),teacher:row.teacher_name||"",lessonDate:dateOnly(row.lesson_date),
      startTime:timeOnly(row.start_time),endTime:timeOnly(row.end_time),duration:Number(row.duration_minutes||60),room:row.room||"",
      recurrence:row.recurrence||"Tek seferlik",recurrenceEnd:dateOnly(row.recurrence_end),pricingType:row.pricing_type||"Ders paketi",
      fee:asNumber(row.fee),capacity:Number(row.capacity||1),status:row.status,countsAsHeld:row.counts_as_held?1:0,cancelledAt:row.cancelled_at||null,notes:row.notes
    }))});
  }catch(error){if(error?.detail)console.error("Canonical lessons failed",String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||"Ders kayıtları alınamadı."})}
};
