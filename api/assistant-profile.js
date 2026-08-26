function send(res,status,body){res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify(body))}
function env(name){return String(process.env[name]||"").trim()}
function bearer(req){const value=String(req.headers?.authorization||"");return /^Bearer\s+\S+$/i.test(value)?value.replace(/^Bearer\s+/i,"").trim():""}
function originAllowed(req){
  const origin=String(req.headers?.origin||""),allowed=env("ALLOWED_ORIGIN")||env("ALLOWED_ORIGINS").split(",")[0]?.trim();
  if(!origin)return true;if(allowed)return origin===allowed;
  try{return new URL(origin).host===String(req.headers?.host||"")}catch(_){return false}
}

async function verifiedGender(token){
  const url=env("SUPABASE_URL").replace(/\/$/,""),key=env("SUPABASE_PUBLISHABLE_KEY")||env("SUPABASE_ANON_KEY");
  if(!url||!key)throw Object.assign(new Error("Profil servisi yapılandırılmadı."),{status:503});
  const headers={apikey:key,Authorization:`Bearer ${token}`,Accept:"application/json"};
  const userResponse=await fetch(`${url}/auth/v1/user`,{headers});
  if(!userResponse.ok)throw Object.assign(new Error("Geçerli oturum gerekli."),{status:401});
  const user=await userResponse.json();
  const profileResponse=await fetch(`${url}/rest/v1/pire_profiles?id=eq.${encodeURIComponent(user.id)}&select=gender,status&limit=1`,{headers});
  if(!profileResponse.ok)throw Object.assign(new Error("Profil okunamadı."),{status:403});
  const [profile]=await profileResponse.json();
  if(profile?.status!=="Aktif")throw Object.assign(new Error("Aktif profil gerekli."),{status:403});
  return ["Erkek","Kadın"].includes(profile?.gender)?profile.gender:"Belirtilmedi";
}

async function handler(req,res){
  if(req.method!=="GET")return send(res,405,{error:"Method not allowed"});
  if(!originAllowed(req))return send(res,403,{error:"Origin not allowed"});
  const token=bearer(req);if(!token)return send(res,401,{error:"Geçerli oturum gerekli."});
  try{return send(res,200,{gender:await verifiedGender(token)})}
  catch(error){return send(res,error?.status||500,{error:error?.message||"Profil okunamadı."})}
}

handler._test={verifiedGender,originAllowed};
module.exports=handler;
