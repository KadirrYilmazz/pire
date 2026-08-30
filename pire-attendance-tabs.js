/* Pİ-RE yoklama alt sekmeleri ve sayfalama */
(()=>{
  const FILTER_KEY='pire-attendance-filter-v1',SIZE_KEY='pire-attendance-page-size-v1';
  const labels={pending:'Bekleyen',completed:'Tamamlanan',absence:'Devamsızlıklar',all:'Tüm Dersler'};
  let filter=sessionStorage.getItem(FILTER_KEY)||'pending',page=1,size=Number(sessionStorage.getItem(SIZE_KEY)||5);
  if(!labels[filter])filter='pending';if(![5,10,20].includes(size))size=5;

  function rows(root){return [...root.querySelectorAll('.attendance-lesson-row[data-attendance-state]')]}
  function build(root){
    const list=root.querySelector('.attendance-list'),title=list?.querySelector('.panel-title');if(!list||!title)return null;
    let controls=root.querySelector('.pire-attendance-controls');
    if(!controls){
      controls=document.createElement('div');controls.className='pire-attendance-controls';
      const tabs=document.createElement('div');tabs.className='pire-attendance-tabs';tabs.setAttribute('role','tablist');
      Object.entries(labels).forEach(([id,label])=>{const button=document.createElement('button');button.type='button';button.dataset.filter=id;button.setAttribute('role','tab');button.innerHTML='<span>'+label+'</span><b>0</b>';button.addEventListener('click',()=>{filter=id;page=1;sessionStorage.setItem(FILTER_KEY,filter);render(root)});tabs.appendChild(button)});
      controls.appendChild(tabs);
    }
    if(controls.parentElement!==root)root.prepend(controls);
    let footer=list.querySelector('.pire-attendance-pagination');
    if(!footer){
      footer=document.createElement('div');footer.className='pire-attendance-pagination';
      footer.innerHTML='<label>Göster <select aria-label="Sayfadaki yoklama sayısı"><option>5</option><option>10</option><option>20</option></select></label><button type="button" data-page="prev">← Önceki</button><strong aria-live="polite">1 / 1</strong><button type="button" data-page="next">Sonraki →</button>';
      footer.querySelector('select').value=String(size);
      footer.querySelector('select').addEventListener('change',event=>{size=Number(event.target.value);page=1;sessionStorage.setItem(SIZE_KEY,String(size));render(root)});
      footer.querySelector('[data-page="prev"]').addEventListener('click',()=>{if(page>1){page--;render(root)}});
      footer.querySelector('[data-page="next"]').addEventListener('click',()=>{page++;render(root)});
      list.appendChild(footer);
    }
    let empty=list.querySelector('.pire-attendance-empty');
    if(!empty){empty=document.createElement('div');empty.className='pire-attendance-empty';empty.textContent='Bu bölümde gösterilecek ders bulunmuyor.';footer.before(empty)}
    return{controls,footer,empty};
  }
  function render(root){
    const ui=build(root);if(!ui)return;
    const all=rows(root),counts={pending:0,completed:0,absence:0,all:all.length};
    all.forEach(row=>{const state=row.dataset.attendanceState;if(counts[state]!=null)counts[state]++});
    ui.controls.querySelectorAll('[data-filter]').forEach(button=>{const id=button.dataset.filter;button.classList.toggle('active',id===filter);button.setAttribute('aria-selected',String(id===filter));button.querySelector('b').textContent=String(counts[id]||0)});
    const selected=filter==='all'?all:all.filter(row=>row.dataset.attendanceState===filter),pages=Math.max(1,Math.ceil(selected.length/size));page=Math.min(Math.max(1,page),pages);
    const visible=new Set(selected.slice((page-1)*size,page*size));all.forEach(row=>row.hidden=!visible.has(row));
    ui.empty.hidden=selected.length>0;ui.footer.hidden=selected.length===0;
    ui.footer.querySelector('strong').textContent=page+' / '+pages;
    ui.footer.querySelector('[data-page="prev"]').disabled=page<=1;
    ui.footer.querySelector('[data-page="next"]').disabled=page>=pages;
  }
  function enhance(){const root=document.querySelector('.attendance-page');if(root)render(root)}
  let queued=false;function scan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
  scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
