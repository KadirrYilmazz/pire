(()=>{
  'use strict';
  if(window.__PIRE_CANONICAL_AI_SYNC__)return;

  const MIN_INTERVAL=15000;
  let timer=null;
  let running=false;
  let lastRun=0;
  let disabled=false;

  function accessToken(){
    try{
      for(let i=0;i<localStorage.length;i+=1){
        const key=localStorage.key(i)||'';
        if(!/^sb-.*-auth-token$/.test(key))continue;
        const value=JSON.parse(localStorage.getItem(key)||'null');
        const token=value?.access_token||value?.currentSession?.access_token;
        if(token)return token;
      }
    }catch(_){}
    return '';
  }

  async function json(path){
    const response=await fetch(path,{headers:{Accept:'application/json'}});
    if(!response.ok)throw Object.assign(new Error(`canonical_read_${response.status}`),{status:response.status});
    return response.json();
  }

  function parseIds(value){
    if(Array.isArray(value))return value;
    if(typeof value==='string'){
      try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[]}catch(_){return value.split(',')}
    }
    return [];
  }

  function buildSnapshot(studentsData,lessonsData,packagesData,attendanceData,financeData){
    const transactions=Array.isArray(financeData?.transactions)?financeData.transactions:[];
    const paidByPayment=new Map();
    for(const row of transactions){
      const paymentId=Number(row?.paymentId);
      if(!Number.isSafeInteger(paymentId)||paymentId<1)continue;
      paidByPayment.set(paymentId,(paidByPayment.get(paymentId)||0)+Number(row?.amount||0));
    }

    const students=(studentsData?.students||[]).map(row=>({
      id:Number(row.id),
      status:row.status,
      monthly_fee:Number(row.fee||0),
      payment_day:Number(row.paymentDay||1)
    }));

    const lessons=[];
    const lesson_students=[];
    for(const row of lessonsData?.lessons||[]){
      const lessonId=Number(row.id);
      lessons.push({
        id:lessonId,
        course:row.course||'',
        lesson_date:row.lessonDate,
        start_time:row.startTime||null,
        duration_minutes:Number(row.duration||60),
        status:row.status||'Planlandı'
      });
      for(const rawId of parseIds(row.studentIds)){
        const studentId=Number(rawId);
        if(Number.isSafeInteger(studentId)&&studentId>0)lesson_students.push({lesson_id:lessonId,student_id:studentId});
      }
    }

    const payments=(studentsData?.payments||[]).map(row=>({
      id:Number(row.id),
      student_id:Number(row.studentId),
      billing_month:/^\d{4}-\d{2}$/.test(String(row.month||''))?`${row.month}-01`:row.month,
      amount_due:Number(row.amount||0),
      amount_paid:Number(paidByPayment.get(Number(row.id))||0),
      status:row.status||'Bekliyor',
      paid_at:row.paidAt||null
    }));

    const packages=(packagesData?.packages||[]).map(row=>({
      id:Number(row.id),
      student_id:Number(row.studentId),
      course:row.course||'',
      total_lessons:Number(row.totalLessons||0),
      remaining_lessons:Number(row.remainingLessons||0),
      makeup_rights:Number(row.makeupRights||0),
      frozen_lessons:Number(row.frozenLessons||0),
      status:row.status||'Aktif',
      start_date:row.startDate||null,
      end_date:row.endDate||null
    }));

    const attendance=(attendanceData?.attendance||[]).map(row=>({
      id:Number(row.id),
      lesson_id:Number(row.lessonId),
      student_id:Number(row.studentId),
      status:row.status||'Bilinmiyor',
      late_minutes:Number(row.lateMinutes||0),
      occurred_at:row.enteredAt||row.updatedAt||null
    }));

    return {students,lessons,lesson_students,payments,packages,attendance};
  }

  async function run(){
    if(disabled||running)return false;
    const token=accessToken();
    if(!token)return false;
    if(Date.now()-lastRun<MIN_INTERVAL)return false;
    running=true;
    try{
      const [studentsData,lessonsData,packagesData,attendanceData,financeData]=await Promise.all([
        json('/api/students'),json('/api/lessons'),json('/api/packages'),json('/api/attendance'),json('/api/finance')
      ]);
      const snapshot=buildSnapshot(studentsData,lessonsData,packagesData,attendanceData,financeData);
      const response=await fetch('/api/assistant-sync',{
        method:'POST',
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify({snapshot})
      });
      if(response.status===403){disabled=true;return false}
      if(!response.ok)throw new Error(`assistant_sync_${response.status}`);
      lastRun=Date.now();
      window.__PIRE_CANONICAL_AI_SYNC_STATUS__={ok:true,at:new Date().toISOString()};
      return true;
    }catch(error){
      window.__PIRE_CANONICAL_AI_SYNC_STATUS__={ok:false,error:String(error?.message||error),at:new Date().toISOString()};
      return false;
    }finally{running=false}
  }

  function schedule(delay=2500){
    if(disabled)return;
    clearTimeout(timer);
    const wait=Math.max(delay,MIN_INTERVAL-(Date.now()-lastRun));
    timer=setTimeout(run,wait);
  }

  window.addEventListener('pire:canonical-response',event=>{
    const method=String(event?.detail?.method||'GET').toUpperCase();
    if(event?.detail?.ok&&method!=='GET')schedule(3000);
  });
  window.addEventListener('focus',()=>schedule(5000));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(5000)});
  schedule(3500);

  window.__PIRE_CANONICAL_AI_SYNC__={enabled:true,mode:'canonical-api-snapshot',run,schedule,buildSnapshot};
})();
