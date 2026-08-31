"use strict";

const {send,rest,authenticate,asNumber,dateOnly}=require("./_canonical");

function short(value,max=200){return String(value??"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,max)}
function nullable(value,max=200){const v=short(value,max);return v||null}
function date(value){const v=short(value,10);return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:null}
function amount(value){const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=1_000_000_000?Math.round(n*100)/100:0}
function id(value){const n=Number(value);return Number.isSafeInteger(n)&&n>0?n:null}
function parseCourses(value){
  if(Array.isArray(value))return value.map(x=>short(x,80)).filter(Boolean).slice(0,50);
  if(typeof value!=="string"||!value.trim())return [];
  try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed.map(x=>short(x,80)).filter(Boolean).slice(0,50):[]}
  catch(_){return value.split(",").map(x=>short(x,80)).filter(Boolean).slice(0,50)}
}
function teacherPayload(body){
  const name=short(body?.name??body?.fullName,160);if(!name)return null;
  return {full_name:name,phone:nullable(body?.phone,40),backup_phone:nullable(body?.backupPhone,40),national_id:nullable(body?.nationalId,40),
    birth_date:date(body?.birthDate),start_date:date(body?.startDate),address:nullable(body?.address,500),emergency_contact:nullable(body?.emergencyContact,240),
    availability:nullable(body?.availability,500),iban:nullable(body?.iban,80),compensation_type:nullable(body?.compensationType,100),
    compensation_amount:amount(body?.compensationAmount),group_compensation_amount:amount(body?.groupCompensationAmount),
    cancellation_rule:nullable(body?.cancellationRule,200),status:["Aktif","Ayrılmış","Pasif"].includes(short(body?.status,40))?short(body?.status,40):"Aktif",
    notes:nullable(body?.notes,2000),updated_at:new Date().toISOString()};
}
function coursePayload(body){const name=short(body?.name,80);return name?{name,status:["Aktif","Pasif"].includes(short(body?.status,40))?short(body?.status,40):"Aktif",updated_at:new Date().toISOString()}:null}
async function write(token,path,method,body){return rest(token,path,{method,body:body===undefined?undefined:JSON.stringify(body),headers:body===undefined?{}:{Prefer:"return=representation,resolution=merge-duplicates"}})}
async function syncTeacherCourses(token,teacherId,courses){
  const names=parseCourses(courses);
  return rest(token,"rpc/pire_sync_teacher_courses",{method:"POST",body:JSON.stringify({p_teacher_id:teacherId,p_course_names:names}),headers:{Prefer:"return=representation"}});
}
async function getAdminCatalog(token){
  const [teachers,courses,links]=await Promise.all([
    rest(token,"pire_teachers?select=*&order=full_name.asc"),rest(token,"pire_courses?select=*&order=name.asc"),rest(token,"pire_teacher_courses?select=teacher_id,course_id")
  ]);
  const courseById=new Map((courses||[]).map(c=>[String(c.id),c.name])),courseNamesByTeacher=new Map();
  for(const link of links||[]){const key=String(link.teacher_id);if(!courseNamesByTeacher.has(key))courseNamesByTeacher.set(key,[]);const name=courseById.get(String(link.course_id));if(name)courseNamesByTeacher.get(key).push(name)}
  return {teachers:(teachers||[]).map(row=>({id:Number(row.id),type:"teacher",name:row.full_name,phone:row.phone,backupPhone:row.backup_phone,nationalId:row.national_id,birthDate:dateOnly(row.birth_date),courses:JSON.stringify(courseNamesByTeacher.get(String(row.id))||[]),startDate:dateOnly(row.start_date),address:row.address,emergencyContact:row.emergency_contact,availability:row.availability,iban:row.iban,compensationType:row.compensation_type,compensationAmount:asNumber(row.compensation_amount),groupCompensationAmount:asNumber(row.group_compensation_amount),cancellationRule:row.cancellation_rule,status:row.status,notes:row.notes})),courses:(courses||[]).map(row=>({id:Number(row.id),type:"course",name:row.name,status:row.status}))};
}
async function getSafeCatalog(token){
  const [teachers,courses,links]=await Promise.all([
    rest(token,"pire_teacher_directory?select=teacher_id,full_name,status&status=eq.Aktif&order=full_name.asc"),
    rest(token,"pire_courses?select=id,name,status&status=eq.Aktif&order=name.asc"),
    rest(token,"pire_teacher_courses?select=teacher_id,course_id")
  ]);
  const courseById=new Map((courses||[]).map(c=>[String(c.id),c.name])),courseNamesByTeacher=new Map();
  for(const link of links||[]){const key=String(link.teacher_id);if(!courseNamesByTeacher.has(key))courseNamesByTeacher.set(key,[]);const name=courseById.get(String(link.course_id));if(name)courseNamesByTeacher.get(key).push(name)}
  return {
    teachers:(teachers||[]).map(row=>({id:Number(row.teacher_id),type:"teacher",name:row.full_name,courses:JSON.stringify(courseNamesByTeacher.get(String(row.teacher_id))||[]),status:row.status})),
    courses:(courses||[]).map(row=>({id:Number(row.id),type:"course",name:row.name,status:row.status}))
  };
}

module.exports=async function handler(req,res){
  const method=String(req.method||"GET").toUpperCase();
  if(!["GET","POST","PATCH","PUT","DELETE"].includes(method))return send(res,405,{error:"Desteklenmeyen istek yöntemi."},{Allow:"GET, POST, PATCH, PUT, DELETE"});
  try{
    const {token,identity}=await authenticate(req);
    if(method==="GET")return send(res,200,identity.roles.includes("Yönetici")?await getAdminCatalog(token):await getSafeCatalog(token));
    if(!identity.roles.includes("Yönetici"))return send(res,403,{error:"Katalog değişiklikleri yalnızca Yönetici tarafından yapılabilir."});
    const body=req.body||{},type=short(body.type||body.kind||body.entityType,20).toLocaleLowerCase("tr-TR");
    const teacherMode=type==="teacher"||type==="eğitmen"||body.teacherId!=null||body.compensationType!=null||body.courses!=null;
    if(teacherMode){
      const teacherId=id(body.teacherId??body.id);
      if(method==="DELETE"){
        if(!teacherId)return send(res,400,{error:"Geçerli eğitmen kimliği gerekiyor."});
        const updated=await write(token,`pire_teachers?id=eq.${teacherId}`,"PATCH",{status:"Ayrılmış",updated_at:new Date().toISOString()});
        return send(res,200,{ok:true,teacher:Array.isArray(updated)?updated[0]||null:updated,mode:"archived"});
      }
      const payload=teacherPayload(body);if(!payload)return send(res,400,{error:"Eğitmen adı gerekiyor."});
      if(method==="POST"){
        const created=await write(token,"pire_teachers","POST",[payload]);const teacher=Array.isArray(created)?created[0]:created;
        if(!teacher?.id)return send(res,502,{error:"Eğitmen oluşturuldu fakat kimliği alınamadı."});
        await syncTeacherCourses(token,Number(teacher.id),body.courses);
        return send(res,201,{ok:true,teacher:{...body,id:Number(teacher.id),type:"teacher",name:teacher.full_name}});
      }
      if(!teacherId)return send(res,400,{error:"Geçerli eğitmen kimliği gerekiyor."});
      const updated=await write(token,`pire_teachers?id=eq.${teacherId}`,"PATCH",payload);
      if(body.courses!==undefined)await syncTeacherCourses(token,teacherId,body.courses);
      const teacher=Array.isArray(updated)?updated[0]:updated;
      return send(res,200,{ok:true,teacher:{...body,id:teacherId,type:"teacher",name:teacher?.full_name||payload.full_name}});
    }
    const courseId=id(body.courseId??body.id);
    if(method==="DELETE"){
      if(!courseId)return send(res,400,{error:"Geçerli branş kimliği gerekiyor."});
      const updated=await write(token,`pire_courses?id=eq.${courseId}`,"PATCH",{status:"Pasif",updated_at:new Date().toISOString()});
      return send(res,200,{ok:true,course:Array.isArray(updated)?updated[0]||null:updated,mode:"archived"});
    }
    const payload=coursePayload(body);if(!payload)return send(res,400,{error:"Branş adı gerekiyor."});
    if(method==="POST"){
      const current=await rest(token,"pire_courses?select=id,name,status");const key=payload.name.toLocaleLowerCase("tr-TR");const duplicate=(current||[]).find(x=>String(x.name||"").trim().toLocaleLowerCase("tr-TR")===key);
      if(duplicate)return send(res,200,{ok:true,course:{id:Number(duplicate.id),type:"course",name:duplicate.name,status:duplicate.status},deduped:true});
      const created=await write(token,"pire_courses","POST",[payload]);const course=Array.isArray(created)?created[0]:created;
      return send(res,201,{ok:true,course:{id:Number(course.id),type:"course",name:course.name,status:course.status}});
    }
    if(!courseId)return send(res,400,{error:"Geçerli branş kimliği gerekiyor."});
    const updated=await write(token,`pire_courses?id=eq.${courseId}`,"PATCH",payload),course=Array.isArray(updated)?updated[0]:updated;
    return send(res,200,{ok:true,course:{id:courseId,type:"course",name:course?.name||payload.name,status:course?.status||payload.status}});
  }catch(error){if(error?.detail)console.error("Canonical catalog failed",String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||"Katalog işlemi tamamlanamadı."})}
};

module.exports._test={teacherPayload,coursePayload,parseCourses};
