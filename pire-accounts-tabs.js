/* Pİ-RE kullanıcılar ekranını bilgi alt sekmelerine ayırır. */
(()=>{
  const STORAGE_KEY='pire-accounts-active-tab';
  const AUDIT_SIZE_KEY='pire-audit-page-size';
  const TABS=[
    {id:'accounts',label:'Hesaplar'},
    {id:'permissions',label:'Yetkiler'},
    {id:'announcements',label:'Duyurular'},
    {id:'backup',label:'Yedekleme'},
    {id:'security',label:'Güvenlik Geçmişi'}
  ];
  const AUDIT_PAGE_SIZES=[5,10,20];
  let queued=false;
  let auditPage=1;
  let auditPageSize=readAuditPageSize();

  const readTab=()=>{
    try{
      const value=localStorage.getItem(STORAGE_KEY);
      return TABS.some(tab=>tab.id===value)?value:'accounts';
    }catch(_){return 'accounts'}
  };

  const saveTab=value=>{
    try{localStorage.setItem(STORAGE_KEY,value)}catch(_){}
  };

  function readAuditPageSize(){
    try{
      const value=Number(localStorage.getItem(AUDIT_SIZE_KEY));
      return AUDIT_PAGE_SIZES.includes(value)?value:5;
    }catch(_){return 5}
  }

  function saveAuditPageSize(value){
    try{localStorage.setItem(AUDIT_SIZE_KEY,String(value))}catch(_){}
  }

  function findHeading(page){
    const content=page?.closest('.content');
    return content?.querySelector(':scope > header')||null;
  }

  function mark(element,section,active){
    if(!element)return;
    element.dataset.pireAccountSection=section;
    element.hidden=section!==active;
  }

  function showTab(page,tabId){
    const active=TABS.some(tab=>tab.id===tabId)?tabId:'accounts';
    mark(page.querySelector(':scope > .account-stats'),'accounts',active);
    mark(page.querySelector(':scope > .account-list-head'),'accounts',active);
    mark(page.querySelector(':scope > .account-list'),'accounts',active);
    mark(page.querySelector(':scope > .access-control'),'permissions',active);
    mark(page.querySelector(':scope > .announcement-center'),'announcements',active);
    mark(page.querySelector(':scope > .account-backup'),'backup',active);
    mark(page.querySelector(':scope > .account-audit'),'security',active);

    page.dataset.pireAccountTab=active;
    findHeading(page)?.querySelectorAll(':scope > .pire-account-tabs button').forEach(button=>{
      const selected=button.dataset.accountTab===active;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex=selected?0:-1;
    });
  }

  function paginateAudit(page){
    const audit=page.querySelector(':scope > .account-audit');
    const list=audit?.querySelector(':scope > div:not(.pire-audit-pager)');
    const entries=list?[...list.querySelectorAll(':scope > article')]:[];
    let pager=audit?.querySelector(':scope > .pire-audit-pager');
    if(!audit||!entries.length){pager?.remove();return}
    const pageCount=Math.max(1,Math.ceil(entries.length/auditPageSize));
    auditPage=Math.max(1,Math.min(auditPage,pageCount));
    entries.forEach((entry,index)=>{
      entry.dataset.pireAuditEntry='true';
      entry.hidden=index<(auditPage-1)*auditPageSize||index>=auditPage*auditPageSize;
    });
    if(!pager){
      pager=document.createElement('div');
      pager.className='pire-audit-pager';
      pager.setAttribute('aria-label','Güvenlik geçmişi sayfaları');
      const sizeLabel=document.createElement('label');
      sizeLabel.textContent='Göster';
      const sizeSelect=document.createElement('select');
      sizeSelect.setAttribute('aria-label','Sayfa başına güvenlik kaydı');
      AUDIT_PAGE_SIZES.forEach(size=>{
        const option=document.createElement('option');option.value=String(size);option.textContent=String(size);
        sizeSelect.appendChild(option);
      });
      sizeSelect.addEventListener('change',()=>{
        auditPageSize=Number(sizeSelect.value);auditPage=1;saveAuditPageSize(auditPageSize);paginateAudit(page);
      });
      sizeLabel.appendChild(sizeSelect);
      const previous=document.createElement('button');
      previous.type='button';previous.dataset.auditPage='previous';previous.textContent='← Önceki';
      const status=document.createElement('span');status.setAttribute('aria-live','polite');
      const next=document.createElement('button');
      next.type='button';next.dataset.auditPage='next';next.textContent='Sonraki →';
      previous.addEventListener('click',()=>{auditPage-=1;paginateAudit(page)});
      next.addEventListener('click',()=>{auditPage+=1;paginateAudit(page)});
      pager.append(sizeLabel,previous,status,next);
      audit.appendChild(pager);
    }
    const sizeSelect=pager.querySelector('select');
    const previous=pager.querySelector('[data-audit-page="previous"]');
    const status=pager.querySelector('span');
    const next=pager.querySelector('[data-audit-page="next"]');
    sizeSelect.value=String(auditPageSize);
    previous.disabled=auditPage===1;
    next.disabled=auditPage===pageCount;
    const pageLabel=`${auditPage} / ${pageCount}`;
    if(status.textContent!==pageLabel)status.textContent=pageLabel;
  }

  function createTabs(page,heading){
    let nav=heading.querySelector(':scope > .pire-account-tabs');
    if(nav)return nav;
    nav=document.createElement('div');
    nav.className='pire-account-tabs';
    nav.setAttribute('role','tablist');
    nav.setAttribute('aria-label','Kullanıcı bilgi grupları');
    TABS.forEach(tab=>{
      const button=document.createElement('button');
      button.type='button';
      button.dataset.accountTab=tab.id;
      button.setAttribute('role','tab');
      button.textContent=tab.label;
      button.addEventListener('click',()=>{
        saveTab(tab.id);
        showTab(page,tab.id);
      });
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();
        const current=TABS.findIndex(item=>item.id===button.dataset.accountTab);
        const next=event.key==='Home'?0:event.key==='End'?TABS.length-1:
          (current+(event.key==='ArrowRight'?1:-1)+TABS.length)%TABS.length;
        const target=nav.querySelector(`[data-account-tab="${TABS[next].id}"]`);
        target?.click();target?.focus();
      });
      nav.appendChild(button);
    });
    const titleBlock=heading.querySelector(':scope > div:not(.top-actions)');
    if(!titleBlock)return null;
    heading.classList.add('pire-account-heading');
    titleBlock.after(nav);
    return nav;
  }

  function sync(){
    const page=document.querySelector('.account-workspace');
    if(!page){
      document.querySelectorAll('.pire-account-tabs').forEach(nav=>nav.remove());
      document.querySelectorAll('.pire-account-heading').forEach(heading=>heading.classList.remove('pire-account-heading'));
      return;
    }
    const heading=findHeading(page);
    if(!heading)return;
    createTabs(page,heading);
    showTab(page,readTab());
    paginateAudit(page);
  }

  function restoreBeforeReact(event){
    const page=document.querySelector('.account-workspace');
    if(!page||event.target?.closest?.('.pire-account-tabs,.pire-audit-pager'))return;
    document.querySelector('.pire-account-tabs')?.remove();
    page.querySelector(':scope > .account-audit > .pire-audit-pager')?.remove();
    page.querySelectorAll('[data-pire-audit-entry]').forEach(entry=>{
      entry.hidden=false;
      delete entry.dataset.pireAuditEntry;
    });
    findHeading(page)?.classList.remove('pire-account-heading');
    page.querySelectorAll('[data-pire-account-section]').forEach(element=>{
      element.hidden=false;
      delete element.dataset.pireAccountSection;
    });
    delete page.dataset.pireAccountTab;
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
