(()=>{
  'use strict';
  if(window.__PIRE_UX_FEEDBACK__)return;

  const QUICK_ACTIONS=[
    {key:'students',label:'Öğrenciler',icon:'👤',primary:['Öğrenciler','Students']},
    {key:'lessons',label:'Dersler',icon:'📅',primary:['Takvim','Dersler','Calendar','Lessons']},
    {key:'packages',label:'Paketler',icon:'🎟️',primary:['Finans','Finance'],secondary:['Ders Paketleri','Lesson Packages']},
    {key:'payments',label:'Ödemeler',icon:'₺',primary:['Finans','Finance'],secondary:['Ödemeler','Ödeme Takibi','Payments','Payment Tracking']},
    {key:'notifications',label:'Bildirimler',icon:'🔔',notification:true},
    {key:'reports',label:'Raporlar',icon:'📊',primary:['Raporlar','Reports']}
  ];
  const WRITE_LABELS={
    '/api/students':'Öğrenci kaydı',
    '/api/lessons':'Ders kaydı',
    '/api/packages':'Paket kaydı',
    '/api/finance':'Ödeme işlemi',
    '/api/expenses':'Gider kaydı',
    '/api/attendance':'Yoklama kaydı',
    '/api/makeups':'Telafi kaydı',
    '/api/settings':'Ayarlar',
    '/api/announcements':'Duyuru',
    '/api/notifications':'Bildirim ayarı',
    '/api/customers':'Müşteri kaydı'
  };
  const normalize=value=>String(value??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
  let menu=null,button=null,statusChip=null,toastTimer=null,mounted=false;

  function addStyle(){
    if(document.querySelector('style[data-pire-ux-feedback]'))return;
    const style=document.createElement('style');
    style.dataset.pireUxFeedback='true';
    style.textContent=`
      .pire-ux-tools{position:relative;display:inline-flex;align-items:center;gap:7px}
      .pire-ux-sync,.pire-ux-quick-btn{height:34px;border:1px solid rgba(212,180,92,.26);border-radius:11px;background:rgba(255,255,255,.055);color:inherit;display:inline-flex;align-items:center;gap:7px;padding:0 10px;font:700 11px/1 inherit;letter-spacing:.01em;white-space:nowrap;transition:.18s ease}
      .pire-ux-quick-btn:hover,.pire-ux-sync:hover{border-color:rgba(212,180,92,.55);background:rgba(212,180,92,.1);transform:translateY(-1px)}
      .pire-ux-sync{cursor:default}.pire-ux-sync i{width:7px;height:7px;border-radius:50%;background:#8f9aa7;box-shadow:0 0 0 3px rgba(143,154,167,.12)}
      .pire-ux-sync[data-state="ok"] i{background:#49c77d;box-shadow:0 0 0 3px rgba(73,199,125,.14)}
      .pire-ux-sync[data-state="busy"] i{background:#d7ad52;animation:pireUxPulse 1s infinite}
      .pire-ux-sync[data-state="error"] i{background:#ef6b6b;box-shadow:0 0 0 3px rgba(239,107,107,.13)}
      @keyframes pireUxPulse{50%{opacity:.42}}
      .pire-ux-menu{position:absolute;right:0;top:42px;width:270px;padding:10px;border:1px solid rgba(212,180,92,.22);border-radius:16px;background:rgba(18,20,25,.97);box-shadow:0 18px 55px rgba(0,0,0,.38);backdrop-filter:blur(18px);z-index:10050}
      .pire-ux-menu[hidden]{display:none}.pire-ux-menu-head{display:flex;align-items:center;justify-content:space-between;padding:4px 4px 10px}.pire-ux-menu-head b{font-size:12px}.pire-ux-menu-head small{font-size:9px;opacity:.55}
      .pire-ux-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.pire-ux-action{min-height:58px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.045);color:inherit;text-align:left;padding:9px;display:flex;flex-direction:column;justify-content:center;gap:5px}.pire-ux-action:hover{background:rgba(212,180,92,.11);border-color:rgba(212,180,92,.32)}.pire-ux-action span{font-size:15px}.pire-ux-action b{font-size:11px}
      .pire-ux-toast{position:fixed;right:22px;bottom:24px;z-index:11000;max-width:min(360px,calc(100vw - 34px));padding:12px 14px;border-radius:13px;border:1px solid rgba(255,255,255,.12);background:rgba(20,23,28,.96);color:#f5f6f8;box-shadow:0 18px 55px rgba(0,0,0,.38);display:flex;align-items:center;gap:10px;font-size:12px;font-weight:650;animation:pireUxIn .18s ease-out}.pire-ux-toast.success{border-color:rgba(73,199,125,.36)}.pire-ux-toast.error{border-color:rgba(239,107,107,.42)}.pire-ux-toast i{width:9px;height:9px;border-radius:50%;flex:0 0 auto;background:#49c77d}.pire-ux-toast.error i{background:#ef6b6b}@keyframes pireUxIn{from{opacity:0;transform:translateY(8px)}}
      html[data-theme="light"] .pire-ux-menu,html[data-theme="light"] .pire-ux-toast{background:rgba(255,255,255,.98);color:#1c2430;border-color:rgba(92,72,24,.18);box-shadow:0 18px 45px rgba(50,45,30,.18)}
      html[data-theme="light"] .pire-ux-sync,html[data-theme="light"] .pire-ux-quick-btn,html[data-theme="light"] .pire-ux-action{background:rgba(70,56,24,.045);border-color:rgba(100,79,31,.16)}
      @media(max-width:900px){.pire-ux-sync span{display:none}.pire-ux-sync{width:34px;padding:0;justify-content:center}.pire-ux-quick-btn{padding:0 8px}.pire-ux-quick-btn .pire-ux-label{display:none}.pire-ux-menu{right:-8px;width:min(270px,calc(100vw - 28px))}}
      @media(prefers-reduced-motion:reduce){.pire-ux-sync[data-state="busy"] i{animation:none}.pire-ux-toast{animation:none}}
    `;
    document.head.appendChild(style);
  }

  function findByText(labels,scope=document){
    const wanted=labels.map(normalize);
    return [...scope.querySelectorAll('button,a,[role="button"],summary')].find(el=>{
      if(el.closest('.pire-ux-tools'))return false;
      return wanted.includes(normalize(el.textContent));
    })||null;
  }

  function openNotification(){
    return [...document.querySelectorAll('button,[role="button"]')].find(el=>{
      if(el.closest('.pire-ux-tools'))return false;
      const value=normalize(`${el.textContent} ${el.getAttribute('aria-label')||''} ${el.title||''}`);
      return value.includes('bildirim')||value.includes('notification');
    })||null;
  }

  function runAction(action){
    menu.hidden=true;
    if(action.notification){openNotification()?.click();return}
    const primary=findByText(action.primary||[]);
    if(!primary)return showToast('Bu bölüm mevcut rolde kullanılamıyor.','error');
    primary.click();
    if(action.secondary)setTimeout(()=>{
      const secondary=findByText(action.secondary);
      if(secondary)secondary.click();
    },180);
  }

  function showToast(message,type='success'){
    document.querySelector('.pire-ux-toast')?.remove();
    clearTimeout(toastTimer);
    const toast=document.createElement('div');
    toast.className=`pire-ux-toast ${type}`;
    toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
    toast.innerHTML=`<i aria-hidden="true"></i><span></span>`;
    toast.querySelector('span').textContent=message;
    document.body.appendChild(toast);
    toastTimer=setTimeout(()=>toast.remove(),3200);
  }

  function setStatus(state,label,title){
    if(!statusChip)return;
    statusChip.dataset.state=state;
    statusChip.querySelector('span').textContent=label;
    statusChip.title=title||label;
  }

  function mount(){
    if(mounted)return;
    const navbar=document.querySelector('.navbar-tools');
    if(!navbar)return;
    mounted=true;addStyle();
    const wrap=document.createElement('div');wrap.className='pire-ux-tools';
    statusChip=document.createElement('div');statusChip.className='pire-ux-sync';statusChip.dataset.state='busy';statusChip.innerHTML='<i aria-hidden="true"></i><span>Veriler yükleniyor</span>';statusChip.setAttribute('aria-label','Merkezi veri durumu');
    button=document.createElement('button');button.type='button';button.className='pire-ux-quick-btn';button.innerHTML='<span aria-hidden="true">⚡</span><span class="pire-ux-label">Hızlı</span>';button.setAttribute('aria-expanded','false');button.title='Hızlı erişim';
    menu=document.createElement('div');menu.className='pire-ux-menu';menu.hidden=true;menu.innerHTML=`<div class="pire-ux-menu-head"><b>Hızlı erişim</b><small>Ctrl/⌘ + K: arama</small></div><div class="pire-ux-grid">${QUICK_ACTIONS.map(action=>`<button type="button" class="pire-ux-action" data-key="${action.key}"><span aria-hidden="true">${action.icon}</span><b>${action.label}</b></button>`).join('')}</div>`;
    wrap.append(statusChip,button,menu);navbar.appendChild(wrap);
    button.addEventListener('click',event=>{event.stopPropagation();menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden))});
    menu.querySelectorAll('[data-key]').forEach(el=>el.addEventListener('click',()=>{const action=QUICK_ACTIONS.find(row=>row.key===el.dataset.key);if(action)runAction(action)}));
    document.addEventListener('click',event=>{if(menu&&!menu.hidden&&!wrap.contains(event.target)){menu.hidden=true;button.setAttribute('aria-expanded','false')}});
  }

  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&normalize(event.key)==='k'){
      const input=document.querySelector('.navbar-search input[aria-label="Genel arama"],.navbar-search input[aria-label="Global search"]');
      if(input){event.preventDefault();input.focus();input.select?.()}
    }
    if(event.key==='Escape'&&menu&&!menu.hidden){menu.hidden=true;button?.setAttribute('aria-expanded','false')}
  });

  window.addEventListener('pire:canonical-response',event=>{
    const d=event.detail||{};
    const method=String(d.method||'GET').toUpperCase();
    if(d.status===0||Number(d.status)>=500){setStatus('error','Bağlantı sorunu','Merkezi veri servisine erişilemiyor');if(method!=='GET')showToast('İşlem kaydedilemedi. Bağlantıyı kontrol edip yeniden deneyin.','error');return}
    if(d.ok){
      const when=new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
      setStatus('ok','Güncel',`Son başarılı veri iletişimi: ${when}`);
      if(method!=='GET')showToast(`${WRITE_LABELS[d.path]||'İşlem'} başarıyla kaydedildi.`,'success');
      return;
    }
    if(Number(d.status)===401)setStatus('error','Oturum gerekli','Oturum doğrulaması gerekiyor');
  });
  window.addEventListener('pire:canonical-legacy-mirror-ready',()=>setStatus('ok','Güncel','Merkezi veriler senkronize edildi'));

  const observer=new MutationObserver(()=>mount());
  if(document.body){mount();observer.observe(document.body,{childList:true,subtree:true})}
  else document.addEventListener('DOMContentLoaded',()=>{mount();observer.observe(document.body,{childList:true,subtree:true})},{once:true});

  window.__PIRE_UX_FEEDBACK__={enabled:true,showToast,quickActions:QUICK_ACTIONS.map(({key,label})=>({key,label}))};
})();
