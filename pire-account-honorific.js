(()=>{
  "use strict";

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

  function token(){
    try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||"";if(!/^sb-.*-auth-token$/.test(key))continue;const value=JSON.parse(localStorage.getItem(key)||"null");const access=value?.access_token||value?.currentSession?.access_token;if(access)return access}}catch(_){}return "";
  }

  async function persist(institutionId,gender){
    const access=token();
    if(!access)throw new Error("Geçerli oturum bulunamadı.");
    const response=await fetch("/api/account-gender",{method:"POST",headers:{Authorization:`Bearer ${access}`,"Content-Type":"application/json"},body:JSON.stringify({institutionId,gender})});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||"Hitap kaydedilemedi.");
    return true;
  }

  function scan(){
    queued=false;document.querySelectorAll("form").forEach(addField);
    if(!pending)return;
    const message=[...document.querySelectorAll("body *")].find(el=>/Hesap oluşturuldu\. Kurum ID:\s*(?:YON|EGT|OGR|VEL)-\d+/i.test(el.textContent||"")&&el.children.length===0)?.textContent||"";
    const institutionId=message.match(/\b(?:YON|EGT|OGR|VEL)-\d+\b/i)?.[0];
    if(institutionId){
      const current=pending;pending=null;
      persist(institutionId,current.gender).catch(error=>console.error("Hitap bilgisi canonical profile'a kaydedilemedi",error));
    }
  }
  function queue(){if(queued)return;queued=true;queueMicrotask(scan)}
  document.addEventListener("submit",event=>{
    const form=event.target;if(!accountForm(form))return;
    const data=new FormData(form),gender=String(data.get("gender")||"");
    if(allowed.has(gender))pending={gender};
  },true);
  function boot(){scan();new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true})}
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot,{once:true}):boot();
})();
