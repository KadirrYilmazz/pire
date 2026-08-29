/* Pİ-RE raporlar ekranını kaydırmasız bilgi alt sekmelerine ayırır. */
(()=>{
  const STORAGE_KEY='pire-reports-active-tab';
  const TABS=[
    {id:'overview',label:'Genel Durum'},
    {id:'summary',label:'Özet'},
    {id:'branches',label:'Branşlar'},
    {id:'finance',label:'Finans'},
    {id:'teachers',label:'Eğitmenler'},
    {id:'operations',label:'Operasyon'}
  ];
  let queued=false;

  const readTab=()=>{
    try{
      const value=localStorage.getItem(STORAGE_KEY);
      return TABS.some(tab=>tab.id===value)?value:'overview';
    }catch(_){return 'overview'}
  };

  const saveTab=value=>{
    try{localStorage.setItem(STORAGE_KEY,value)}catch(_){}
  };

  function setHidden(element,hidden,section){
    if(!element)return;
    element.dataset.pireReportSection=section;
    element.hidden=hidden;
  }

  function findHeading(page){
    const content=page?.closest('.content');
    return content?.querySelector(':scope > header')||null;
  }

  function showTab(page,tabId){
    const active=TABS.some(tab=>tab.id===tabId)?tabId:'overview';
    const head=page.querySelector(':scope > .reports-head');
    const metrics=page.querySelector(':scope > .report-metrics');
    const comparison=page.querySelector(':scope > .report-comparison-note');
    const grid=page.querySelector(':scope > .report-grid');
    const branches=grid?.querySelector(':scope > .report-chart-panel');
    const finance=grid?.querySelector(':scope > .report-finance-panel');
    const teachers=page.querySelector(':scope > .report-table-panel');
    const operations=page.querySelector(':scope > .report-operations-grid');
    const bottom=page.querySelector(':scope > .report-bottom-cards');

    setHidden(head,active!=='overview','overview');
    setHidden(metrics,active!=='summary','summary');
    setHidden(comparison,active!=='summary','summary');
    setHidden(grid,!['branches','finance'].includes(active),'reports');
    setHidden(branches,active!=='branches','branches');
    setHidden(finance,active!=='finance','finance');
    setHidden(teachers,active!=='teachers','teachers');
    setHidden(operations,active!=='operations','operations');
    setHidden(bottom,active!=='operations','operations');

    page.dataset.pireReportTab=active;
    findHeading(page)?.querySelectorAll(':scope > .pire-report-tabs button').forEach(button=>{
      const selected=button.dataset.reportTab===active;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex=selected?0:-1;
    });
  }

  function createTabs(page,heading){
    let nav=heading.querySelector(':scope > .pire-report-tabs');
    if(nav)return nav;
    nav=document.createElement('div');
    nav.className='pire-report-tabs';
    nav.setAttribute('role','tablist');
    nav.setAttribute('aria-label','Rapor bilgi grupları');
    TABS.forEach(tab=>{
      const button=document.createElement('button');
      button.type='button';
      button.dataset.reportTab=tab.id;
      button.setAttribute('role','tab');
      button.textContent=tab.label;
      button.addEventListener('click',()=>{
        saveTab(tab.id);
        showTab(page,tab.id);
      });
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();
        const current=TABS.findIndex(item=>item.id===button.dataset.reportTab);
        const next=event.key==='Home'?0:event.key==='End'?TABS.length-1:
          (current+(event.key==='ArrowRight'?1:-1)+TABS.length)%TABS.length;
        const target=nav.querySelector(`[data-report-tab="${TABS[next].id}"]`);
        target?.click();target?.focus();
      });
      nav.appendChild(button);
    });
    const titleBlock=heading.querySelector(':scope > div:not(.top-actions)');
    if(!titleBlock)return null;
    heading.classList.add('pire-report-heading');
    titleBlock.after(nav);
    return nav;
  }

  function sync(){
    const page=document.querySelector('.reports-page');
    if(!page){
      document.querySelectorAll('.pire-report-tabs').forEach(nav=>nav.remove());
      document.querySelectorAll('.pire-report-heading').forEach(heading=>heading.classList.remove('pire-report-heading'));
      return;
    }
    const heading=findHeading(page);
    if(!heading)return;
    createTabs(page,heading);
    showTab(page,readTab());
  }

  function restoreBeforeReact(event){
    const page=document.querySelector('.reports-page');
    if(!page||event.target?.closest?.('.pire-report-tabs'))return;
    document.querySelector('.pire-report-tabs')?.remove();
    findHeading(page)?.classList.remove('pire-report-heading');
    page.querySelectorAll('[data-pire-report-section]').forEach(element=>{
      element.hidden=false;
      delete element.dataset.pireReportSection;
    });
    delete page.dataset.pireReportTab;
    queueSync();
  }

  function queueSync(){
    if(queued)return;
    queued=true;
    setTimeout(()=>{queued=false;sync()},100);
  }

  ['pointerdown','input','change','submit'].forEach(type=>document.addEventListener(type,restoreBeforeReact,true));
  new MutationObserver(queueSync).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY)queueSync()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queueSync,{once:true});
  else queueSync();
})();
