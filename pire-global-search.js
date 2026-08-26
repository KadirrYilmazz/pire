/* Pİ-RE rol duyarlı genel arama — mevcut React filtrelerini koruyarak görünür sonuç ve güvenli modül geçişi ekler. */
(()=>{
  const boundInputs=new WeakSet();
  let queued=false;

  const normalize=value=>String(value??'')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/ı/g,'i');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const getData=()=>{try{return window.__PIRE_RECOVERED_BACKEND__?.exportData?.()||{}}catch(_){return {}}};
  const rows=(data,section,key)=>Array.isArray(data?.[section]?.[key])?data[section][key]:[];
  const studentName=(students,id)=>students.find(item=>String(item.id)===String(id))?.name||'Öğrenci';
  const studentNames=(students,value)=>{
    let ids=[];
    try{ids=Array.isArray(value)?value:JSON.parse(value||'[]')}catch(_){ids=[]}
    return ids.map(id=>studentName(students,id)).join(', ');
  };

  function findNavButton(labels){
    const wanted=labels.map(normalize);
    return [...document.querySelectorAll('.primary-nav button')].find(button=>wanted.includes(normalize(button.textContent.trim())))||null;
  }
  const canOpen=labels=>Boolean(findNavButton(labels));

  function buildResults(query){
    const needle=normalize(query).trim();
    if(needle.length<2)return [];
    const data=getData();
    const students=rows(data,'students','students');
    const teachers=rows(data,'catalog','teachers');
    const lessons=rows(data,'lessons','lessons');
    const payments=rows(data,'students','payments');
    const makeups=rows(data,'makeups','rights');
    const includes=(...values)=>normalize(values.join(' ')).includes(needle);
    const groups=[];

    if(canOpen(['Öğrenciler','Students']))groups.push({key:'students',title:'Öğrenciler',labels:['Öğrenciler','Students'],items:students.filter(item=>includes(item.name,item.course,item.teacher,item.phone,item.guardianName,item.guardianPhone,item.status)).slice(0,4).map(item=>({title:item.name,detail:[item.course,item.teacher,item.status].filter(Boolean).join(' · '),search:item.name}))});
    if(canOpen(['Eğitmenler','Instructors']))groups.push({key:'teachers',title:'Eğitmenler',labels:['Eğitmenler','Instructors'],items:teachers.filter(item=>includes(item.name,item.courses,item.phone,item.status)).slice(0,4).map(item=>({title:item.name,detail:[String(item.courses||'').replace(/[\[\]"]/g,' '),item.status].filter(Boolean).join(' · '),search:item.name}))});
    if(canOpen(['Takvim','Calendar']))groups.push({key:'lessons',title:'Dersler',labels:['Takvim','Calendar'],items:lessons.filter(item=>includes(item.course,item.teacher,item.room,item.lessonType,item.status,item.notes,studentNames(students,item.studentIds))).slice(0,4).map(item=>({title:`${item.course||'Ders'} · ${studentNames(students,item.studentIds)}`,detail:[item.lessonDate,item.startTime,item.teacher,item.room].filter(Boolean).join(' · '),search:studentNames(students,item.studentIds)||item.course}))});
    if(canOpen(['Ödemeler','Ödeme Takibi','Payments','Payment Tracking']))groups.push({key:'payments',title:'Ödemeler',labels:['Ödemeler','Ödeme Takibi','Payments','Payment Tracking'],items:payments.filter(item=>{const student=students.find(row=>String(row.id)===String(item.studentId));return includes(student?.name,student?.course,item.month,item.status,item.amount)}).slice(0,4).map(item=>({title:studentName(students,item.studentId),detail:[item.month,item.status,item.amount?`${Number(item.amount).toLocaleString('tr-TR')} ₺`:null].filter(Boolean).join(' · '),search:studentName(students,item.studentId)}))});
    if(canOpen(['Telafiler','Make-up Lessons']))groups.push({key:'makeups',title:'Telafiler',labels:['Telafiler','Make-up Lessons'],items:makeups.filter(item=>includes(studentName(students,item.studentId),item.reason,item.status,item.expiresAt)).slice(0,4).map(item=>({title:studentName(students,item.studentId),detail:[item.status,item.reason,item.expiresAt].filter(Boolean).join(' · '),search:studentName(students,item.studentId)}))});
    return groups.filter(group=>group.items.length);
  }

  function setReactInput(input,value){
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(setter)setter.call(input,value);else input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function openResult(group,item,panel){
    panel.hidden=true;
    const button=findNavButton(group.labels);
    if(!button)return;
    button.click();
    if(group.key==='students')setTimeout(()=>{
      const local=document.querySelector('input[placeholder="Öğrenci ara…"]');
      if(local)setReactInput(local,item.search);
    },120);
  }

  function render(searchBox,input){
    let panel=searchBox.querySelector(':scope > .pire-global-search-results');
    if(!panel){
      panel=document.createElement('section');
      panel.className='pire-global-search-results';
      panel.setAttribute('aria-label','Genel arama sonuçları');
      searchBox.appendChild(panel);
    }
    const query=input.value.trim();
    if(query.length<2){panel.hidden=true;panel.innerHTML='';return}
    const groups=buildResults(query);
    panel.innerHTML=groups.length?groups.map(group=>`<div class="pire-search-group"><h4>${esc(group.title)}</h4>${group.items.map((item,index)=>`<button type="button" data-group="${esc(group.key)}" data-index="${index}"><span><b>${esc(item.title)}</b><small>${esc(item.detail)}</small></span><i aria-hidden="true">→</i></button>`).join('')}</div>`).join(''):`<div class="pire-search-empty"><b>Sonuç bulunamadı</b><small>“${esc(query)}” için eşleşen kayıt yok.</small></div>`;
    panel.hidden=false;
    panel.querySelectorAll('button[data-group]').forEach(button=>button.addEventListener('mousedown',event=>event.preventDefault()));
    panel.querySelectorAll('button[data-group]').forEach(button=>button.addEventListener('click',()=>{
      const group=groups.find(row=>row.key===button.dataset.group),item=group?.items[Number(button.dataset.index)];
      if(group&&item)openResult(group,item,panel);
    }));
  }

  function bind(){
    document.querySelectorAll('.navbar-search').forEach(searchBox=>{
      const input=searchBox.querySelector('input[aria-label="Genel arama"], input[aria-label="Global search"]');
      if(!input||boundInputs.has(input))return;
      boundInputs.add(input);
      input.setAttribute('autocomplete','off');
      input.setAttribute('aria-haspopup','listbox');
      input.addEventListener('input',()=>requestAnimationFrame(()=>render(searchBox,input)));
      input.addEventListener('focus',()=>{if(input.value.trim().length>=2)render(searchBox,input)});
      input.addEventListener('keydown',event=>{
        const panel=searchBox.querySelector('.pire-global-search-results');
        if(event.key==='Escape'&&panel){panel.hidden=true;input.blur()}
        if(event.key==='ArrowDown'&&panel&&!panel.hidden){event.preventDefault();panel.querySelector('button')?.focus()}
      });
    });
  }
  document.addEventListener('click',event=>document.querySelectorAll('.pire-global-search-results').forEach(panel=>{if(!panel.parentElement?.contains(event.target))panel.hidden=true}));
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;bind()})};
  const boot=()=>{queue();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true})};
  window.__PIRE_GLOBAL_SEARCH_TEST__={normalize,buildResults};
  const mount=()=>setTimeout(boot,0);
  if(document.readyState==='complete')mount();
  else if(typeof window.addEventListener==='function')window.addEventListener('load',mount,{once:true});
  else mount();
})();
