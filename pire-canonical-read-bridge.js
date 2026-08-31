(()=>{
  'use strict';
  if(window.__PIRE_CANONICAL_READ_BRIDGE__)return;

  const previousFetch=window.fetch.bind(window);
  const READ_ROUTES=new Set(['/api/students','/api/catalog','/api/lessons','/api/packages','/api/finance','/api/expenses','/api/attendance','/api/makeups','/api/settings','/api/announcements','/api/security-audit','/api/earnings']);
  const WRITE_ROUTES=new Set(['/api/students','/api/catalog','/api/lessons','/api/packages','/api/finance','/api/expenses','/api/attendance','/api/makeups','/api/settings','/api/announcements','/api/earnings']);

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
        const xhr=new XMLHttpRequest();xhr.open(method,url,true);xhr.setRequestHeader('Authorization','Bearer '+access);xhr.setRequestHeader('Accept','application/json');
        if(body!=null)xhr.setRequestHeader('Content-Type','application/json');
        try{const h=new Headers(headersInput||{});h.forEach((v,k)=>{if(!['authorization','accept','content-type'].includes(k.toLowerCase()))xhr.setRequestHeader(k,v)})}catch(_){}
        xhr.onload=()=>{const headers=new Headers();const raw=xhr.getAllResponseHeaders()||'';raw.trim().split(/[\r\n]+/).forEach(line=>{const index=line.indexOf(':');if(index>0)headers.append(line.slice(0,index).trim(),line.slice(index+1).trim())});resolve(new Response(xhr.responseText,{status:xhr.status,statusText:xhr.statusText,headers}))};
        xhr.onerror=()=>reject(new Error('canonical_xhr_failed'));xhr.ontimeout=()=>reject(new Error('canonical_xhr_timeout'));xhr.timeout=12000;xhr.send(body);
      }catch(error){reject(error)}
    });
  }

  window.fetch=async function(input,init={}){
    const method=String(init?.method||input?.method||'GET').toUpperCase();let url;
    try{url=new URL(typeof input==='string'?input:input?.url||String(input),location.origin)}catch(_){return previousFetch(input,init)}
    if(url.origin!==location.origin)return previousFetch(input,init);
    const isRead=method==='GET'&&READ_ROUTES.has(url.pathname),isWrite=method!=='GET'&&WRITE_ROUTES.has(url.pathname);
    if(!isRead&&!isWrite)return previousFetch(input,init);
    const access=token();if(!access)return previousFetch(input,init);
    let body=init?.body??(typeof input!=='string'?input?.body:null);if(body!=null&&typeof body!=='string'){try{body=JSON.stringify(body)}catch(_){}}
    try{
      const response=await requestWithXhr(url.pathname+url.search,access,method,body,init?.headers||(typeof input!=='string'?input?.headers:null));
      window.__PIRE_CANONICAL_READ_STATUS__={ok:response.ok,status:response.status,path:url.pathname,method,at:new Date().toISOString()};
      if(isWrite)return response;
      if(response.ok||response.status===401||response.status===403)return response;
      return previousFetch(input,init);
    }catch(error){
      window.__PIRE_CANONICAL_READ_STATUS__={ok:false,status:0,path:url.pathname,method,error:String(error?.message||error),at:new Date().toISOString()};
      if(isWrite)return new Response(JSON.stringify({error:'Canonical veri işlemi sunucuya ulaştırılamadı.'}),{status:503,headers:{'content-type':'application/json'}});
      return previousFetch(input,init);
    }
  };

  window.__PIRE_CANONICAL_READ_BRIDGE__={enabled:true,readRoutes:[...READ_ROUTES],writeRoutes:[...WRITE_ROUTES],mode:'read-fail-open-write-fail-closed'};
})();
