/* Pİ-RE telafi alt sekmeleri ve sayfalama */
(()=>{
  const FILTER_KEY='pire-makeup-filter-v1',SIZE_KEY='pire-makeup-page-size-v1';
  const labels={pending:'Bekleyen Telafiler',planned:'Planlanan Telafiler',lessons:'Ders İşlemleri',history:'Değişiklik Geçmişi'};
  let filter=sessionStorage.getItem(FILTER_KEY)||'pending',page=1,size=Number(sessionStorage.getItem(SIZE_KEY)||5);
  if(!labels[filter])filter='pending';if(![5,10,20].includes(size))size=5;

  function statusOf(row){
    const status=row.querySelector('.makeup-status');
    const value=((status?.className||'')+' '+(status?.textContent||'')).toLocaleLowerCase('tr-TR');
    if(value.includes('expired')||value.includes('süresi')||value.includes('doldu'))return'expired';
    if(value.includes('planned')||value.includes('planlandı')||value.includes('scheduled'))return'planned';
    return'pending';
  }
  function elements(root){
    const columns=root.querySelector('.makeup-columns');
    const panels=columns?[...columns.querySelectorAll(':scope > section.panel')]:[];
    return{
      columns,lessonsPanel:panels[0],rightsPanel:panels[1],historyPanel:root.querySelector('.change-history'),
      lessons:panels[0]?[...panels[0].querySelectorAll('.makeup-lesson-row')]:[],
      rights:panels[1]?[...panels[1].querySelectorAll('.makeup-right')]:[],
      history:[...root.querySelectorAll('.change-history .change-row')]
    };
  }
  function findHeading(){
    return [...document.querySelectorAll('h1,h2')].find(node=>{
      const text=(node.textContent||'').trim().toLocaleLowerCase('tr-TR');
      return text.includes('telafi ve ders değişiklikleri')||text.includes('make-up')||text.includes('lesson changes');
    });
  }
  function build(root){
    const summary=root.querySelector('.makeup-summary');if(summary)summary.hidden=true;
    const heading=findHeading(),host=heading?.parentElement;
    if(host)host.classList.add('pire-makeup-heading-host');
    let controls=document.querySelector('.pire-makeup-controls');
    if(!controls){
      controls=document.createElement('div');controls.className='pire-makeup-controls';
      const tabs=document.createElement('div');tabs.className='pire-makeup-tabs';tabs.setAttribute('role','tablist');
      Object.entries(labels).forEach(([id,label])=>{const button=document.createElement('button');button.type='button';button.dataset.filter=id;button.setAttribute('role','tab');button.innerHTML='<span>'+label+'</span><b>0</b>';button.addEventListener('click',()=>{filter=id;page=1;sessionStorage.setItem(FILTER_KEY,filter);render(root)});tabs.appendChild(button)});
      controls.appendChild(tabs);
    }
    if(controls.parentElement!==root)root.prepend(controls);
    let footer=root.querySelector('.pire-makeup-pagination');
    if(!footer){
      footer=document.createElement('div');footer.className='pire-makeup-pagination';
      footer.innerHTML='<label>Göster <select aria-label="Sayfadaki telafi kaydı sayısı"><option>5</option><option>10</option><option>20</option></select></label><button type="button" data-page="prev">← Önceki</button><strong aria-live="polite">1 / 1</strong><button type="button" data-page="next">Sonraki →</button>';
      footer.querySelector('select').value=String(size);
      footer.querySelector('select').addEventListener('change',event=>{size=Number(event.target.value);page=1;sessionStorage.setItem(SIZE_KEY,String(size));render(root)});
      footer.querySelector('[data-page="prev"]').addEventListener('click',()=>{if(page>1){page--;render(root)}});
      footer.querySelector('[data-page="next"]').addEventListener('click',()=>{page++;render(root)});
      root.appendChild(footer);
    }
    let empty=root.querySelector('.pire-makeup-empty');
    if(!empty){empty=document.createElement('div');empty.className='pire-makeup-empty';empty.textContent='Bu bölümde gösterilecek kayıt bulunmuyor.';footer.before(empty)}
    return{controls,footer,empty};
  }
  function render(root){
    const ui=build(root),data=elements(root);if(!ui||!data.columns)return;
    const pending=data.rights.filter(row=>statusOf(row)==='pending');
    const planned=data.rights.filter(row=>statusOf(row)==='planned');
    const expired=data.rights.filter(row=>statusOf(row)==='expired');
    const groups={pending,planned,lessons:data.lessons,history:[...expired,...data.history]};
    const counts={pending:pending.length,planned:planned.length,lessons:data.lessons.length,history:expired.length+data.history.length};
    ui.controls.querySelectorAll('[data-filter]').forEach(button=>{const id=button.dataset.filter;button.classList.toggle('active',id===filter);button.setAttribute('aria-selected',String(id===filter));button.querySelector('b').textContent=String(counts[id]||0)});
    const selected=groups[filter]||[],pages=Math.max(1,Math.ceil(selected.length/size));page=Math.min(Math.max(1,page),pages);
    const visible=new Set(selected.slice((page-1)*size,page*size));
    [...data.lessons,...data.rights,...data.history].forEach(row=>row.hidden=!visible.has(row));
    const visibleLessons=data.lessons.some(row=>visible.has(row)),visibleRights=data.rights.some(row=>visible.has(row)),visibleHistory=data.history.some(row=>visible.has(row));
    data.lessonsPanel.hidden=!visibleLessons;data.rightsPanel.hidden=!visibleRights;data.historyPanel.hidden=!visibleHistory;data.columns.hidden=!(visibleLessons||visibleRights);
    root.dataset.makeupTab=filter;
    ui.empty.hidden=selected.length>0;ui.footer.hidden=selected.length===0;
    ui.footer.querySelector('strong').textContent=page+' / '+pages;
    ui.footer.querySelector('[data-page="prev"]').disabled=page<=1;
    ui.footer.querySelector('[data-page="next"]').disabled=page>=pages;
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.pire-makeup-tabs button[data-filter]');
    if(!button)return;
    event.preventDefault();event.stopPropagation();
    filter=button.dataset.filter;page=1;sessionStorage.setItem(FILTER_KEY,filter);
    const root=document.querySelector('.makeups-page');if(root)render(root);
  },true);
  function enhance(){const root=document.querySelector('.makeups-page');if(root)render(root)}
  let queued=false;function scan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
  scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
