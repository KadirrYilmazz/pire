(()=>{
  'use strict';
  if(window.__PIRE_CANONICAL_READ_BRIDGE__)return;

  const previousFetch=window.fetch.bind(window);
  const READ_ROUTES=new Set(['/api/students','/api/catalog','/api/lessons','/api/packages','/api/finance','/api/expenses','/api/attendance','/api/makeups','/api/settings','/api/announcements','/api/security-audit','/api/earnings','/api/notifications']);
  const WRITE_ROUTES=new Set(['/api/students','/api/catalog','/api/lessons','/api/packages','/api/finance','/api/expenses','/api/attendance','/api/makeups','/api/settings','/api/announcements','/api/earnings','/api/notifications']);

  function jsonResponse(status,error){
    return new Response(JSON.stringify({error}),{status,headers:{'content-type':'application/json'}});
  }

  function publish(detail){
    window.__PIRE_CANONICAL_READ_STATUS__={...detail,at:new Date().toISOString()};
    try{window.dispatchEvent(new CustomEvent('pire:canonical-response',{detail:window.__PIRE_CANONICAL_READ_STATUS__}))}catch(_){}
  }

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

  function requestWithXhr(url,access,method='GET',body=null,headersInput){
    return new Promise((resolve,reject)=>{
      try{
        const xhr=new XMLHttpRequest();
        xhr.open(method,url,true);
        xhr.setRequestHeader('Authorization','Bearer '+access);
        xhr.setRequestHeader('Accept','application/json');
        if(body!=null)xhr.setRequestHeader('Content-Type','application/json');
        try{
          const h=new Headers(headersInput||{});
          h.forEach((v,k)=>{if(!['authorization','accept','content-type'].includes(k.toLowerCase()))xhr.setRequestHeader(k,v)});
        }catch(_){}
        xhr.onload=()=>{
          const headers=new Headers();
          const raw=xhr.getAllResponseHeaders()||'';
          raw.trim().split(/[\r\n]+/).forEach(line=>{const index=line.indexOf(':');if(index>0)headers.append(line.slice(0,index).trim(),line.slice(index+1).trim())});
          resolve(new Response(xhr.responseText,{status:xhr.status,statusText:xhr.statusText,headers}));
        };
        xhr.onerror=()=>reject(new Error('canonical_xhr_failed'));
        xhr.ontimeout=()=>reject(new Error('canonical_xhr_timeout'));
        xhr.timeout=12000;
        xhr.send(body);
      }catch(error){reject(error)}
    });
  }

  window.fetch=async function(input,init={}){
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    let url;
    try{url=new URL(typeof input==='string'?input:input?.url||String(input),location.origin)}catch(_){return previousFetch(input,init)}
    if(url.origin!==location.origin)return previousFetch(input,init);

    const isRead=method==='GET'&&READ_ROUTES.has(url.pathname);
    const isWrite=method!=='GET'&&WRITE_ROUTES.has(url.pathname);
    if(!isRead&&!isWrite)return previousFetch(input,init);

    const access=token();
    if(!access){
      publish({ok:false,status:401,path:url.pathname,method,error:'missing_session'});
      return jsonResponse(401,'Oturum doğrulanmadan merkezi verilere erişilemez.');
    }

    let body=init?.body??(typeof input!=='string'?input?.body:null);
    if(body!=null&&typeof body!=='string'){try{body=JSON.stringify(body)}catch(_){}}
    try{
      const response=await requestWithXhr(url.pathname+url.search,access,method,body,init?.headers||(typeof input!=='string'?input?.headers:null));
      publish({ok:response.ok,status:response.status,path:url.pathname,method});
      return response;
    }catch(error){
      publish({ok:false,status:0,path:url.pathname,method,error:String(error?.message||error)});
      return jsonResponse(503,'Merkezi veri servisine ulaşılamadı. Yerel veri kaynağına geri dönülmedi.');
    }
  };

  window.__PIRE_CANONICAL_READ_BRIDGE__={
    enabled:true,
    readRoutes:[...READ_ROUTES],
    writeRoutes:[...WRITE_ROUTES],
    mode:'canonical-fail-closed',
    localOperationalFallback:false
  };
})();
