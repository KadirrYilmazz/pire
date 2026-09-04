/* Pİ-RE finans menüsü — React metnine dokunmayan gelir / gider ayrımı */
(()=>{
  const rules={
    'Finans':{kind:'income'},'Finance':{kind:'income'},
    'Ödemeler':{kind:'income',marker:'receivables-tr'},'Cari Alacak / Tahsilatlar':{kind:'income',marker:'receivables-tr'},'+ Cari Alacak / Tahsilatlar':{kind:'income',marker:'receivables-tr'},
    'Payments':{kind:'income',marker:'receivables-en'},'Receivables / Collections':{kind:'income',marker:'receivables-en'},'+ Receivables / Collections':{kind:'income',marker:'receivables-en'},
    'Giderler':{kind:'expense'},'Expenses':{kind:'expense'},'Gider Takibi':{kind:'expense'},'Expense Tracking':{kind:'expense'},
    'Hakedişler':{kind:'expense',marker:'earnings-tr'},'Hakedişler / Maaşlar':{kind:'expense',marker:'earnings-tr'},
    'Earnings':{kind:'expense',marker:'earnings-en'},'Earnings / Salaries':{kind:'expense',marker:'earnings-en'},
    'Eğitmen Hakedişleri':{kind:'expense',marker:'earnings-heading-tr'},'Eğitmen Hakedişleri / Maaşlar':{kind:'expense',marker:'earnings-heading-tr'},
    'Instructor Earnings':{kind:'expense',marker:'earnings-heading-en'},'Instructor Earnings / Salaries':{kind:'expense',marker:'earnings-heading-en'}
  };
  const markers=['pire-label-receivables-tr','pire-label-receivables-en','pire-label-earnings-tr','pire-label-earnings-en','pire-label-earnings-heading-tr','pire-label-earnings-heading-en'];
  function scan(){
    document.querySelectorAll('.pire-finance-income,.pire-finance-expense,'+markers.map(x=>'.'+x).join(',')).forEach(element=>element.classList.remove('pire-finance-income','pire-finance-expense',...markers));
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let textNode;
    while((textNode=walker.nextNode())){
      const rule=rules[textNode.textContent.trim()];if(!rule)continue;
      const label=textNode.parentElement,target=label?.closest('button,a,[role="button"],li')||label;if(!target||!label)continue;
      target.classList.remove('pire-finance-income','pire-finance-expense');
      label.classList.remove('pire-finance-income','pire-finance-expense',...markers);
      target.classList.add(rule.kind==='income'?'pire-finance-income':'pire-finance-expense');
      label.classList.add(rule.kind==='income'?'pire-finance-income':'pire-finance-expense');
      if(rule.marker)label.classList.add('pire-label-'+rule.marker);
    }
  }
  let queued=false;
  function queueScan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
  if(document.body)scan();else document.addEventListener('DOMContentLoaded',scan,{once:true});
  new MutationObserver(queueScan).observe(document.documentElement,{childList:true,subtree:true});
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
    const link=document.createElement('link');link.rel='stylesheet';link.href='/pire-payment-tabs.css?v=7';link.dataset.pirePaymentTabs='true';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-pire-payment-tabs]')){
    const script=document.createElement('script');script.src='/pire-payment-tabs.js?v=5';script.defer=true;script.dataset.pirePaymentTabs='true';document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-pire-admin-finance-center]')){
    const script=document.createElement('script');script.src='/pire-admin-finance-center.js?v=1';script.defer=true;script.dataset.pireAdminFinanceCenter='true';document.head.appendChild(script);
  }
})();
