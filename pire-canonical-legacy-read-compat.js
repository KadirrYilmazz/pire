(()=>{
  'use strict';
  if(window.__PIRE_CANONICAL_LEGACY_READ_COMPAT__)return;

  const OPERATIONAL_KEY='pire-recovered-backend-v1';
  const nativeGetItem=Storage.prototype.getItem;
  let mirror=null;
  let refreshing=false;
  let lastError='';

  const ROUTES={
    students:'/api/students',
    catalog:'/api/catalog',
    lessons:'/api/lessons',
    packages:'/api/packages',
    finance:'/api/finance',
    expenses:'/api/expenses',
    attendance:'/api/attendance',
    makeups:'/api/makeups',
    settings:'/api/settings',
    announcements:'/api/announcements',
    'security-audit':'/api/security-audit',
    earnings:'/api/earnings',
    notifications:'/api/notifications'
  };

  function canonicalActive(){
    return Boolean(window.__PIRE_CANONICAL_READ_BRIDGE__?.enabled && window.__PIRE_CANONICAL_READ_BRIDGE__?.localOperationalFallback===false);
  }

  async function readJson(route){
    const response=await fetch(route,{headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error(`${route}:${response.status}`);
    return response.json();
  }

  async function refresh(reason='manual'){
    if(refreshing||!canonicalActive())return false;
    refreshing=true;
    try{
      const entries=await Promise.all(Object.entries(ROUTES).map(async([key,route])=>[key,await readJson(route)]));
      mirror=Object.fromEntries(entries);
      lastError='';
      const detail={reason,at:new Date().toISOString(),keys:Object.keys(mirror)};
      window.__PIRE_CANONICAL_LEGACY_READ_STATUS__={ok:true,...detail};
      try{window.dispatchEvent(new CustomEvent('pire:canonical-legacy-mirror-ready',{detail}))}catch(_){}
      return true;
    }catch(error){
      lastError=String(error?.message||error);
      window.__PIRE_CANONICAL_LEGACY_READ_STATUS__={ok:false,reason,error:lastError,at:new Date().toISOString()};
      return false;
    }finally{
      refreshing=false;
    }
  }

  Storage.prototype.getItem=function(key){
    if(this===window.localStorage && key===OPERATIONAL_KEY && canonicalActive()){
      return mirror?JSON.stringify(mirror):null;
    }
    return nativeGetItem.call(this,key);
  };

  window.addEventListener('focus',()=>refresh('focus'));
  window.addEventListener('pire:canonical-response',event=>{
    const detail=event?.detail||{};
    if(detail.ok && detail.method && detail.method!=='GET')refresh('canonical-write');
  });
  const timer=setInterval(()=>refresh('interval'),30000);

  window.__PIRE_CANONICAL_LEGACY_READ_COMPAT__={
    enabled:true,
    operationalKey:OPERATIONAL_KEY,
    sourceOfTruth:'supabase-canonical',
    mode:'canonical-memory-mirror',
    get ready(){return Boolean(mirror)},
    get refreshing(){return refreshing},
    get lastError(){return lastError},
    refresh
  };

  refresh('startup');
  window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
})();
