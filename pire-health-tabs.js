/* Pİ-RE sistem sağlığı ekranını bilgi alt sekmelerine ayırır. */
(()=>{
  const STORAGE_KEY='pire-health-active-tab';
  const TABS=[
    {id:'summary',label:'Özet'},
    {id:'checks',label:'Sistem Kontrolleri'},
    {id:'flows',label:'Akış Testleri'}
  ];
  let queued=false;

  const readTab=()=>{
    try{
      const value=localStorage.getItem(STORAGE_KEY);
      return TABS.some(tab=>tab.id===value)?value:'summary';
    }catch(_){return 'summary'}
  };

  const saveTab=value=>{
    try{localStorage.setItem(STORAGE_KEY,value)}catch(_){}
  };

  function findHeading(page){
    const content=page?.closest('.content');
    return content?.querySelector(':scope > header')||null;
  }

  function mark(element,section,active){
    if(!element)return;
    element.dataset.pireHealthSection=section;
    element.hidden=section!==active;
  }

  function showTab(page,tabId){
    const active=TABS.some(tab=>tab.id===tabId)?tabId:'summary';
    mark(page.querySelector(':scope > .health-overview'),'summary',active);
    mark(page.querySelector(':scope > .health-check-list'),'checks',active);
    mark(page.querySelector(':scope > .e2e-center'),'flows',active);
    page.dataset.pireHealthTab=active;
    findHeading(page)?.querySelectorAll(':scope > .pire-health-tabs button').forEach(button=>{
      const selected=button.dataset.healthTab===active;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex=selected?0:-1;
    });
  }

  function createTabs(page,heading){
    let nav=heading.querySelector(':scope > .pire-health-tabs');
    if(nav)return nav;
    nav=document.createElement('div');
    nav.className='pire-health-tabs';
    nav.setAttribute('role','tablist');
    nav.setAttribute('aria-label','Sistem sağlığı bilgi grupları');
    TABS.forEach(tab=>{
      const button=document.createElement('button');
      button.type='button';
      button.dataset.healthTab=tab.id;
      button.setAttribute('role','tab');
      button.textContent=tab.label;
      button.addEventListener('click',()=>{
        saveTab(tab.id);
        showTab(page,tab.id);
      });
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();
        const current=TABS.findIndex(item=>item.id===button.dataset.healthTab);
        const next=event.key==='Home'?0:event.key==='End'?TABS.length-1:
          (current+(event.key==='ArrowRight'?1:-1)+TABS.length)%TABS.length;
        const target=nav.querySelector(`[data-health-tab="${TABS[next].id}"]`);
        target?.click();target?.focus();
      });
      nav.appendChild(button);
    });
    const titleBlock=heading.querySelector(':scope > div:not(.top-actions)');
    if(!titleBlock)return null;
    heading.classList.add('pire-health-heading');
    titleBlock.after(nav);
    return nav;
  }

  function sync(){
    const page=document.querySelector('.health-workspace');
    if(!page){
      document.querySelectorAll('.pire-health-tabs').forEach(nav=>nav.remove());
      document.querySelectorAll('.pire-health-heading').forEach(heading=>heading.classList.remove('pire-health-heading'));
      return;
    }
    const heading=findHeading(page);
    if(!heading)return;
    createTabs(page,heading);
    showTab(page,readTab());
  }

  function restoreBeforeReact(event){
    const page=document.querySelector('.health-workspace');
    if(!page||event.target?.closest?.('.pire-health-tabs'))return;
    document.querySelector('.pire-health-tabs')?.remove();
    findHeading(page)?.classList.remove('pire-health-heading');
    page.querySelectorAll('[data-pire-health-section]').forEach(element=>{
      element.hidden=false;
      delete element.dataset.pireHealthSection;
    });
    delete page.dataset.pireHealthTab;
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
