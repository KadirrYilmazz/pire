(()=>{
  'use strict';
  if(window.__PIRE_CANONICAL_LOCALSTORAGE_GUARD__)return;

  const OPERATIONAL_KEY='pire-recovered-backend-v1';
  const nativeSetItem=Storage.prototype.setItem;
  const nativeRemoveItem=Storage.prototype.removeItem;
  const nativeClear=Storage.prototype.clear;

  function canonicalActive(){
    return Boolean(window.__PIRE_CANONICAL_READ_BRIDGE__?.enabled && window.__PIRE_CANONICAL_READ_BRIDGE__?.localOperationalFallback===false);
  }

  function blocked(operation){
    const detail={key:OPERATIONAL_KEY,operation,at:new Date().toISOString(),reason:'canonical_source_of_truth'};
    window.__PIRE_LEGACY_LOCAL_WRITE_BLOCKED__=detail;
    try{window.dispatchEvent(new CustomEvent('pire:legacy-local-write-blocked',{detail}))}catch(_){}
    try{console.warn('[Pİ-RE Fix123] Eski operasyonel localStorage yazması engellendi:',operation)}catch(_){}
  }

  Storage.prototype.setItem=function(key,value){
    if(this===window.localStorage && key===OPERATIONAL_KEY && canonicalActive()){
      blocked('setItem');
      return;
    }
    return nativeSetItem.call(this,key,value);
  };

  Storage.prototype.removeItem=function(key){
    if(this===window.localStorage && key===OPERATIONAL_KEY && canonicalActive()){
      blocked('removeItem');
      return;
    }
    return nativeRemoveItem.call(this,key);
  };

  Storage.prototype.clear=function(){
    if(this===window.localStorage && canonicalActive()){
      const preserved=window.localStorage.getItem(OPERATIONAL_KEY);
      nativeClear.call(this);
      if(preserved!=null)nativeSetItem.call(this,OPERATIONAL_KEY,preserved);
      blocked('clear');
      return;
    }
    return nativeClear.call(this);
  };

  window.__PIRE_CANONICAL_LOCALSTORAGE_GUARD__={
    enabled:true,
    operationalKey:OPERATIONAL_KEY,
    mode:'read-only-legacy-snapshot',
    sourceOfTruth:'supabase-canonical'
  };
})();
