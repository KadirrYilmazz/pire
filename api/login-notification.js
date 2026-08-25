const WINDOW_MS=60_000;
const RATE_LIMIT=6;
const attempts=new Map();

function send(res,status,body){res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify(body))}
function env(name){return String(process.env[name]||"").trim()}
function originAllowed(req){
  const origin=String(req.headers?.origin||"");
  const allowed=env("ALLOWED_ORIGIN");
  if(!origin)return true;
  if(allowed)return origin===allowed;
  try{return new URL(origin).host===String(req.headers?.host||"")}catch(_){return false}
}
function bearer(req){const value=String(req.headers?.authorization||"");return /^Bearer\s+\S+$/i.test(value)?value.replace(/^Bearer\s+/i,"").trim():""}
function limited(key){
  const now=Date.now();
  const recent=(attempts.get(key)||[]).filter(time=>now-time<WINDOW_MS);
  recent.push(now);attempts.set(key,recent);
  return recent.length>RATE_LIMIT;
}
function normalizeTurkishPhone(value){
  let digits=String(value||"").replace(/\D/g,"");
  if(digits.startsWith("00"))digits=digits.slice(2);
  if(digits.startsWith("0"))digits=`90${digits.slice(1)}`;
  if(digits.length===10&&digits.startsWith("5"))digits=`90${digits}`;
  return /^905\d{9}$/.test(digits)?digits:"";
}
function loginTime(){return new Intl.DateTimeFormat("tr-TR",{timeZone:"Europe/Istanbul",dateStyle:"long",timeStyle:"short"}).format(new Date())}
function supabaseHeaders(key,token){return {apikey:key,Authorization:`Bearer ${token}`,"Content-Type":"application/json"}}

async function verifiedAdministrator(token){
  const url=env("SUPABASE_URL").replace(/\/$/,"");
  const key=env("SUPABASE_PUBLISHABLE_KEY")||env("SUPABASE_ANON_KEY");
  if(!url||!key)throw Object.assign(new Error("Supabase yapılandırması eksik."),{status:503});
  const headers=supabaseHeaders(key,token);
  const userResponse=await fetch(`${url}/auth/v1/user`,{headers});
  if(!userResponse.ok)throw Object.assign(new Error("Geçerli oturum gerekli."),{status:401});
  const user=await userResponse.json();
  const profileResponse=await fetch(`${url}/rest/v1/pire_profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role,roles,status,phone,last_login_at&limit=1`,{headers});
  if(!profileResponse.ok)throw Object.assign(new Error("Yönetici profili doğrulanamadı."),{status:403});
  const [profile]=await profileResponse.json();
  const roles=Array.isArray(profile?.roles)?profile.roles:[profile?.role];
  if(profile?.status!=="Aktif"||!roles.includes("Yönetici"))throw Object.assign(new Error("Aktif yönetici hesabı gerekli."),{status:403});
  const phone=normalizeTurkishPhone(profile.phone);
  if(!phone)throw Object.assign(new Error("Yönetici hesabında geçerli telefon bulunmuyor."),{status:422});
  return {url,key,headers,userId:user.id,phone,lastLoginAt:profile.last_login_at};
}

async function markLogin(identity,at){
  const response=await fetch(`${identity.url}/rest/v1/pire_profiles?id=eq.${encodeURIComponent(identity.userId)}`,{
    method:"PATCH",headers:{...identity.headers,Prefer:"return=minimal"},body:JSON.stringify({last_login_at:at})
  });
  if(!response.ok)throw Object.assign(new Error("Giriş zamanı kaydedilemedi."),{status:503});
}

async function sendWhatsApp(phone,time){
  const accessToken=env("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId=env("WHATSAPP_PHONE_NUMBER_ID");
  const templateName=env("WHATSAPP_LOGIN_TEMPLATE_NAME")||"pire_login_alert";
  const graphVersion=env("WHATSAPP_GRAPH_VERSION")||"v23.0";
  if(!accessToken||!phoneNumberId)throw Object.assign(new Error("WhatsApp Cloud API henüz yapılandırılmadı."),{status:503,code:"whatsapp_not_configured"});
  const response=await fetch(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneNumberId)}/messages`,{
    method:"POST",
    headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json"},
    body:JSON.stringify({messaging_product:"whatsapp",to:phone,type:"template",template:{name:templateName,language:{code:"tr"},components:[{type:"body",parameters:[{type:"text",text:time}]}]}})
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error("WhatsApp bildirimi gönderilemedi."),{status:502,code:payload?.error?.code||"whatsapp_failed"});
  return payload?.messages?.[0]?.id||null;
}

async function handler(req,res){
  if(req.method!=="POST")return send(res,405,{error:"Method not allowed"});
  if(!originAllowed(req))return send(res,403,{error:"Origin not allowed"});
  const token=bearer(req);
  if(!token)return send(res,401,{error:"Geçerli oturum gerekli."});
  const key=`${req.socket?.remoteAddress||"unknown"}:${token.slice(-12)}`;
  if(limited(key))return send(res,429,{error:"Çok fazla bildirim isteği."});
  try{
    const identity=await verifiedAdministrator(token);
    const previous=identity.lastLoginAt?Date.parse(identity.lastLoginAt):0;
    if(previous&&Date.now()-previous<WINDOW_MS)return send(res,200,{ok:true,duplicate:true});
    const at=new Date().toISOString();
    const messageId=await sendWhatsApp(identity.phone,loginTime());
    await markLogin(identity,at);
    return send(res,200,{ok:true,messageId:Boolean(messageId)});
  }catch(error){
    return send(res,error?.status||500,{error:error?.message||"Bildirim gönderilemedi.",...(error?.code?{code:String(error.code)}:{})});
  }
}

handler._test={normalizeTurkishPhone,originAllowed,verifiedAdministrator,sendWhatsApp};
module.exports=handler;
