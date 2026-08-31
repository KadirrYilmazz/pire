"use strict";

const {send,rest,authenticate,asNumber,dateOnly}=require("./_canonical");
const {attendanceHandler}=require('../lib/canonical-attendance');
const {makeupsHandler}=require('../lib/canonical-ops');
const {settingsHandler,announcementsHandler,auditHandler,earningsHandler}=require('../lib/canonical-admin-ops');
const {notificationsHandler}=require('../lib/canonical-notifications');
const {backupHandler}=require('../lib/canonical-backup');
const {customersHandler}=require('../lib/canonical-customers');
function short(v,m=500){return String(v??"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,m)}
function id(v){const n=Number(v);return Number.isSafeInteger(n)&&n>0?n:null}
function amount(v){const n=Number(v);return Number.isFinite(n)&&n>0&&n<=1_000_000_000?Math.round(n*100)/100:null}
function date(v){const x=short(v,10);return /^\d{4}-\d{2}-\d{2}$/.test(x)?x:null}
function month(v){const x=short(v,10);if(/^\d{4}-\d{2}$/.test(x))return `${x}-01`;return date(x)}
async function getFinance(token){
  const [students,payments,transactions,packages,lessons,links]=await Promise.all([
    rest(token,'pire_students?select=id,full_name,monthly_fee'),rest(token,'pire_payments?select=*'),rest(token,'pire_payment_transactions?select=*'),
    rest(token,'pire_packages?select=student_id,total_lessons,remaining_lessons,status'),rest(token,'pire_lessons?select=id'),rest(token,'pire_lesson_students?select=lesson_id,student_id')
  ]);
  const paidByStudent=new Map();for(const t of transactions||[]){const k=String(t.student_id);paidByStudent.set(k,(paidByStudent.get(k)||0)+asNumber(t.amount))}
  const paymentDueByStudent=new Map();for(const p of payments||[]){const k=String(p.student_id);paymentDueByStudent.set(k,(paymentDueByStudent.get(k)||0)+asNumber(p.amount_due))}
  const packageByStudent=new Map();for(const p of packages||[]){const k=String(p.student_id);if(!packageByStudent.has(k)||p.status==='Aktif')packageByStudent.set(k,p)}
  const lessonCountByStudent=new Map();for(const l of links||[]){const k=String(l.student_id);lessonCountByStudent.set(k,(lessonCountByStudent.get(k)||0)+1)}
  const ledgers=(students||[]).map(s=>{const k=String(s.id),monthly=paymentDueByStudent.get(k)||asNumber(s.monthly_fee),paid=paidByStudent.get(k)||0,pkg=packageByStudent.get(k);return {studentId:Number(s.id),student:s.full_name,monthlyCharges:monthly,perLessonCharges:0,totalDebt:monthly,paid,balance:Math.max(0,monthly-paid),packageLessons:Number(pkg?.total_lessons||0),packageRemaining:Number(pkg?.remaining_lessons||0),freeLessons:0,lessonCount:lessonCountByStudent.get(k)||0}});
  return {ledgers,transactions:(transactions||[]).map(t=>({id:Number(t.id),paymentId:t.payment_id==null?null:Number(t.payment_id),studentId:Number(t.student_id),amount:asNumber(t.amount),paymentDate:dateOnly(t.payment_date),method:t.method,notes:t.notes,createdAt:t.created_at}))};
}

module.exports=async function handler(req,res){
  const op=String(req.query?.op||'').toLowerCase();
  if(op==='attendance')return attendanceHandler(req,res);
  if(op==='makeups')return makeupsHandler(req,res);
  if(op==='settings')return settingsHandler(req,res);
  if(op==='announcements')return announcementsHandler(req,res);
  if(op==='security-audit')return auditHandler(req,res);
  if(op==='earnings')return earningsHandler(req,res);
  if(op==='notifications')return notificationsHandler(req,res);
  if(op==='backup')return backupHandler(req,res);
  if(op==='customers')return customersHandler(req,res);
  const method=String(req.method||'GET').toUpperCase();
  if(!['GET','POST'].includes(method))return send(res,405,{error:'Desteklenmeyen istek yöntemi.'},{Allow:'GET, POST'});
  try{
    const {token,identity}=await authenticate(req);if(!identity.roles.includes('Yönetici'))return send(res,403,{error:'Finans işlemleri yalnızca Yönetici tarafından kullanılabilir.'});
    if(method==='GET')return send(res,200,await getFinance(token));
    const body=req.body||{},studentId=id(body.studentId),paidAmount=amount(body.amount??body.paidAmount??body.paymentAmount);
    if(!studentId||paidAmount==null)return send(res,400,{error:'Geçerli öğrenci ve tahsilat tutarı gerekiyor.'});
    const payload={
      p_student_id:studentId,p_amount:paidAmount,p_payment_date:date(body.paymentDate??body.date)||new Date().toISOString().slice(0,10),
      p_method:short(body.method??body.paymentMethod,80)||null,p_notes:short(body.notes,1000)||null,p_payment_id:id(body.paymentId),
      p_billing_month:month(body.billingMonth??body.month),p_amount_due:amount(body.amountDue)
    };
    const result=await rest(token,'rpc/pire_record_payment',{method:'POST',body:JSON.stringify(payload),headers:{'content-type':'application/json',Prefer:'return=representation'}});
    const row=Array.isArray(result)?result[0]:result;
    if(!row?.transaction_id)return send(res,502,{error:'Tahsilat kaydedildi fakat işlem kimliği alınamadı.'});
    return send(res,201,{ok:true,transaction:{id:Number(row.transaction_id),paymentId:row.payment_id==null?null:Number(row.payment_id),studentId,amount:paidAmount,paymentDate:payload.p_payment_date,method:payload.p_method,notes:payload.p_notes},paymentStatus:row.payment_status||null,mode:'atomic'});
  }catch(error){if(error?.detail)console.error('Canonical finance failed',String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||'Finans işlemi tamamlanamadı.'})}
};

module.exports._test={amount,date,month,id};
