function send(res,status,body){res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify(body))}
function env(name){return String(process.env[name]||"").trim()}
function bearer(req){const value=String(req.headers?.authorization||"");return /^Bearer\s+\S+$/i.test(value)?value.replace(/^Bearer\s+/i,"").trim():""}
function originAllowed(req){
  const origin=String(req.headers?.origin||""),allowed=env("ALLOWED_ORIGIN")||env("ALLOWED_ORIGINS").split(",")[0]?.trim();
  if(!origin)return true;if(allowed)return origin===allowed;
  try{return new URL(origin).host===String(req.headers?.host||"")}catch(_){return false}
}
async function body(req){if(req.body&&typeof req.body==="object")return req.body;let raw="";for await(const chunk of req)raw+=chunk;if(raw.length>4096)throw Object.assign(new Error("İstek çok büyük."),{status:413});try{return JSON.parse(raw||"{}")}catch(_){throw Object.assign(new Error("Geçersiz istek."),{status:400})}}
function isAdminProfile(actor){const roles=Array.isArray(actor?.roles)?actor.roles:[];return actor?.status==="Aktif"&&(actor?.role==="Yönetici"||roles.includes("Yönetici"))}

async function updateGender(token,institutionId,gender){
  const url=env("SUPABASE_URL").replace(/\/$/,""),anon=env("SUPABASE_PUBLISHABLE_KEY")||env("SUPABASE_ANON_KEY"),service=env("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!anon||!service)throw Object.assign(new Error("Hesap servisi yapılandırılmadı."),{status:503});
  const authHeaders={apikey:anon,Authorization:`Bearer ${token}`,Accept:"application/json"};
  const userResponse=await fetch(`${url}/auth/v1/user`,{headers:authHeaders});
  if(!userResponse.ok)throw Object.assign(new Error("Geçerli oturum gerekli."),{status:401});
  const user=await userResponse.json();
  const actorResponse=await fetch(`${url}/rest/v1/pire_profiles?id=eq.${encodeURIComponent(user.id)}&select=role,roles,status&limit=1`,{headers:authHeaders});
  const [actor]=actorResponse.ok?await actorResponse.json():[];
  if(!isAdminProfile(actor))throw Object.assign(new Error("Yalnızca aktif yönetici işlem yapabilir."),{status:403});
  const response=await fetch(`${url}/rest/v1/pire_profiles?institution_id=eq.${encodeURIComponent(institutionId)}`,{method:"PATCH",headers:{apikey:service,Authorization:`Bearer ${service}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({gender})});
  if(!response.ok)throw Object.assign(new Error("Hitap kaydedilemedi."),{status:502});
  const updated=await response.json();if(!Array.isArray(updated)||updated.length!==1)throw Object.assign(new Error("Kullanıcı profili bulunamadı."),{status:404});
  return {ok:true};
}

async function handler(req,res){
  if(req.method!=="POST")return send(res,405,{error:"Method not allowed"});
  if(!originAllowed(req))return send(res,403,{error:"Origin not allowed"});
  const token=bearer(req);if(!token)return send(res,401,{error:"Geçerli oturum gerekli."});
  try{
    const input=await body(req),institutionId=String(input.institutionId||"").trim().toLocaleUpperCase("tr-TR"),gender=String(input.gender||"");
    if(!/^(?:YON|EGT|OGR|VEL)-\d{4,}$/.test(institutionId)||!["Erkek","Kadın","Belirtilmedi"].includes(gender))return send(res,400,{error:"Geçersiz hitap bilgisi."});
    return send(res,200,await updateGender(token,institutionId,gender));
  }catch(error){return send(res,error?.status||500,{error:error?.message||"Hitap kaydedilemedi."})}
}
handler._test={updateGender,originAllowed,isAdminProfile};module.exports=handler;
