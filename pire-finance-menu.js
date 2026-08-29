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
  function ownText(element){return [...element.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim())}
  function scan(){
    document.querySelectorAll('button,a,[role="button"]').forEach(element=>{
      const node=ownText(element),text=node?.textContent.trim(),rule=labels[text];
      if(!rule)return;
      element.classList.toggle('pire-finance-income',rule.kind==='income');
      element.classList.toggle('pire-finance-expense',rule.kind==='expense');
      if(rule.label&&text!==rule.label)node.textContent=node.textContent.replace(text,rule.label);
    });
  }
  let queued=false;
  function queueScan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
  scan();new MutationObserver(queueScan).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();