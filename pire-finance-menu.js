/* Pİ-RE finans menüsü gelir / gider görsel ayrımı */
(()=>{
  const labels={
    'Finans':{kind:'income'},'Finance':{kind:'income'},
    'Ödemeler':{kind:'income',label:'+ Cari Alacak / Tahsilatlar'},
    'Payments':{kind:'income',label:'+ Receivables / Collections'},
    'Cari Alacak / Tahsilatlar':{kind:'income',label:'+ Cari Alacak / Tahsilatlar'},
    '+ Cari Alacak / Tahsilatlar':{kind:'income',label:'+ Cari Alacak / Tahsilatlar'},
    'Receivables / Collections':{kind:'income',label:'+ Receivables / Collections'},
    '+ Receivables / Collections':{kind:'income',label:'+ Receivables / Collections'},
    'Giderler':{kind:'expense'},'Expenses':{kind:'expense'},
    'Hakedişler':{kind:'expense',label:'Hakedişler / Maaşlar'},
    'Earnings':{kind:'expense',label:'Earnings / Salaries'},
    'Hakedişler / Maaşlar':{kind:'expense',label:'Hakedişler / Maaşlar'},
    'Earnings / Salaries':{kind:'expense',label:'Earnings / Salaries'}
  };
  function scan(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];let node;
    while((node=walker.nextNode()))if(labels[node.textContent.trim()])nodes.push(node);
    nodes.forEach(textNode=>{
      const text=textNode.textContent.trim(),rule=labels[text];
      const target=textNode.parentElement?.closest('button,a,[role="button"],li')||textNode.parentElement;
      if(!target)return;
      target.classList.toggle('pire-finance-income',rule.kind==='income');
      target.classList.toggle('pire-finance-expense',rule.kind==='expense');
      textNode.parentElement?.classList.toggle('pire-finance-income',rule.kind==='income');
      textNode.parentElement?.classList.toggle('pire-finance-expense',rule.kind==='expense');
      if(rule.label&&text!==rule.label)textNode.textContent=textNode.textContent.replace(text,rule.label);
    });
  }
  let queued=false;
  function queueScan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
  if(document.body)scan();else document.addEventListener('DOMContentLoaded',scan,{once:true});
  new MutationObserver(queueScan).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();

;(()=>{
  if(!document.querySelector('link[data-pire-expense-periods]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='/pire-expense-periods.css?v=2';link.dataset.pireExpensePeriods='true';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-pire-expense-periods]')){
    const script=document.createElement('script');script.src='/pire-expense-periods.js?v=2';script.defer=true;script.dataset.pireExpensePeriods='true';document.head.appendChild(script);
  }
})();


;(()=>{
  if(!document.querySelector('link[data-pire-payment-tabs]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='/pire-payment-tabs.css?v=2';link.dataset.pirePaymentTabs='true';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-pire-payment-tabs]')){
    const script=document.createElement('script');script.src='/pire-payment-tabs.js?v=2';script.defer=true;script.dataset.pirePaymentTabs='true';document.head.appendChild(script);
  }
})();
