(()=>{
  const SESSION_KEY='pire-login-whatsapp-notified';
  const LAST_SESSION_KEY='pire-last-auth-session';
  let observedLoggedOut=false;
  function accessToken(){
    try{
      for(let index=0;index<localStorage.length;index+=1){
        const key=localStorage.key(index)||'';
        if(!/^sb-.*-auth-token$/.test(key))continue;
        const value=JSON.parse(localStorage.getItem(key)||'null');
        const token=value?.access_token||value?.currentSession?.access_token;
        if(token)return token;
      }
    }catch(_){}
    return '';
  }
  function decodePayload(token){
    try{
      const value=(token.split('.')[1]||'').replace(/-/g,'+').replace(/_/g,'/');
      return JSON.parse(atob(value.padEnd(Math.ceil(value.length/4)*4,'=')));
    }catch(_){return {}}
  }
  function tokenMarker(token){
    const payload=decodePayload(token);
    const fallback=payload.sub&&payload.iat?`${payload.sub}:${payload.iat}`:token.slice(-32);
    const part=String(payload.session_id||fallback);
    let hash=2166136261;
    for(let index=0;index<part.length;index+=1){hash^=part.charCodeAt(index);hash=Math.imul(hash,16777619)}
    return String(hash>>>0);
  }
  async function notify(){
    const token=accessToken();if(!token){observedLoggedOut=true;return false}
    const marker=tokenMarker(token);
    try{if(sessionStorage.getItem(SESSION_KEY)===marker)return true}catch(_){}
    try{
      const previous=localStorage.getItem(LAST_SESSION_KEY);
      if(previous===marker){sessionStorage.setItem(SESSION_KEY,marker);return true}
      if(!previous&&!observedLoggedOut){localStorage.setItem(LAST_SESSION_KEY,marker);sessionStorage.setItem(SESSION_KEY,marker);return true}
    }catch(_){}
    const response=await fetch('/api/login-notification',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}'});
    const remember=()=>{try{localStorage.setItem(LAST_SESSION_KEY,marker);sessionStorage.setItem(SESSION_KEY,marker)}catch(_){}};
    if(response.ok){remember();return true}
    const payload=await response.json().catch(()=>({}));
    if(response.status===401||response.status===403||response.status===422){remember();return true}
    if(payload?.code==='whatsapp_not_configured'){remember();return true}
    if(payload?.code==='whatsapp_failed'){remember();return true}
    return false;
  }
  let attempts=0;
  const timer=setInterval(async()=>{
    attempts+=1;
    if(await notify()||attempts>=20)clearInterval(timer);
  },500);
  notify().then(done=>{if(done)clearInterval(timer)});

  // Fix123 preview branch: mevcut tarayıcı localStorage verisini canonical Supabase
  // tablolarına bir kez taşıyan ayrı istemciyi yükler. main/Fix122 bu değişikliği içermez.
  if(!document.querySelector('script[data-pire-canonical-migration]')){
    const script=document.createElement('script');
    script.src='/pire-canonical-migration.js?v=1';
    script.defer=true;
    script.dataset.pireCanonicalMigration='true';
    (document.head||document.documentElement).appendChild(script);
  }
})();
