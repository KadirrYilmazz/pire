/* Pİ-RE kompakt dashboard takvimi — bu dosya kaldırılırsa mevcut dashboard geri gelir. */
(()=>{
  const MONTHS=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const DAYS=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  let viewDate=new Date(),selected='';
  let movedActions=null,actionsHome=null,syncQueued=false,smartAlertCount='',openSmartAlertsAfterNavigation=false;
  const boundPanels=new WeakSet();

  const iso=(year,month,day)=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const data=()=>{try{return window.__PIRE_RECOVERED_BACKEND__?.exportData?.()||{}}catch(_){return {}}};
  const lessons=()=>Array.isArray(data()?.lessons?.lessons)?data().lessons.lessons:[];
  const trTime=value=>String(value||'').slice(0,5);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function openFullCalendar(){
    const lessonMenu=[...document.querySelectorAll('.primary-nav details')].find(item=>item.querySelector('summary')?.textContent?.trim().startsWith('Dersler'));
    const calendarButton=[...(lessonMenu?.querySelectorAll('button')||[])].find(button=>button.textContent?.trim()==='Takvim');
    if(calendarButton){calendarButton.click();return}
    lessonMenu?.querySelector('summary')?.click();
  }

  function render(panel){
    const year=viewDate.getFullYear(),month=viewDate.getMonth();
    const first=(new Date(year,month,1).getDay()+6)%7;
    const count=new Date(year,month+1,0).getDate();
    const currentLessons=lessons();
    const byDate=new Map();
    currentLessons.forEach(lesson=>{if(!lesson?.lessonDate)return;const rows=byDate.get(lesson.lessonDate)||[];rows.push(lesson);byDate.set(lesson.lessonDate,rows)});
    const today=new Date(),todayKey=iso(today.getFullYear(),today.getMonth(),today.getDate());
    if(!selected||!selected.startsWith(`${year}-${String(month+1).padStart(2,'0')}`))selected=todayKey.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)?todayKey:iso(year,month,1);

    panel.querySelector('[data-calendar-title]').textContent=`${MONTHS[month]} ${year}`;
    const grid=panel.querySelector('[data-calendar-grid]');
    grid.innerHTML=DAYS.map(day=>`<span class="pire-calendar-weekday">${day}</span>`).join('');
    for(let i=0;i<first;i++)grid.insertAdjacentHTML('beforeend','<span class="pire-calendar-blank" aria-hidden="true"></span>');
    for(let day=1;day<=count;day++){
      const key=iso(year,month,day),items=byDate.get(key)||[];
      const button=document.createElement('button');
      button.type='button';button.className='pire-calendar-day';button.dataset.date=key;
      if(key===todayKey)button.classList.add('is-today');
      if(key===selected)button.classList.add('is-selected');
      button.setAttribute('aria-label',`${day} ${MONTHS[month]}${items.length?`, ${items.length} ders`:''}`);
      button.innerHTML=`<b>${day}</b>${items.length?`<span class="pire-calendar-dots">${items.slice(0,3).map(()=>'<i></i>').join('')}</span><small>${items.length} ders</small>`:''}`;
      grid.appendChild(button);
    }
    renderSelected(panel,byDate.get(selected)||[]);
  }

  function renderSelected(panel,items){
    const area=panel.querySelector('[data-calendar-selected]');
    const date=new Date(`${selected}T12:00:00`);
    const title=date.toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'});
    if(!items.length)area.innerHTML=`<div><small>${title}</small><b>Bu gün için ders planlanmamış</b></div><button type="button" data-open-full-calendar>Takvimde aç →</button>`;
    else area.innerHTML=`<div><small>${title}</small><b>${items.length} ders planlandı</b></div><div class="pire-calendar-selected-lessons">${items.slice(0,2).map(item=>`<span><time>${trTime(item.startTime)}</time><b>${String(item.course||'Ders')}</b><small>${String(item.teacher||'')}</small></span>`).join('')}</div><button type="button" data-open-full-calendar>Takvimde aç →</button>`;
    area.querySelector('[data-open-full-calendar]').onclick=openFullCalendar;
  }

  function showDayDetails(panel,key,items){
    const popover=panel.querySelector('[data-calendar-popover]');
    const date=new Date(`${key}T12:00:00`).toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'});
    popover.innerHTML=`
      <header><div><small>${esc(date)}</small><h4>${items.length} ders planlandı</h4></div><button type="button" data-close-calendar-details aria-label="Ders ayrıntılarını kapat">×</button></header>
      <div class="pire-calendar-detail-list">${items.map(item=>`<article><time>${esc(trTime(item.startTime))}</time><div><b>${esc(item.course||'Ders')}</b><small>${esc(item.teacher||'Eğitmen belirtilmemiş')}${item.room?` · ${esc(item.room)}`:''}</small></div></article>`).join('')}</div>
      <footer><button type="button" data-open-full-calendar>Tam takvimde aç →</button></footer>`;
    popover.hidden=false;
    popover.querySelector('[data-close-calendar-details]').onclick=()=>{popover.hidden=true};
    popover.querySelector('[data-open-full-calendar]').onclick=openFullCalendar;
  }

  function makePanel(dashboard){
    let panel=dashboard.querySelector(':scope > .pire-dashboard-calendar');
    if(panel){bindPanel(panel,dashboard);return panel}
    panel=document.createElement('section');panel.className='pire-dashboard-calendar';panel.setAttribute('aria-label','Aylık ders takvimi');
    panel.innerHTML=`
      <header>
        <div><small>DERS PROGRAMI</small><h3 data-calendar-title></h3></div>
        <div class="pire-calendar-actions">
          <button type="button" data-calendar-prev aria-label="Önceki ay">←</button>
          <button type="button" data-calendar-today>Bugün</button>
          <button type="button" data-calendar-next aria-label="Sonraki ay">→</button>
        </div>
      </header>
      <div class="pire-calendar-grid" data-calendar-grid></div>
      <footer data-calendar-selected></footer>
      <aside class="pire-calendar-popover" data-calendar-popover hidden></aside>`;
    dashboard.appendChild(panel);
    bindPanel(panel,dashboard);
    render(panel);return panel;
  }

  function bindPanel(panel,dashboard){
    if(boundPanels.has(panel))return;
    boundPanels.add(panel);
    panel.addEventListener('click',event=>{
      const target=event.target.closest('button');
      if(!target||!panel.contains(target))return;
      if(target.matches('[data-calendar-prev]')){viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()-1,1);selected='';render(panel);return}
      if(target.matches('[data-calendar-next]')){viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,1);selected='';render(panel);return}
      if(target.matches('[data-calendar-today]')){viewDate=new Date();selected='';render(panel);return}
      const day=target.closest('.pire-calendar-day');
      if(day){
        const key=day.dataset.date,items=lessons().filter(item=>item?.lessonDate===key);
        selected=key;render(panel);if(items.length)showDayDetails(panel,key,items);
      }
    });
  }

  function restoreNewActions(){
    if(movedActions&&actionsHome?.isConnected&&movedActions.parentElement!==actionsHome)actionsHome.appendChild(movedActions);
  }

  function placeNewActions(){
    const shell=document.querySelector('.app-shell');
    const sidebar=shell?.querySelector('.sidebar');
    const header=shell?.querySelector('.content > header');
    const actions=header?.querySelector(':scope > .top-actions')||sidebar?.querySelector(':scope > .pire-nav-new-actions')||(movedActions?.isConnected?movedActions:null);
    if(!shell||!sidebar||!header||!actions?.querySelector('.pire-new-menu')){
      shell?.classList.remove('pire-persistent-header');
      restoreNewActions();
      return false;
    }
    if(!movedActions||movedActions!==actions){movedActions=actions;actionsHome=actions.parentElement}
    if(!actionsHome?.isConnected)actionsHome=header;
    shell.classList.add('pire-persistent-header');
    header.classList.add('pire-dashboard-actions-home');
    if(actions.parentElement!==sidebar)sidebar.appendChild(actions);
    actions.classList.add('pire-nav-new-actions');
    return true;
  }

  function sync(){
    const hasPersistentHeader=placeNewActions();
    let dashboard=null;
    document.querySelectorAll('.premium-dashboard').forEach(dashboard=>{
      const panel=makePanel(dashboard),badge=dashboard.querySelector('.dashboard-alerts .dashboard-section-head > span');
      smartAlertCount=badge?.textContent||'';
      if(openSmartAlertsAfterNavigation){dashboard.classList.add('compact-alerts-open');openSmartAlertsAfterNavigation=false}
    });
    dashboard=document.querySelector('.premium-dashboard');
    if(hasPersistentHeader)placeSmartAlertButton(dashboard,smartAlertCount);
    else document.querySelectorAll('.pire-smart-alert-button').forEach(button=>button.remove());
  }

  function placeSmartAlertButton(dashboard,count){
    const tools=document.querySelector('.app-shell.pire-persistent-header .navbar-tools');
    const notifications=tools?.querySelector('.notification-wrap');
    if(!tools||!notifications)return;
    let button=tools.querySelector('.pire-smart-alert-button');
    if(!button){
      button=document.createElement('button');button.type='button';button.className='pire-smart-alert-button navbar-icon-button';
      button.innerHTML='<span aria-hidden="true">✦</span><b></b>';
      notifications.insertAdjacentElement('afterend',button);
    }
    button.onclick=event=>{
      event.stopPropagation();
      if(dashboard?.isConnected){dashboard.classList.toggle('compact-alerts-open');return}
      const dashboardButton=[...document.querySelectorAll('.primary-nav button')].find(item=>item.textContent?.trim()==='Genel Bakış');
      if(dashboardButton){openSmartAlertsAfterNavigation=true;dashboardButton.click()}
    };
    const badge=button.querySelector('b');if(badge.textContent!==count)badge.textContent=count;
    badge.hidden=!count||count==='0';
    button.setAttribute('aria-label',`Akıllı uyarılar, ${count||0} kayıt`);button.title='Akıllı uyarılar';
  }

  document.addEventListener('click',event=>document.querySelectorAll('.premium-dashboard.compact-alerts-open').forEach(dashboard=>{if(!dashboard.querySelector('.dashboard-alerts')?.contains(event.target)&&!event.target.closest?.('.pire-smart-alert-button'))dashboard.classList.remove('compact-alerts-open')}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.premium-dashboard.compact-alerts-open').forEach(x=>x.classList.remove('compact-alerts-open'))});
  document.addEventListener('click',event=>{
    const nav=event.target.closest?.('.primary-nav');
    const notification=event.target.closest?.('.notification-list > button');
    const smartAlert=event.target.closest?.('.dashboard-alerts .alert-stream > button');
    const lessonCalendarCard=event.target.closest?.('.premium-dashboard .kpi-lessons');
    if((nav&&!event.target.closest('.pire-nav-new-actions'))||notification||smartAlert||lessonCalendarCard)restoreNewActions();
  },true);
  document.addEventListener('keydown',event=>{
    if((event.key==='Enter'||event.key===' ')&&event.target.closest?.('.premium-dashboard .kpi-lessons'))restoreNewActions();
  },true);
  const queueSync=()=>{if(syncQueued)return;syncQueued=true;requestAnimationFrame(()=>{syncQueued=false;sync()})};
  const boot=()=>{
    queueSync();
    new MutationObserver(queueSync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    [100,300,800,1600].forEach(delay=>setTimeout(queueSync,delay));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();