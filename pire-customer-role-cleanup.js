(()=>{
  "use strict";

  function normalize(value){return String(value||"").trim().toLocaleLowerCase("tr-TR")}
  function isCustomer(value){return ["müşteri","customer"].includes(normalize(value))}

  function removeAccountRole(){
    document.querySelectorAll("form select").forEach(select=>{
      const options=[...select.options];
      const accountRole=options.some(option=>["eğitmen","instructor"].includes(normalize(option.textContent)))
        &&options.some(option=>["öğrenci","student"].includes(normalize(option.textContent)));
      if(!accountRole)return;
      select.dataset.safeCustomerRole="1";
      const customerOptions=options.filter(option=>isCustomer(option.textContent)||isCustomer(option.value));
      if(!customerOptions.length)return;
      if(customerOptions.some(option=>option.selected)){
        const valid=options.find(option=>!customerOptions.includes(option));
        if(valid)select.value=valid.value;
      }
      customerOptions.forEach(option=>option.remove());
    });
  }

  function removeVisitorRole(){
    document.querySelectorAll(".visitor-role-grid button").forEach(button=>{
      const label=button.querySelector("b")?.textContent||button.textContent;
      if(isCustomer(label))button.remove();
    });
  }

  let queued=false;
  function cleanup(){queued=false;removeAccountRole();removeVisitorRole()}
  function queue(){if(queued)return;queued=true;queueMicrotask(cleanup)}

  function boot(){
    cleanup();
    new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
  }
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot,{once:true}):boot();
})();
