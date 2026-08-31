(()=>{
  'use strict';

  const MIGRATION_KEY='pire-fix123-canonical-migration-v1';
  let running=false;

  function token(){
    try{
      for(let i=0;i<localStorage.length;i+=1){
        const key=localStorage.key(i)||'';
        if(!/^sb-.*-auth-token$/.test(key))continue;
        const value=JSON.parse(localStorage.getItem(key)||'null');
        const access=value?.access_token||value?.currentSession?.access_token;
        if(access)return access;
      }
    }catch(_){}
    return '';
  }

  function remember(result,source){
    try{
      localStorage.setItem(MIGRATION_KEY,JSON.stringify({
        ok:true,
        version:2,
        source:source||'explicit',
        migratedAt:new Date().toISOString(),
        counts:result?.counts||{}
      }));
    }catch(_){}
  }

  function normalizeBackup(input){
    if(!input||typeof input!=='object')return null;
    const snapshot=input?.data&&typeof input.data==='object'?input.data:input;
    if(!Array.isArray(snapshot?.students?.students))return null;
    if(!Array.isArray(snapshot?.catalog?.teachers))return null;
    if(!Array.isArray(snapshot?.catalog?.courses))return null;
    return snapshot;
  }

  async function runSnapshot(input,source='explicit'){
    if(running)throw new Error('Aktarım zaten çalışıyor.');
    const access=token();
    if(!access)throw new Error('Önce Fix123 preview üzerinde Yönetici hesabıyla giriş yapın.');
    const snapshot=normalizeBackup(input);
    if(!snapshot)throw new Error('Geçerli Pİ-RE yedek verisi bulunamadı.');

    running=true;
    try{
      const response=await fetch('/api/canonical-sync',{
        method:'POST',
        headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},
        body:JSON.stringify({snapshot})
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||!payload?.ok)throw new Error(payload?.error||`Aktarım başarısız (${response.status}).`);
      remember(payload,source);
      window.__PIRE_FIX123_CANONICAL_MIGRATION__={ok:true,counts:payload.counts||{},at:new Date().toISOString(),source};
      window.dispatchEvent(new CustomEvent('pire:canonical-migration-complete',{detail:payload}));
      return payload;
    }finally{
      running=false;
    }
  }

  window.PIRE_FIX123_CANONICAL_MIGRATION={
    runSnapshot,
    normalizeBackup,
    tokenAvailable:()=>Boolean(token()),
    status(){try{return JSON.parse(localStorage.getItem(MIGRATION_KEY)||'null')}catch(_){return null}},
    reset(){try{localStorage.removeItem(MIGRATION_KEY)}catch(_){}}
  };

  // Güvenlik: Preview farklı bir origin olduğu için production localStorage verisini göremez.
  // Bu nedenle otomatik localStorage -> Supabase aktarımı YAPILMAZ.
  // Aktarım yalnızca kullanıcının production'dan aldığı Pİ-RE yedek dosyasını açıkça seçmesiyle başlar.
})();
