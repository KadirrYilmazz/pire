"use strict";

const {send,rest,authenticate,asNumber,dateOnly}=require("./_canonical");
function short(v,m=200){return String(v??"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,m)}
function nullable(v,m=200){const x=short(v,m);return x||null}
function id(v){const n=Number(v);return Number.isSafeInteger(n)&&n>0?n:null}
function amount(v){const n=Number(v);return Number.isFinite(n)&&n>=0&&n<=1_000_000_000?Math.round(n*100)/100:null}
function date(v){const x=short(v,10);return /^\d{4}-\d{2}-\d{2}$/.test(x)?x:null}
async function write(token,path,method,body){return rest(token,path,{method,body:body===undefined?undefined:JSON.stringify(body),headers:body===undefined?{}:{Prefer:"return=representation,resolution=merge-duplicates"}})}
function row(r){return {id:Number(r.id),title:r.title,category:r.category,amount:asNumber(r.amount),expenseDate:dateOnly(r.expense_date)}}
module.exports=async function handler(req,res){
  const method=String(req.method||'GET').toUpperCase();if(!['GET','POST','PATCH','PUT','DELETE'].includes(method))return send(res,405,{error:'Desteklenmeyen istek yöntemi.'},{Allow:'GET, POST, PATCH, PUT, DELETE'});
  try{
    const {token,identity}=await authenticate(req);
    if(method==='GET'){const rows=await rest(token,'pire_expenses?select=*&order=expense_date.desc,id.desc');return send(res,200,{expenses:(rows||[]).map(row)})}
    if(!identity.roles.includes('Yönetici'))return send(res,403,{error:'Gider değişiklikleri yalnızca Yönetici tarafından yapılabilir.'});
    const body=req.body||{},expenseId=id(body.expenseId??body.id);
    if(method==='DELETE'){if(!expenseId)return send(res,400,{error:'Geçerli gider kimliği gerekiyor.'});await rest(token,`pire_expenses?id=eq.${expenseId}`,{method:'DELETE'});return send(res,200,{ok:true,expenseId,deleted:true})}
    const title=short(body.title,200),expenseDate=date(body.expenseDate),value=amount(body.amount);if(!title||!expenseDate||value===null)return send(res,400,{error:'Gider adı, tarih ve geçerli tutar gerekiyor.'});
    const payload={title,category:nullable(body.category,100),amount:value,expense_date:expenseDate,updated_at:new Date().toISOString()};
    if(method==='POST'){const created=await write(token,'pire_expenses','POST',[payload]),expense=Array.isArray(created)?created[0]:created;return send(res,201,{ok:true,expense:row(expense)})}
    if(!expenseId)return send(res,400,{error:'Geçerli gider kimliği gerekiyor.'});const updated=await write(token,`pire_expenses?id=eq.${expenseId}`,'PATCH',payload),expense=Array.isArray(updated)?updated[0]:updated;return send(res,200,{ok:true,expense:row(expense)})
  }catch(error){if(error?.detail)console.error('Canonical expenses failed',String(error.detail).slice(0,500));return send(res,error?.status||500,{error:error?.message||'Gider işlemi tamamlanamadı.'})}
};
