(()=>{
  'use strict';
  if(window.__PIRE_CANONICAL_LEGACY_READ_COMPAT__)return;

  const OPERATIONAL_KEY='pire-recovered-backend-v1';
  const nativeGetItem=Storage.prototype.getItem;
  const FOCUS_STALE_MS=120000;
  const WRITE_DEBOUNCE_MS=350;
  let mirror=null;
  let refreshing=false;
  let lastError='';
  let lastRefreshAt=0;
  let writeRefreshTimer=null;

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

  function exportData(){
    return mirror?JSON.parse(JSON.stringify(mirror)):{};
  }

  async function refresh(reason='manual'){
    if(refreshing||!canonicalActive())return false;
    refreshing=true;
    try{
      const entries=await Promise.all(Object.entries(ROUTES).map(async([key,route])=>[key,await readJson(route)]));
      mirror=Object.fromEntries(entries);
      lastError='';
      lastRefreshAt=Date.now();
      const detail={reason,at:new Date(lastRefreshAt).toISOString(),keys:Object.keys(mirror)};
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

  // Legacy UI yardımcıları kalıcı cihaz DB'si yerine yalnızca canonical bellek aynasını okur.
  window.__PIRE_RECOVERED_BACKEND__={
    sourceOfTruth:'supabase-canonical',
    readOnly:true,
    exportData,
    refresh:()=>refresh('legacy-export-refresh')
  };

  // Kör 30 sn polling kaldırıldı. Yalnızca ihtiyaç olduğunda yenilenir.
  window.addEventListener('focus',()=>{
    if(Date.now()-lastRefreshAt>=FOCUS_STALE_MS)refresh('focus-stale');
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&Date.now()-lastRefreshAt>=FOCUS_STALE_MS)refresh('visible-stale');
  });
  window.addEventListener('pire:canonical-response',event=>{
    const detail=event?.detail||{};
    if(!(detail.ok&&detail.method&&detail.method!=='GET'))return;
    clearTimeout(writeRefreshTimer);
    writeRefreshTimer=setTimeout(()=>refresh('canonical-write'),WRITE_DEBOUNCE_MS);
  });

  window.__PIRE_CANONICAL_LEGACY_READ_COMPAT__={
    enabled:true,
    operationalKey:OPERATIONAL_KEY,
    sourceOfTruth:'supabase-canonical',
    mode:'canonical-memory-mirror-event-driven',
    exportData,
    get ready(){return Boolean(mirror)},
    get refreshing(){return refreshing},
    get lastError(){return lastError},
    get lastRefreshAt(){return lastRefreshAt},
    refresh
  };

  refresh('startup');
  window.addEventListener('beforeunload',()=>clearTimeout(writeRefreshTimer),{once:true});
})();
