"use strict";

const {send,rest,authenticate,asNumber,dateOnly}=require("./_canonical");
module.exports=async function handler(req,res){
  if(String(req.method||'GET').toUpperCase()!=='GET')return send(res,405,{error:'Yalnızca GET isteği kabul edilir.'},{Allow:'GET'});
  try{
    const {token,identity}=await authenticate(req);if(!identity.roles.includes('Yönetici'))return send(res,403,{error:'Finans özeti yalnızca Yönetici tarafından görüntülenebilir.'});
    const [students,payments,transactions,packages,lessons,links]=await Promise.all([
      rest(token,'pire_students?select=id,full_name,monthly_fee'),rest(token,'pire_payments?select=*'),rest(token,'pire_payment_transactions?select=*'),
      rest(token,'pire_packages?select=student_id,total_lessons,remaining_lessons,status'),rest(token,'pire_lessons?select=id'),rest(token,'pire_lesson_students?select=lesson_id,student_id')
    ]);
    const paidByStudent=new Map();for(const t of transactions||[]){const k=String(t.student_id);paidByStudent.set(k,(paidByStudent.get(k)||0)+asNumber(t.amount))}
    const paymentDueByStudent=new Map();for(const p of payments||[]){const k=String(p.student_id);paymentDueByStudent.set(k,(paymentDueByStudent.get(k)||0)+asNumber(p.amount_due))}
    const packageByStudent=new Map();for(const p of packages||[]){const k=String(p.student_id);if(!packageByStudent.has(k)||p.status==='Aktif')packageByStudent.set(k,p)}
    const lessonCountByStudent=new Map();for(const l of links||[]){const k=String(l.student_id);lessonCountByStudent.set(k,(lessonCountByStudent.get(k)||0)+1}
    const ledgers=(students||[]).map(s=>{const k=String(s.id),monthly=paymentDueByStudent.get(k)||asNumber(s.monthly_fee),paid=paidByStudent.get(k)||0,pkg=packageByStudent.get(k);return {studentId:Number(s.id),student:s.full_name,monthlyCharges:monthly,perLessonCharges:0,totalDebt:monthly,paid,balance:Math.max(0,monthly-paid),packageLessons:Number(pkg?.total_lessons||0),packageRemaining:Number(pkg?.remaining_lessons||0),freeLessons:0,lessonCount:lessonCountByStudent.get(k)||0}});
    return send(res,200,{ledgers,transactions:(transactions||[]).map(t=>({id:Number(t.id),paymentId:t.payment_id==null?null:Number(t.payment_id),studentId:Number(t.student_id),amount:asNumber(t.amount),paymentDate:dateOnly(t.payment_date),method:t.method,notes:t.notes,createdAt:t.created_at}))});
  }catch(error){if(error?.detail)console.error('Canonical finance failed',String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||'Finans özeti alınamadı.'})}
};
