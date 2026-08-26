(()=>{
  "use strict";

  const ADMIN_KEY="pire-local-admin-accounts-v2";
  const CACHE_KEY="pire-user-accounts-cache-v1";
  const allowed=new Set(["Erkek","Kadın","Belirtilmedi"]);
  let pending=null,queued=false;

  function accountForm(form){
    if(!(form instanceof HTMLFormElement))return false;
    const role=form.querySelector('select[name="role"]');
    return Boolean(role&&form.querySelector('input[name="full_name"]')&&form.querySelector('input[name="password"]'));
  }

  function addField(form){
    if(!accountForm(form)||form.querySelector('[data-pire-honorific]'))return;
    const label=document.createElement("label");
    label.setAttribute("data-pire-honorific","1");
    label.innerHTML='<span>Hitap</span><select name="gender" required><option value="Belirtilmedi">Belirtilmedi</option><option value="Erkek">Bey</option><option value="Kadın">Hanım</option></select><small>Asistan kullanıcıya bu seçime göre hitap eder.</small>';
    const name=form.querySelector('input[name="full_name"]')?.closest("label");
    if(name?.parentNode)name.parentNode.insertBefore(label,name);
  }

  function read(key){try{const value=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(value)?value:[]}catch(_){return []}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
  function setGender(key,institutionId,gender){
    const records=read(key),record=records.find(item=>String(item?.institution_id||"")===institutionId);
    if(!record)return false;record.gender=gender;write(key,records);return true;
  }
  function token(){
    try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||"";if(!/^sb-.*-auth-token$/.test(key))continue;const value=JSON.parse(localStorage.getItem(key)||"null");const access=value?.access_token||value?.currentSession?.access_token;if(access)return access}}catch(_){}return "";
  }
  function persist(institutionId,gender){
    const local=setGender(ADMIN_KEY,institutionId,gender)|setGender(CACHE_KEY,institutionId,gender);
    const access=token();
    if(!local&&access)fetch("/api/account-gender",{method:"POST",headers:{Authorization:`Bearer ${access}`,"Content-Type":"application/json"},body:JSON.stringify({institutionId,gender})}).catch(()=>{});
  }
  function seedApprovedHonorifics(){
    const records=read(ADMIN_KEY),approved=new Map([["YON-0002",/^burak(?:\s|$)/i],["YON-0003",/^mustafa(?:\s|$)/i]]);
    let changed=false;
    records.forEach(item=>{const namePattern=approved.get(item?.institution_id);if(namePattern?.test(String(item?.full_name||""))&&!allowed.has(item.gender)){item.gender="Erkek";changed=true}});
    if(changed)write(ADMIN_KEY,records);
  }
  function scan(){
    queued=false;document.querySelectorAll("form").forEach(addField);
    if(!pending)return;
    const message=[...document.querySelectorAll("body *")].find(el=>/Hesap oluşturuldu\. Kurum ID:\s*(?:YON|EGT|OGR|VEL)-\d+/i.test(el.textContent||"")&&el.children.length===0)?.textContent||"";
    const institutionId=message.match(/\b(?:YON|EGT|OGR|VEL)-\d+\b/i)?.[0];
    if(institutionId){persist(institutionId,pending.gender);pending=null}
  }
  function queue(){if(queued)return;queued=true;queueMicrotask(scan)}
  document.addEventListener("submit",event=>{
    const form=event.target;if(!accountForm(form))return;
    const data=new FormData(form),gender=String(data.get("gender")||"");
    if(allowed.has(gender))pending={gender};
  },true);
  function boot(){seedApprovedHonorifics();scan();new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true})}
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot,{once:true}):boot();
})();
