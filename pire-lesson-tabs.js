/* Pİ-RE yoklama ve telafi alt sekmeleri - ortak yönetici */
(()=>{
  const allowedSizes=[5,10,20];
  const attendance={
    filterKey:'pire-attendance-filter-v1',sizeKey:'pire-attendance-page-size-v1',
    labels:{pending:'Bekleyen',completed:'Tamamlanan',absence:'Devamsızlıklar',all:'Tüm Dersler'},
    filter:'pending',page:1,size:5
  };
  const makeup={
    filterKey:'pire-makeup-filter-v1',sizeKey:'pire-makeup-page-size-v1',
    labels:{pending:'Bekleyen Telafiler',planned:'Planlanan Telafiler',lessons:'Ders İşlemleri',history:'Değişiklik Geçmişi'},
    filter:'pending',page:1,size:5
  };
  [attendance,makeup].forEach(state=>{
    state.filter=sessionStorage.getItem(state.filterKey)||state.filter;
    state.size=Number(sessionStorage.getItem(state.sizeKey)||5);
    if(!state.labels[state.filter])state.filter=Object.keys(state.labels)[0];
    if(!allowedSizes.includes(state.size))state.size=5;
  });

  function makeTabs(className,labels){
    const tabs=document.createElement('div');tabs.className=className;tabs.setAttribute('role','tablist');
    Object.entries(labels).forEach(([id,label])=>{
      const button=document.createElement('button');button.type='button';button.dataset.filter=id;button.setAttribute('role','tab');
      button.innerHTML='<span>'+label+'</span><b>0</b>';tabs.appendChild(button);
    });
    return tabs;
  }
  function makePagination(className,label,state){
    const footer=document.createElement('div');footer.className=className;
    footer.innerHTML='<label>Göster <select aria-label="'+label+'"><option>5</option><option>10</option><option>20</option></select></label><button type="button" data-page="prev">← Önceki</button><strong aria-live="polite">1 / 1</strong><button type="button" data-page="next">Sonraki →</button>';
    footer.querySelector('select').value=String(state.size);return footer;
  }
  function updateTabs(ui,state,counts){
    ui.controls.querySelectorAll('button[data-filter]').forEach(button=>{
      const id=button.dataset.filter,active=id===state.filter;
      button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));
      button.querySelector('b').textContent=String(counts[id]||0);
    });
  }
  function updatePagination(ui,state,total){
    const pages=Math.max(1,Math.ceil(total/state.size));state.page=Math.min(Math.max(1,state.page),pages);
    ui.empty.hidden=total>0;ui.footer.hidden=total===0;
    ui.footer.querySelector('strong').textContent=state.page+' / '+pages;
    ui.footer.querySelector('[data-page="prev"]').disabled=state.page<=1;
    ui.footer.querySelector('[data-page="next"]').disabled=state.page>=pages;
    return{pages,start:(state.page-1)*state.size,end:state.page*state.size};
  }

  function attendanceBuild(root){
    const list=root.querySelector('.attendance-list'),title=list?.querySelector('.panel-title');if(!list||!title)return null;
    let controls=root.querySelector('.pire-attendance-controls');
    if(!controls){controls=document.createElement('div');controls.className='pire-attendance-controls';controls.appendChild(makeTabs('pire-attendance-tabs',attendance.labels));}
    if(controls.parentElement!==root)root.prepend(controls);
    let footer=list.querySelector('.pire-attendance-pagination');
    if(!footer){footer=makePagination('pire-attendance-pagination','Sayfadaki yoklama sayısı',attendance);list.appendChild(footer);}
    let empty=list.querySelector('.pire-attendance-empty');
    if(!empty){empty=document.createElement('div');empty.className='pire-attendance-empty';empty.textContent='Bu bölümde gösterilecek ders bulunmuyor.';footer.before(empty);}
    return{controls,footer,empty};
  }
  function renderAttendance(root){
    const ui=attendanceBuild(root);if(!ui)return;
    const all=[...root.querySelectorAll('.attendance-lesson-row[data-attendance-state]')],counts={pending:0,completed:0,absence:0,all:all.length};
    all.forEach(row=>{const key=row.dataset.attendanceState;if(counts[key]!=null)counts[key]++;});
    updateTabs(ui,attendance,counts);
    const selected=attendance.filter==='all'?all:all.filter(row=>row.dataset.attendanceState===attendance.filter);
    const range=updatePagination(ui,attendance,selected.length),visible=new Set(selected.slice(range.start,range.end));
    all.forEach(row=>row.hidden=!visible.has(row));
  }

  function makeupStatus(row){
    const status=row.querySelector('.makeup-status');
    const value=((status?.className||'')+' '+(status?.textContent||'')).toLocaleLowerCase('tr-TR');
    if(value.includes('expired')||value.includes('süresi')||value.includes('doldu'))return'expired';
    if(value.includes('planned')||value.includes('planlandı')||value.includes('scheduled'))return'planned';
    return'pending';
  }
  function makeupElements(root){
    const columns=root.querySelector('.makeup-columns'),panels=columns?[...columns.querySelectorAll(':scope > section.panel')]:[];
    return{columns,lessonsPanel:panels[0],rightsPanel:panels[1],historyPanel:root.querySelector('.change-history'),
      lessons:panels[0]?[...panels[0].querySelectorAll('.makeup-lesson-row')]:[],
      rights:panels[1]?[...panels[1].querySelectorAll('.makeup-right')]:[],
      history:[...root.querySelectorAll('.change-history .change-row')]};
  }
  function makeupBuild(root){
    const summary=root.querySelector('.makeup-summary');if(summary)summary.hidden=true;
    let controls=root.querySelector('.pire-makeup-controls');
    if(!controls){controls=document.createElement('div');controls.className='pire-makeup-controls';controls.appendChild(makeTabs('pire-makeup-tabs',makeup.labels));}
    if(controls.parentElement!==root)root.prepend(controls);
    let footer=root.querySelector('.pire-makeup-pagination');
    if(!footer){footer=makePagination('pire-makeup-pagination','Sayfadaki telafi kaydı sayısı',makeup);root.appendChild(footer);}
    let empty=root.querySelector('.pire-makeup-empty');
    if(!empty){empty=document.createElement('div');empty.className='pire-makeup-empty';empty.textContent='Bu bölümde gösterilecek kayıt bulunmuyor.';footer.before(empty);}
    return{controls,footer,empty};
  }
  function renderMakeup(root){
    const ui=makeupBuild(root),data=makeupElements(root);if(!ui||!data.columns)return;
    const pending=data.rights.filter(row=>makeupStatus(row)==='pending'),planned=data.rights.filter(row=>makeupStatus(row)==='planned'),expired=data.rights.filter(row=>makeupStatus(row)==='expired');
    const groups={pending,planned,lessons:data.lessons,history:[...expired,...data.history]};
    const counts={pending:pending.length,planned:planned.length,lessons:data.lessons.length,history:expired.length+data.history.length};
    updateTabs(ui,makeup,counts);
    const selected=groups[makeup.filter]||[],range=updatePagination(ui,makeup,selected.length),visible=new Set(selected.slice(range.start,range.end));
    [...data.lessons,...data.rights,...data.history].forEach(row=>row.hidden=!visible.has(row));
    const showLessons=data.lessons.some(row=>visible.has(row)),showRights=data.rights.some(row=>visible.has(row)),showHistory=data.history.some(row=>visible.has(row));
    if(data.lessonsPanel)data.lessonsPanel.hidden=!showLessons;if(data.rightsPanel)data.rightsPanel.hidden=!showRights;if(data.historyPanel)data.historyPanel.hidden=!showHistory;
    data.columns.hidden=!(showLessons||showRights);root.dataset.makeupTab=makeup.filter;
  }

  function saveFilter(state,id){if(!state.labels[id])return;state.filter=id;state.page=1;sessionStorage.setItem(state.filterKey,id);}
  document.addEventListener('click',event=>{
    const attendanceTab=event.target.closest?.('.pire-attendance-tabs button[data-filter]');
    if(attendanceTab){event.preventDefault();saveFilter(attendance,attendanceTab.dataset.filter);const root=document.querySelector('.attendance-page');if(root)renderAttendance(root);return;}
    const makeupTab=event.target.closest?.('.pire-makeup-tabs button[data-filter]');
    if(makeupTab){event.preventDefault();event.stopPropagation();saveFilter(makeup,makeupTab.dataset.filter);const root=document.querySelector('.makeups-page');if(root)renderMakeup(root);return;}
    const attendancePage=event.target.closest?.('.pire-attendance-pagination button[data-page]');
    if(attendancePage){attendance.page+=attendancePage.dataset.page==='next'?1:-1;const root=document.querySelector('.attendance-page');if(root)renderAttendance(root);return;}
    const makeupPage=event.target.closest?.('.pire-makeup-pagination button[data-page]');
    if(makeupPage){makeup.page+=makeupPage.dataset.page==='next'?1:-1;const root=document.querySelector('.makeups-page');if(root)renderMakeup(root);}
  },true);
  document.addEventListener('change',event=>{
    const select=event.target;
    if(select.matches?.('.pire-attendance-pagination select')){attendance.size=Number(select.value);attendance.page=1;sessionStorage.setItem(attendance.sizeKey,String(attendance.size));const root=document.querySelector('.attendance-page');if(root)renderAttendance(root);}
    if(select.matches?.('.pire-makeup-pagination select')){makeup.size=Number(select.value);makeup.page=1;sessionStorage.setItem(makeup.sizeKey,String(makeup.size));const root=document.querySelector('.makeups-page');if(root)renderMakeup(root);}
  });
  function enhance(){const a=document.querySelector('.attendance-page');if(a)renderAttendance(a);const m=document.querySelector('.makeups-page');if(m)renderMakeup(m);}
  let queued=false;function scan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});}
  scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();