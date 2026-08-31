(()=>{
  'use strict';

  const DB_KEY='pire-recovered-backend-v1';
  const MIGRATION_KEY='pire-fix123-canonical-migration-v1';
  const MAX_ATTEMPTS=30;
  let running=false;
  let attempts=0;

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

  function database(){
    try{
      const value=JSON.parse(localStorage.getItem(DB_KEY)||'null');
      return value&&typeof value==='object'?value:null;
    }catch(_){return null}
  }

  function alreadyDone(){
    try{
      const value=JSON.parse(localStorage.getItem(MIGRATION_KEY)||'null');
      return Boolean(value?.ok&&value?.version===1);
    }catch(_){return false}
  }

  function remember(result){
    try{
      localStorage.setItem(MIGRATION_KEY,JSON.stringify({
        ok:true,
        version:1,
        migratedAt:new Date().toISOString(),
        counts:result?.counts||{}
      }));
    }catch(_){}
  }

  async function migrate(){
    if(running||alreadyDone())return alreadyDone();
    const access=token(),snapshot=database();
    if(!access||!snapshot)return false;
    if(!Array.isArray(snapshot?.students?.students)||!Array.isArray(snapshot?.catalog?.teachers))return false;

    running=true;
    try{
      const response=await fetch('/api/canonical-sync',{
        method:'POST',
        headers:{
          Authorization:`Bearer ${access}`,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({snapshot})
      });
      const payload=await response.json().catch(()=>({}));
      if(response.ok&&payload?.ok){
        remember(payload);
        window.__PIRE_FIX123_CANONICAL_MIGRATION__={ok:true,counts:payload.counts||{},at:new Date().toISOString()};
        window.dispatchEvent(new CustomEvent('pire:canonical-migration-complete',{detail:payload}));
        return true;
      }
      window.__PIRE_FIX123_CANONICAL_MIGRATION__={ok:false,status:response.status,error:payload?.error||'migration_failed',at:new Date().toISOString()};
      // 401/403 kullanıcı yetkili yönetici değilse tekrar tekrar deneme.
      if(response.status===401||response.status===403)return true;
      return false;
    }catch(error){
      window.__PIRE_FIX123_CANONICAL_MIGRATION__={ok:false,status:0,error:String(error?.message||error),at:new Date().toISOString()};
      return false;
    }finally{
      running=false;
    }
  }

  async function tick(){
    attempts+=1;
    const done=await migrate();
    if(done||attempts>=MAX_ATTEMPTS)clearInterval(timer);
  }

  window.PIRE_FIX123_CANONICAL_MIGRATION={
    run:migrate,
    status(){
      try{return JSON.parse(localStorage.getItem(MIGRATION_KEY)||'null')}catch(_){return null}
    },
    reset(){try{localStorage.removeItem(MIGRATION_KEY)}catch(_){}}
  };

  const timer=setInterval(tick,1000);
  tick();
})();
