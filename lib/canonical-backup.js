"use strict";

const {send,rest,authenticate}=require('../api/_canonical');

const TABLES=[
  'pire_students','pire_teachers','pire_courses','pire_teacher_courses',
  'pire_payments','pire_payment_transactions','pire_expenses',
  'pire_lessons','pire_lesson_students','pire_packages','pire_package_adjustments',
  'pire_attendance','pire_lesson_progress','pire_attendance_history',
  'pire_makeup_rights','pire_lesson_changes','pire_teacher_payouts',
  'pire_institution_settings','pire_announcements','pire_announcement_reads','pire_audit_logs',
  'pire_notification_preferences','pire_notification_reads'
];

const REQUIRED_CANONICAL=['pire_students','pire_teachers','pire_courses','pire_lessons','pire_packages'];

function canonicalCounts(tables={}){
  return Object.fromEntries(TABLES.map(name=>[name,Array.isArray(tables[name])?tables[name].length:0]));
}

function validateCandidate(candidate){
  const backup=candidate?.backup||candidate;
  if(!backup||typeof backup!=='object')return {valid:false,error:'Geçerli bir Pİ-RE yedeği bulunamadı.'};

  if(Number(backup.version)>=2&&backup?.data?.tables&&typeof backup.data.tables==='object'){
    const tables=backup.data.tables;
    const missing=REQUIRED_CANONICAL.filter(name=>!Array.isArray(tables[name]));
    if(missing.length)return {valid:false,error:'Canonical yedekte zorunlu tablolar eksik.',missing};
    const counts=canonicalCounts(tables);
    return {valid:true,version:Number(backup.version),format:backup.schema||'pire-canonical-v2',counts,total:Object.values(counts).reduce((a,b)=>a+b,0)};
  }

  const data=backup.data||backup;
  const required=['students','catalog','lessons','packages','finance'];
  const missing=required.filter(key=>!data?.[key]);
  if(missing.length)return {valid:false,error:'Eski tip yedekte zorunlu bölümler eksik.',missing};
  const counts={
    students:data.students?.students?.length||0,
    teachers:data.catalog?.teachers?.length||0,
    courses:data.catalog?.courses?.length||0,
    lessons:data.lessons?.lessons?.length||0,
    packages:data.packages?.packages?.length||0,
    payments:data.students?.payments?.length||0,
    expenses:data.expenses?.expenses?.length||0,
    attendance:data.attendance?.attendance?.length||0,
    makeups:data.makeups?.rights?.length||0,
    announcements:data.announcements?.announcements?.length||0
  };
  return {valid:true,version:Number(backup.version||1),format:'pire-legacy-v1',counts,total:Object.values(counts).reduce((a,b)=>a+b,0)};
}

async function exportCanonical(token){
  const pairs=await Promise.all(TABLES.map(async name=>[name,await rest(token,`${name}?select=*`)]));
  const tables=Object.fromEntries(pairs);
  return {
    version:2,
    schema:'pire-canonical-v2',
    source:'supabase-canonical',
    exportedAt:new Date().toISOString(),
    data:{tables},
    counts:canonicalCounts(tables)
  };
}

async function backupHandler(req,res){
  const method=String(req.method||'GET').toUpperCase();
  if(!['GET','POST'].includes(method))return send(res,405,{error:'Desteklenmeyen istek yöntemi.'},{Allow:'GET, POST'});
  try{
    const {token,identity}=await authenticate(req);
    if(!identity.roles.includes('Yönetici'))return send(res,403,{error:'Yedekleme işlemleri yalnızca Yönetici tarafından kullanılabilir.'});

    if(method==='GET'){
      const backup=await exportCanonical(token);
      const day=backup.exportedAt.slice(0,10);
      return send(res,200,backup,{'content-disposition':`attachment; filename="pire-canonical-yedek-${day}.json"`});
    }

    const body=req.body||{};
    const validation=validateCandidate(body.backup||body);
    if(String(body.mode||'validate').toLowerCase()==='validate')return send(res,validation.valid?200:400,validation);
    if(String(body.mode||'').toLowerCase()==='restore'){
      if(!validation.valid)return send(res,400,validation);
      return send(res,409,{error:'Canonical geri yükleme henüz atomik restore işlemi olmadan çalıştırılamaz.',code:'atomic_restore_required',validation});
    }
    return send(res,400,{error:'Bilinmeyen yedekleme işlemi.'});
  }catch(error){
    if(error?.detail)console.error('Canonical backup failed',String(error.detail).slice(0,500));
    return send(res,error?.status||500,{error:error?.message||'Yedekleme işlemi tamamlanamadı.'});
  }
}

module.exports={backupHandler,_test:{validateCandidate,canonicalCounts,TABLES,REQUIRED_CANONICAL}};
