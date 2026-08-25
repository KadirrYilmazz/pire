/* Pİ-RE kompakt dashboard takvimi — bu dosya kaldırılırsa mevcut dashboard geri gelir. */
(()=>{
  const MONTHS=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const DAYS=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  let viewDate=new Date(),selected='';

  const iso=(year,month,day)=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const data=()=>{try{return window.__PIRE_RECOVERED_BACKEND__?.exportData?.()||{}}catch(_){return {}}};
  const lessons=()=>Array.isArray(data()?.lessons?.lessons)?data().lessons.lessons:[];
  const trTime=value=>String(value||'').slice(0,5);

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
      button.onclick=()=>{selected=key;render(panel)};
      grid.appendChild(button);
    }
    renderSelected(panel,byDate.get(selected)||[]);
  }

  function renderSelected(panel,items){
    const area=panel.querySelector('[data-calendar-selected]');
    const date=new Date(`${selected}T12:00:00`);
    const title=date.toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'});
    if(!items.length){area.innerHTML=`<div><small>${title}</small><b>Bu gün için ders planlanmamış</b></div><span>Takvim açık</span>`;return}
    area.innerHTML=`<div><small>${title}</small><b>${items.length} ders planlandı</b></div><div class="pire-calendar-selected-lessons">${items.slice(0,2).map(item=>`<span><time>${trTime(item.startTime)}</time><b>${String(item.course||'Ders')}</b><small>${String(item.teacher||'')}</small></span>`).join('')}</div>`;
  }

  function makePanel(dashboard){
    let panel=dashboard.querySelector(':scope > .pire-dashboard-calendar');
    if(panel)return panel;
    panel=document.createElement('section');panel.className='pire-dashboard-calendar';panel.setAttribute('aria-label','Aylık ders takvimi');
    panel.innerHTML=`
      <header>
        <div><small>DERS PROGRAMI</small><h3 data-calendar-title></h3></div>
        <div class="pire-calendar-actions">
          <button type="button" data-alerts-toggle>Akıllı uyarılar <i></i></button>
          <button type="button" data-calendar-prev aria-label="Önceki ay">←</button>
          <button type="button" data-calendar-today>Bugün</button>
          <button type="button" data-calendar-next aria-label="Sonraki ay">→</button>
        </div>
      </header>
      <div class="pire-calendar-grid" data-calendar-grid></div>
      <footer data-calendar-selected></footer>`;
    dashboard.appendChild(panel);
    panel.querySelector('[data-calendar-prev]').onclick=()=>{viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()-1,1);selected='';render(panel)};
    panel.querySelector('[data-calendar-next]').onclick=()=>{viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,1);selected='';render(panel)};
    panel.querySelector('[data-calendar-today]').onclick=()=>{viewDate=new Date();selected='';render(panel)};
    panel.querySelector('[data-alerts-toggle]').onclick=event=>{event.stopPropagation();dashboard.classList.toggle('compact-alerts-open')};
    render(panel);return panel;
  }

  function sync(){
    document.querySelectorAll('.premium-dashboard').forEach(dashboard=>{
      const panel=makePanel(dashboard),badge=dashboard.querySelector('.dashboard-alerts .dashboard-section-head > span');
      const alertButton=panel.querySelector('[data-alerts-toggle]');
      if(alertButton&&badge){const count=badge.textContent||'';const indicator=alertButton.querySelector('i');if(indicator.textContent!==count)indicator.textContent=count;alertButton.setAttribute('aria-label',`Akıllı uyarılar, ${count||0} kayıt`)}
    });
  }
  document.addEventListener('click',event=>document.querySelectorAll('.premium-dashboard.compact-alerts-open').forEach(dashboard=>{if(!dashboard.querySelector('.dashboard-alerts')?.contains(event.target)&&!dashboard.querySelector('[data-alerts-toggle]')?.contains(event.target))dashboard.classList.remove('compact-alerts-open')}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.premium-dashboard.compact-alerts-open').forEach(x=>x.classList.remove('compact-alerts-open'))});
  const boot=()=>{sync();new MutationObserver(()=>requestAnimationFrame(sync)).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
