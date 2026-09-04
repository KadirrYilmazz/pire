/* Pİ-RE Fix128 — Yönetim Merkezi Dashboard. Ayrı branch/preview için tasarlandı. */
(()=>{
  'use strict';
  if(window.__PIRE_MANAGEMENT_CENTER__)return;

  const normalize=value=>String(value??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const rows=(data,section,key)=>Array.isArray(data?.[section]?.[key])?data[section][key]:[];
  const data=()=>{try{return window.__PIRE_RECOVERED_BACKEND__?.exportData?.()||{}}catch(_){return {}}};
  const today=()=>new Date().toISOString().slice(0,10);
  const parseIds=value=>{try{return Array.isArray(value)?value:JSON.parse(value||'[]')}catch(_){return []}};
  const formatMoney=value=>`${Number(value||0).toLocaleString('tr-TR',{maximumFractionDigits:0})} ₺`;
  let observer=null,queued=false;

  function addStyle(){
    if(document.querySelector('style[data-pire-management-center]'))return;
    const style=document.createElement('style');
    style.dataset.pireManagementCenter='true';
    style.textContent=`
      .pire-management-center{margin:0 0 18px;border:1px solid rgba(214,181,89,.18);border-radius:22px;padding:16px;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));box-shadow:0 18px 55px rgba(0,0,0,.12)}
      .pire-mc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:13px}.pire-mc-head small{display:block;font-size:10px;font-weight:850;letter-spacing:.12em;color:#d8b85e}.pire-mc-head h2{margin:3px 0 0;font-size:20px;line-height:1.1}.pire-mc-head p{margin:5px 0 0;font-size:11px;opacity:.62}.pire-mc-refresh{height:34px;padding:0 12px;border:1px solid rgba(214,181,89,.24);border-radius:11px;background:rgba(214,181,89,.08);color:inherit;font-weight:800;cursor:pointer}.pire-mc-refresh:hover{background:rgba(214,181,89,.14)}
      .pire-mc-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}.pire-mc-card{min-height:102px;padding:13px;border:1px solid rgba(255,255,255,.075);border-radius:16px;background:rgba(255,255,255,.035);display:flex;flex-direction:column;gap:6px;cursor:pointer;text-align:left;color:inherit;transition:.18s ease}.pire-mc-card:hover{transform:translateY(-2px);border-color:rgba(214,181,89,.28);background:rgba(214,181,89,.075)}.pire-mc-card > span{font-size:10px;font-weight:800;opacity:.62}.pire-mc-card > strong{font-size:27px;line-height:1}.pire-mc-card > small{font-size:10px;opacity:.54}.pire-mc-card.is-warning strong{color:#e5b95b}.pire-mc-card.is-danger strong{color:#f07b78}.pire-mc-card.is-good strong{color:#59c98a}
      .pire-mc-body{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.85fr);gap:12px}.pire-mc-panel{border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:13px;background:rgba(0,0,0,.08)}.pire-mc-panel h3{margin:0 0 10px;font-size:12px}.pire-mc-list{display:flex;flex-direction:column;gap:7px}.pire-mc-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:10px 11px;border:1px solid rgba(255,255,255,.065);border-radius:12px;background:rgba(255,255,255,.025);color:inherit;text-align:left;cursor:pointer}.pire-mc-row:hover{border-color:rgba(214,181,89,.22);background:rgba(214,181,89,.055)}.pire-mc-row span{min-width:0}.pire-mc-row b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pire-mc-row small{display:block;margin-top:2px;font-size:9px;opacity:.55}.pire-mc-row em{font-style:normal;font-size:10px;font-weight:850;white-space:nowrap}.pire-mc-empty{padding:16px;border:1px dashed rgba(255,255,255,.1);border-radius:12px;text-align:center;font-size:10px;opacity:.55}.pire-mc-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.pire-mc-action{min-height:58px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.03);color:inherit;text-align:left;padding:9px;cursor:pointer}.pire-mc-action:hover{background:rgba(214,181,89,.07);border-color:rgba(214,181,89,.22)}.pire-mc-action b{display:block;font-size:10px}.pire-mc-action small{display:block;margin-top:3px;font-size:9px;opacity:.52}
      html[data-theme="light"] .pire-management-center{background:linear-gradient(145deg,rgba(255,255,255,.95),rgba(248,246,239,.88));border-color:rgba(119,90,27,.14);box-shadow:0 16px 38px rgba(67,56,29,.08)}html[data-theme="light"] .pire-mc-card,html[data-theme="light"] .pire-mc-panel,html[data-theme="light"] .pire-mc-row,html[data-theme="light"] .pire-mc-action{background:rgba(80,63,25,.035);border-color:rgba(96,73,22,.11)}
      @media(max-width:1050px){.pire-mc-kpis{grid-template-columns:repeat(2,1fr)}.pire-mc-body{grid-template-columns:1fr}}@media(max-width:620px){.pire-management-center{padding:12px;border-radius:18px}.pire-mc-head{align-items:center}.pire-mc-head p{display:none}.pire-mc-kpis{grid-template-columns:1fr 1fr;gap:7px}.pire-mc-card{min-height:90px}.pire-mc-card>strong{font-size:23px}.pire-mc-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function findNav(labels){
    const wanted=labels.map(normalize);
    return [...document.querySelectorAll('.primary-nav button,.primary-nav summary')].find(el=>wanted.includes(normalize(el.textContent)))||null;
  }
  function openNav(primary,secondary){
    const main=findNav(primary);if(!main)return;
    main.click();
    if(secondary)setTimeout(()=>findNav(secondary)?.click(),150);
  }

  function snapshot(){
    const d=data();
    const students=rows(d,'students','students');
    const lessons=rows(d,'lessons','lessons');
    const packages=rows(d,'packages','packages');
    const ledgers=rows(d,'finance','ledgers');
    const attendance=rows(d,'attendance','attendance');
    const now=new Date();
    const todayKey=today();
    const todayLessons=lessons.filter(item=>item?.lessonDate===todayKey);
    const debt=ledgers.filter(item=>Number(item?.balance||0)>0).sort((a,b)=>Number(b.balance||0)-Number(a.balance||0));
    const expiring=packages.filter(pkg=>{
      if(normalize(pkg?.status)!=='aktif')return false;
      const remaining=Number(pkg?.remainingLessons||0);
      const days=pkg?.endDate?Math.ceil((new Date(`${pkg.endDate}T23:59:59`)-now)/86400000):999;
      return remaining<=3||(days>=0&&days<=14);
    }).sort((a,b)=>Number(a.remainingLessons||0)-Number(b.remainingLessons||0));
    const attendanceLessonIds=new Set(attendance.map(item=>String(item.lessonId)));
    const pendingAttendance=lessons.filter(lesson=>{
      if(!lesson?.lessonDate||lesson.lessonDate>=todayKey)return false;
      const ids=parseIds(lesson.studentIds);
      if(!ids.length)return !attendanceLessonIds.has(String(lesson.id));
      return ids.some(studentId=>!attendance.some(item=>String(item.lessonId)===String(lesson.id)&&String(item.studentId)===String(studentId)));
    });
    const studentName=id=>students.find(item=>String(item.id)===String(id))?.name||`Öğrenci #${id}`;
    return {students,lessons,packages,ledgers,attendance,todayLessons,debt,expiring,pendingAttendance,studentName};
  }

  function priorityItems(s){
    const items=[];
    s.debt.slice(0,3).forEach(row=>items.push({type:'payment',title:row.student||s.studentName(row.studentId),detail:'Bekleyen tahsilat',value:formatMoney(row.balance),primary:['Finans','Finance'],secondary:['Ödemeler','Ödeme Takibi','Payments','Payment Tracking']}));
    s.expiring.slice(0,3).forEach(pkg=>items.push({type:'package',title:s.studentName(pkg.studentId),detail:`${pkg.course||'Paket'} · ${Number(pkg.remainingLessons||0)} ders kaldı`,value:'Paket',primary:['Finans','Finance'],secondary:['Ders Paketleri','Lesson Packages']}));
    s.pendingAttendance.slice(0,3).forEach(lesson=>items.push({type:'attendance',title:lesson.course||'Ders',detail:`${lesson.lessonDate||''} · ${lesson.teacher||''}`,value:'Yoklama',primary:['Dersler','Lessons'],secondary:['Yoklama','Attendance']}));
    return items.slice(0,6);
  }

  function render(root){
    const s=snapshot();
    const priority=priorityItems(s);
    root.innerHTML=`
      <div class="pire-mc-head"><div><small>YÖNETİM MERKEZİ</small><h2>Bugün neye odaklanmalı?</h2><p>Ders, tahsilat, paket ve yoklama durumunu tek ekrandan takip edin.</p></div><button type="button" class="pire-mc-refresh">Yenile</button></div>
      <div class="pire-mc-kpis">
        <button class="pire-mc-card ${s.todayLessons.length?'is-good':''}" data-open="lessons"><span>BUGÜNKÜ DERSLER</span><strong>${s.todayLessons.length}</strong><small>${s.todayLessons.length?'Takvimde planlı ders':'Bugün ders yok'}</small></button>
        <button class="pire-mc-card ${s.debt.length?'is-danger':'is-good'}" data-open="payments"><span>BEKLEYEN TAHSİLAT</span><strong>${s.debt.length}</strong><small>${formatMoney(s.debt.reduce((sum,row)=>sum+Number(row.balance||0),0))} açık bakiye</small></button>
        <button class="pire-mc-card ${s.expiring.length?'is-warning':'is-good'}" data-open="packages"><span>KRİTİK PAKETLER</span><strong>${s.expiring.length}</strong><small>≤3 ders veya ≤14 gün kalan</small></button>
        <button class="pire-mc-card ${s.pendingAttendance.length?'is-warning':'is-good'}" data-open="attendance"><span>EKSİK YOKLAMA</span><strong>${s.pendingAttendance.length}</strong><small>Geçmiş derslerde kontrol bekliyor</small></button>
      </div>
      <div class="pire-mc-body">
        <section class="pire-mc-panel"><h3>Öncelikli İşler</h3><div class="pire-mc-list">${priority.length?priority.map((item,index)=>`<button class="pire-mc-row" data-priority="${index}"><span><b>${esc(item.title)}</b><small>${esc(item.detail)}</small></span><em>${esc(item.value)}</em></button>`).join(''):'<div class="pire-mc-empty">Şu anda kritik bir işlem görünmüyor.</div>'}</div></section>
        <section class="pire-mc-panel"><h3>Hızlı İşlemler</h3><div class="pire-mc-actions"><button class="pire-mc-action" data-open="students"><b>Öğrenci yönetimi</b><small>Kayıt ve öğrenci detayları</small></button><button class="pire-mc-action" data-open="lessons"><b>Ders takvimi</b><small>Bugün ve yaklaşan dersler</small></button><button class="pire-mc-action" data-open="payments"><b>Tahsilatlar</b><small>Açık bakiyeleri incele</small></button><button class="pire-mc-action" data-open="reports"><b>Raporlar</b><small>Kurum analizlerini aç</small></button></div></section>
      </div>`;
    root.querySelector('.pire-mc-refresh').onclick=()=>window.__PIRE_RECOVERED_BACKEND__?.refresh?.().finally?.(()=>render(root));
    root.querySelectorAll('[data-open]').forEach(button=>button.onclick=()=>{
      const key=button.dataset.open;
      if(key==='students')openNav(['Öğrenciler','Students']);
      if(key==='lessons')openNav(['Dersler','Lessons'],['Takvim','Calendar']);
      if(key==='payments')openNav(['Finans','Finance'],['Ödemeler','Ödeme Takibi','Payments','Payment Tracking']);
      if(key==='packages')openNav(['Finans','Finance'],['Ders Paketleri','Lesson Packages']);
      if(key==='attendance')openNav(['Dersler','Lessons'],['Yoklama','Attendance']);
      if(key==='reports')openNav(['Raporlar','Reports']);
    });
    root.querySelectorAll('[data-priority]').forEach(button=>button.onclick=()=>{const item=priority[Number(button.dataset.priority)];if(item)openNav(item.primary,item.secondary)});
  }

  function mount(){
    addStyle();
    const dashboard=document.querySelector('.premium-dashboard');
    if(!dashboard)return;
    let root=dashboard.querySelector(':scope > .pire-management-center');
    if(!root){root=document.createElement('section');root.className='pire-management-center';root.setAttribute('aria-label','Yönetim Merkezi');dashboard.prepend(root)}
    render(root);
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
  window.addEventListener('pire:canonical-legacy-mirror-ready',queue);
  window.addEventListener('pire:canonical-response',event=>{if(event?.detail?.ok&&String(event.detail.method||'GET').toUpperCase()!=='GET')setTimeout(queue,420)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  observer=new MutationObserver(queue);observer.observe(document.documentElement,{childList:true,subtree:true});
  window.__PIRE_MANAGEMENT_CENTER__={enabled:true,refresh:queue,snapshot};
})();
