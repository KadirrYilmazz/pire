"use strict";

const {send,rest,authenticate}=require('../api/_canonical');

function short(v,m=2000){return String(v??'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,m)}
function id(v){const n=Number(v);return Number.isSafeInteger(n)&&n>0?n:null}
function date(v){const x=short(v,10);return /^\d{4}-\d{2}-\d{2}$/.test(x)?x:null}
function money(v){if(v==null||v==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0&&n<=1_000_000_000?Math.round(n*100)/100:null}
function phone(v){let d=String(v??'').replace(/\D/g,'');if(d.startsWith('90')&&d.length>10)d=d.slice(2);if(d.startsWith('0'))d=d.slice(1);return d.slice(0,10)||null}
async function write(token,path,method,body){return rest(token,path,{method,body:JSON.stringify(body),headers:{'content-type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'}})}
function out(r){return {id:Number(r.id),code:r.customer_code,name:r.full_name,phone:r.phone,type:r.service_type,project:r.project,date:r.planned_date,budget:r.budget==null?null:Number(r.budget),status:r.status,notes:r.notes,createdAt:r.created_at,updatedAt:r.updated_at}}
function payload(b){const name=short(b?.name??b?.fullName,240);if(!name)return null;return {full_name:name,phone:phone(b.phone),service_type:short(b.type??b.serviceType,80)||'Stüdyo',project:short(b.project,1000)||null,planned_date:date(b.date??b.plannedDate),budget:money(b.budget),status:short(b.status,80)||'Yeni Talep',notes:short(b.notes,4000)||null,updated_at:new Date().toISOString()}}

async function customersHandler(req,res){
  const method=String(req.method||'GET').toUpperCase();
  if(!['GET','POST','PATCH','PUT','DELETE'].includes(method))return send(res,405,{error:'Desteklenmeyen istek yöntemi.'},{Allow:'GET, POST, PATCH, PUT, DELETE'});
  try{
    const {token,identity}=await authenticate(req);
    if(!identity.roles.includes('Yönetici'))return send(res,403,{error:'Müşteri kayıtlarını yalnızca Yönetici kullanabilir.'});
    if(method==='GET'){
      const rows=await rest(token,'pire_customers?select=*&order=created_at.desc,id.desc');
      return send(res,200,{customers:(rows||[]).map(out)});
    }
    const b=req.body||{},cid=id(b.customerId??b.id);
    if(method==='DELETE'){
      if(!cid)return send(res,400,{error:'Müşteri kimliği gerekiyor.'});
      await rest(token,`pire_customers?id=eq.${cid}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
      return send(res,200,{ok:true,id:cid});
    }
    const data=payload(b);
    if(!data)return send(res,400,{error:'Müşteri adı gerekiyor.'});
    if(method==='POST'){
      const rows=await write(token,'pire_customers','POST',[data]);
      const row=Array.isArray(rows)?rows[0]:rows;
      if(row?.id&&!row.customer_code){
        const code='MUS-'+String(row.id).padStart(3,'0');
        const updated=await write(token,`pire_customers?id=eq.${row.id}`,'PATCH',{customer_code:code,updated_at:new Date().toISOString()});
        return send(res,201,{ok:true,customer:out(Array.isArray(updated)?updated[0]:updated)});
      }
      return send(res,201,{ok:true,customer:out(row)});
    }
    if(!cid)return send(res,400,{error:'Müşteri kimliği gerekiyor.'});
    const rows=await write(token,`pire_customers?id=eq.${cid}`,'PATCH',data);
    const row=Array.isArray(rows)?rows[0]:rows;
    if(!row)return send(res,404,{error:'Müşteri bulunamadı.'});
    return send(res,200,{ok:true,customer:out(row)});
  }catch(e){return send(res,e?.status||500,{error:e?.message||'Müşteri işlemi tamamlanamadı.'})}
}

module.exports={customersHandler,_test:{short,id,date,money,phone,payload,out}};
