/* Pİ-RE geri alınabilir çok adımlı formlar: ders, eğitmen, müşteri */
(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labelOf=field=>{const label=field.closest('label');return label?.querySelector(':scope > span')?.textContent?.trim()||[...(label?.childNodes||[])].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent.trim()).filter(Boolean).join(' ')||field.name||'Zorunlu alan'};
  const fieldValue=(form,name)=>{const item=form.elements.namedItem(name);if(!item)return'';if(item instanceof RadioNodeList)return item.value||'';return item.value||''};

  function createProgress(names){
    const nav=document.createElement('nav');nav.className='pire-wizard-progress pire-shared-progress';nav.setAttribute('aria-label','Form adımları');
    names.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.innerHTML='<i>'+(i+1)+'</i><span>'+esc(name)+'</span>';b.dataset.step=String(i);nav.appendChild(b)});
    return nav;
  }

  function missingFields(form,extraValidate){
    if(extraValidate)extraValidate(form);
    return [...form.querySelectorAll('input,select,textarea')].filter(x=>!x.disabled&&!x.checkValidity());
  }

  function summaryHtml(form,rows){
    return rows.map(([label,name,format])=>{let v=fieldValue(form,name);if(format)v=format(v,form);return '<div><span>'+esc(label)+'</span><strong>'+esc(v||'Belirtilmedi')+'</strong></div>'}).join('');
  }

  function activate(form,index){
    const panels=[...form.querySelectorAll(':scope > [data-shared-step]')],last=panels.length-1,next=Math.max(0,Math.min(index,last));
    form.dataset.sharedStep=String(next);panels.forEach((p,i)=>p.hidden=i!==next);
    form.querySelectorAll(':scope > .pire-wizard-progress button').forEach((b,i)=>{b.classList.toggle('active',i===next);b.classList.toggle('done',i<next);b.setAttribute('aria-current',i===next?'step':'false')});
    const nav=form.querySelector(':scope > .pire-shared-actions'),original=form.querySelector(':scope > [data-shared-original-actions]');
    nav.querySelector('.pire-shared-back').hidden=next===0;nav.querySelector('.pire-shared-next').hidden=next===last;original.hidden=next!==last;
    if(next===last){
      const cfg=form.__pireWizardConfig;
      form.querySelector('.pire-wizard-summary').innerHTML=summaryHtml(form,cfg.summary);
      const invalid=missingFields(form,cfg.extraValidate),box=form.querySelector('.pire-wizard-missing');
      if(invalid.length){box.hidden=false;box.innerHTML='<strong>Eksik zorunlu alanlar</strong><p>'+[...new Set(invalid.map(labelOf))].map(esc).join(' · ')+'</p><small>Kaydı tamamlamadan önce bu alanları doldurmalısınız.</small>'}else{box.hidden=true;box.innerHTML=''}
    }
    form.querySelector(':scope > [data-shared-step]:not([hidden]) input, :scope > [data-shared-step]:not([hidden]) select, :scope > [data-shared-step]:not([hidden]) textarea')?.focus({preventScroll:true});
    form.scrollTo?.({top:0,behavior:'smooth'});
  }

  function install(form,cfg,panels,originalActions,insertAfter){
    if(form.dataset.pireSharedWizard)return;
    form.dataset.pireSharedWizard='1';form.classList.add('pire-student-wizard','pire-shared-wizard');form.noValidate=true;form.__pireWizardConfig=cfg;
    panels.forEach((panel,i)=>{panel.dataset.sharedStep=String(i);panel.hidden=i!==0;form.insertBefore(panel,originalActions)});
    const review=document.createElement('section');review.dataset.sharedStep=String(panels.length);review.hidden=true;review.innerHTML='<h3>Son kontrol</h3><p class="pire-wizard-lead">Henüz hiçbir kayıt oluşturulmadı. Bilgileri kontrol edip işlemi tamamlayın.</p><div class="pire-wizard-missing" role="alert" hidden></div><div class="pire-wizard-summary"></div><div class="privacy-note">Zorunlu alanların tamamı doldurulmadan kayıt oluşturulmaz.</div>';form.insertBefore(review,originalActions);
    originalActions.dataset.sharedOriginalActions='1';
    const progress=createProgress([...cfg.steps,'Onay']);insertAfter.after(progress);
    const actions=document.createElement('div');actions.className='pire-wizard-actions pire-shared-actions';actions.innerHTML='<button type="button" class="pire-shared-back">← Geri</button><button type="button" class="pire-shared-next pire-wizard-next">Devam et →</button>';form.insertBefore(actions,originalActions);
    progress.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>activate(form,i));
    actions.querySelector('.pire-shared-back').onclick=()=>activate(form,Number(form.dataset.sharedStep||0)-1);
    actions.querySelector('.pire-shared-next').onclick=()=>activate(form,Number(form.dataset.sharedStep||0)+1);
    form.addEventListener('submit',event=>{
      const last=panels.length,current=Number(form.dataset.sharedStep||0);
      if(current!==last){event.preventDefault();event.stopImmediatePropagation();activate(form,current+1);return}
      const invalid=missingFields(form,cfg.extraValidate);
      if(!invalid.length)return;
      event.preventDefault();event.stopImmediatePropagation();
      const first=invalid[0],panel=first.closest('[data-shared-step]');
      alert('Eksik zorunlu alanlar var. İlk eksik alanın bulunduğu bölüme yönlendiriliyorsunuz.');
      activate(form,Number(panel?.dataset.sharedStep||0));setTimeout(()=>{first.focus();first.reportValidity()},0);
    },true);
    activate(form,0);
  }

  const section=(title,nodes)=>{const s=document.createElement('section');s.innerHTML='<h3>'+esc(title)+'</h3>';nodes.forEach(n=>s.appendChild(n));return s};

  function enhanceLessonStudentPicker(fieldset){
    if(!fieldset||fieldset.dataset.pireStudentSearch)return;
    fieldset.dataset.pireStudentSearch='1';
    const list=fieldset.querySelector(':scope > div');if(!list)return;
    const labels=[...list.querySelectorAll(':scope > label')];
    labels.forEach(label=>{
      const input=label.querySelector('input[name="studentIds"]'),copy=label.querySelector('span');
      if(!input||!copy)return;
      const id='ÖĞ-'+String(input.value).padStart(4,'0');
      label.dataset.studentSearch=((copy.textContent||'')+' '+id+' '+input.value).toLocaleLowerCase('tr-TR');
      if(!copy.querySelector('.pire-student-id')){
        const badge=document.createElement('em');badge.className='pire-student-id';badge.textContent=id;copy.appendChild(badge);
      }
    });
    const search=document.createElement('label');search.className='pire-lesson-student-search';
    search.innerHTML='<span aria-hidden="true">⌕</span><input type="search" placeholder="Öğrenci adı, soyadı veya ID ara…" aria-label="Ders için öğrenci ara"><b></b>';
    const input=search.querySelector('input'),counter=search.querySelector('b');
    const empty=document.createElement('div');empty.className='pire-student-search-empty';empty.textContent='Aramanızla eşleşen öğrenci bulunamadı.';empty.hidden=true;
    function filter(){
      const query=input.value.trim().toLocaleLowerCase('tr-TR');let visible=0;
      labels.forEach(label=>{const show=!query||label.dataset.studentSearch.includes(query);label.hidden=!show;if(show)visible++});
      counter.textContent=query?visible+' sonuç':labels.length+' öğrenci';empty.hidden=visible!==0;
    }
    input.addEventListener('input',filter);
    fieldset.querySelector('legend')?.after(search);list.after(empty);filter();
  }

  function enhanceLesson(form){
    if(form.dataset.pireSharedWizard)return;
    const head=form.querySelector('.lesson-form-head'),actions=form.querySelector(':scope > .lesson-form-actions');if(!head||!actions)return;
    const direct=[...form.children],byName=name=>direct.find(n=>n.querySelector?.('[name="'+name+'"]'));
    const conflict=form.querySelector(':scope > .conflict-alert'),course=byName('course'),students=form.querySelector(':scope > .student-picker'),teacher=byName('teacher'),date=byName('lessonDate'),repeat=byName('recurrence'),pricing=byName('pricingType'),status=byName('status'),hint=form.querySelector(':scope > .form-hint');
    enhanceLessonStudentPicker(students);
    const used=new Set([conflict,course,students,teacher,date,repeat,pricing,status,hint,head,actions,form.querySelector(':scope > .close')].filter(Boolean));
    const leftovers=direct.filter(n=>!used.has(n));
    const panels=[
      section('Ders bilgileri',[conflict,course].filter(Boolean)),
      section('Katılımcılar',[students,teacher].filter(Boolean)),
      section('Program ve ücretlendirme',[date,repeat,pricing,status,hint,...leftovers].filter(Boolean))
    ];
    install(form,{steps:['Ders','Katılımcılar','Program'],summary:[['Ders','course'],['Ders türü','lessonType'],['Eğitmen','teacher'],['Tarih','lessonDate'],['Saat','startTime',(_,f)=>fieldValue(f,'startTime')+'–'+fieldValue(f,'endTime')],['Ücretlendirme','pricingType']],extraValidate:f=>{const checks=[...f.querySelectorAll('input[name="studentIds"]')];if(checks[0])checks[0].setCustomValidity(checks.some(x=>x.checked)?'':'En az bir öğrenci seçmelisiniz.')}},panels,actions,head);
  }

  function enhanceTeacher(form){
    if(form.dataset.pireSharedWizard)return;
    const title=form.querySelector(':scope > h2'),submit=[...form.children].find(n=>n.matches?.('button.primary.wide.catalog-save.teacher'));if(!title||!submit)return;
    const nodes=[...form.children],heads=nodes.filter(n=>n.matches?.('h3.form-section-title'));if(heads.length<3)return;
    const buckets=[[],[],[]];let current=-1;
    for(const node of nodes){const idx=heads.indexOf(node);if(idx>=0){current=idx;continue}if(current>=0&&node!==submit)buckets[Math.min(current,2)].push(node)}
    const panels=[section('Kişisel ve iletişim bilgileri',buckets[0]),section('Dersler ve çalışma düzeni',buckets[1]),section('Ücretlendirme ve ödeme',buckets[2])];
    const actions=document.createElement('div');actions.className='pire-shared-original-single';submit.before(actions);actions.appendChild(submit);
    install(form,{steps:['Kişisel','Dersler','Ücret'],summary:[['Eğitmen','name'],['Telefon','phone'],['Durum','status'],['Çalışma düzeni','availability'],['Ücretlendirme','compensationType'],['Ücret / oran','compensationAmount']]},panels,actions,title);
  }

  function enhanceCustomer(form){
    if(form.dataset.pireSharedWizard)return;
    const title=form.querySelector(':scope > h2'),grid=form.querySelector(':scope > .safe-customer-form-grid'),actions=form.querySelector(':scope > .safe-form-actions');if(!title||!grid||!actions)return;
    const take=names=>names.map(name=>grid.querySelector('[name="'+name+'"]')?.closest('label')).filter(Boolean);
    const panels=[section('Müşteri bilgileri',take(['name','phone','type'])),section('İş ve planlama',take(['project','date','budget'])),section('Durum ve notlar',take(['status','notes']))];
    grid.remove();
    install(form,{steps:['Müşteri','İş','Detay'],summary:[['Müşteri','name'],['Telefon','phone'],['Hizmet','type'],['Talep / Proje','project'],['Planlanan tarih','date'],['Tahmini bütçe','budget',v=>v?'₺'+Number(v).toLocaleString('tr-TR'):''],['Durum','status']]},panels,actions,title);
  }

  function scan(){
    document.querySelectorAll('form.lesson-form').forEach(enhanceLesson);
    document.querySelectorAll('form.teacher-form').forEach(enhanceTeacher);
    document.querySelectorAll('form.safe-customer-form').forEach(enhanceCustomer);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
