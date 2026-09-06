/* Pİ-RE öğrenci kayıt sihirbazı — React navigasyonu sırasında DOM taşımayı geciktirir. */
(()=>{
  const PENDING='__PIRE_STUDENT_WIZARD_PENDING__';
  let catalog={courses:[],teachers:[]},settings={rooms:['Derslik 1','Derslik 2','Müzik Stüdyosu']};

  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const value=(form,name)=>form.elements.namedItem(name)?.value||'';
  const checked=(form,name)=>!!form.elements.namedItem(name)?.checked;

  async function loadOptions(){
    try{
      const [c,s]=await Promise.all([fetch('/api/catalog'),fetch('/api/settings')]);
      if(c.ok)catalog=await c.json();
      if(s.ok){const data=await s.json();settings=data.settings||settings}
    }catch(_){}
  }

  function stepFields(form){return [...form.querySelectorAll('[data-wizard-step]')]}

  function showStep(form,index){
    const steps=stepFields(form),max=steps.length-1,next=Math.max(0,Math.min(index,max));
    form.dataset.wizardStep=String(next);
    steps.forEach((step,i)=>step.hidden=i!==next);
    form.querySelectorAll('.pire-wizard-progress button').forEach((button,i)=>{
      button.classList.toggle('active',i===next);button.classList.toggle('done',i<next);
      button.setAttribute('aria-current',i===next?'step':'false');
    });
    const back=form.querySelector('.pire-wizard-back'),forward=form.querySelector('.pire-wizard-next'),submit=form.querySelector(':scope > button.primary.wide');
    back.hidden=next===0;forward.hidden=next===max;submit.hidden=next!==max;
    if(next===max){renderSummary(form);renderMissing(form)}
    form.querySelector('[data-wizard-step]:not([hidden]) input, [data-wizard-step]:not([hidden]) select, [data-wizard-step]:not([hidden]) textarea')?.focus({preventScroll:true});
    form.scrollTo({top:0,behavior:'smooth'});
  }

  function fieldLabel(field){
    const label=field.closest('label');
    if(!label)return field.name||'Zorunlu alan';
    return [...label.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent.trim()).filter(Boolean).join(' ')||label.querySelector('strong')?.textContent||field.name;
  }

  function invalidFields(form){return [...form.querySelectorAll('input,select,textarea')].filter(field=>!field.disabled&&!field.checkValidity())}

  function renderMissing(form){
    const box=form.querySelector('.pire-wizard-missing'),invalid=invalidFields(form);
    if(!box)return invalid;
    if(!invalid.length){box.hidden=true;box.innerHTML='';return invalid}
    const names=[...new Set(invalid.map(fieldLabel))];
    box.hidden=false;
    box.innerHTML='<strong>Eksik zorunlu alanlar</strong><p>'+names.map(esc).join(' · ')+'</p><small>Kaydı tamamlamadan önce bu alanları doldurmalısınız.</small>';
    return invalid;
  }

  function syncOptionalFields(form){
    const lesson=checked(form,'wizardCreateLesson'),pkg=checked(form,'wizardCreatePackage');
    form.querySelector('.pire-wizard-lesson-fields').hidden=!lesson;
    form.querySelector('.pire-wizard-package-fields').hidden=!pkg;
    form.querySelectorAll('.pire-wizard-lesson-fields [data-required]').forEach(x=>x.required=lesson);
    form.querySelectorAll('.pire-wizard-package-fields [data-required]').forEach(x=>x.required=pkg);
  }

  function renderSummary(form){
    const rows=[
      ['Öğrenci',value(form,'name')],
      ['Veli',value(form,'guardianName')+' · '+value(form,'guardianRelation')],
      ['Ders',value(form,'wizardCourse')],
      ['Eğitmen',checked(form,'wizardCreateLesson')?value(form,'wizardTeacher'):'İlk ders oluşturulmayacak'],
      ['Program',checked(form,'wizardCreateLesson')?value(form,'wizardLessonDate')+' · '+value(form,'wizardStartTime'):'Daha sonra planlanacak'],
      ['Paket',checked(form,'wizardCreatePackage')?value(form,'wizardTotalLessons')+' ders hakkı':'Paket daha sonra tanımlanacak']
    ];
    form.querySelector('.pire-wizard-summary').innerHTML=rows.map(([a,b])=>'<div><span>'+esc(a)+'</span><strong>'+esc(b||'Belirtilmedi')+'</strong></div>').join('');
  }

  function buildEducationStep(form){
    const section=document.createElement('section');section.dataset.wizardStep='2';section.hidden=true;
    const seenCourses=new Set();
    const courses=(catalog.courses||[]).filter(x=>{
      const key=String(x?.name||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR');
      if(!key||seenCourses.has(key))return false;
      seenCourses.add(key);return true;
    }).map(x=>'<option value="'+esc(x.name)+'">'+esc(x.name)+'</option>').join('');
    const teachers=(catalog.teachers||[]).filter(x=>x.status!=='Ayrılmış').map(x=>'<option value="'+esc(x.name)+'">'+esc(x.name)+'</option>').join('');
    const rooms=(settings.rooms||[]).map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
    const today=new Date().toISOString().slice(0,10);
    section.innerHTML=`
      <h3>Eğitim planı</h3>
      <p class="pire-wizard-lead">Ders, eğitmen, ilk program ve paket bilgilerini tek kayıtta bağlayın.</p>
      <label>Ders / branş<select name="wizardCourse" required><option value="">Ders seçin</option>${courses}</select></label>
      <div class="pire-wizard-choice-grid">
        <label class="pire-wizard-choice"><input type="checkbox" name="wizardCreateLesson"><span><strong>İlk dersi oluştur</strong><small>Öğrenciyi eğitmen ve takvime bağlar.</small></span></label>
        <label class="pire-wizard-choice"><input type="checkbox" name="wizardCreatePackage"><span><strong>Paket tanımla</strong><small>Toplam ve kalan ders hakkını oluşturur.</small></span></label>
      </div>
      <div class="pire-wizard-lesson-fields" hidden>
        <div class="form-row"><label>Eğitmen<select name="wizardTeacher" data-required><option value="">Eğitmen seçin</option>${teachers}</select></label><label>Derslik / stüdyo<select name="wizardRoom" data-required><option value="">Derslik seçin</option>${rooms}</select></label></div>
        <div class="form-row"><label>İlk ders tarihi<input name="wizardLessonDate" type="date" min="${today}" data-required></label><label>Başlangıç<input name="wizardStartTime" type="time" data-required></label></div>
        <div class="form-row"><label>Bitiş<input name="wizardEndTime" type="time" data-required></label><label>Tekrar düzeni<select name="wizardRecurrence"><option>Tek seferlik</option><option>Her hafta</option><option>İki haftada bir</option></select></label></div>
      </div>
      <div class="pire-wizard-package-fields" hidden>
        <div class="form-row"><label>Toplam ders hakkı<select name="wizardTotalLessons" data-required><option value="">Hak seçin</option><option>4</option><option>8</option><option>12</option><option>16</option><option>24</option></select></label><label>Paket başlangıcı<input name="wizardPackageStart" type="date" value="${today}" data-required></label></div>
        <label>Paket bitişi<input name="wizardPackageEnd" type="date" data-required></label>
      </div>`;
    section.addEventListener('change',()=>syncOptionalFields(form));
    return section;
  }

  function enhance(form){
    if(form.dataset.pireWizardReady)return;
    form.dataset.pireWizardReady='1';form.classList.add('pire-student-wizard');

    const children=[...form.children],student=document.createElement('section'),guardian=document.createElement('section'),review=document.createElement('section');
    student.dataset.wizardStep='0';guardian.dataset.wizardStep='1';review.dataset.wizardStep='3';review.hidden=true;
    const guardianHeading=children.find(x=>x.tagName==='H3'&&/Veli bilgileri/i.test(x.textContent));
    const privacy=children.find(x=>x.classList?.contains('privacy-note'));
    const submit=children.find(x=>x.matches?.('button.primary.wide'));
    let inGuardian=false;
    for(const node of children){
      if(node===guardianHeading)inGuardian=true;
      if(node===submit||node.classList?.contains('close')||node.classList?.contains('student-form-title'))continue;
      (inGuardian?guardian:student).appendChild(node);
      if(node===privacy)inGuardian=false;
    }
    review.innerHTML='<h3>Son kontrol</h3><p class="pire-wizard-lead">Henüz hiçbir kayıt oluşturulmadı. Bilgileri kontrol edip işlemi tamamlayın.</p><div class="pire-wizard-missing" role="alert" hidden></div><div class="pire-wizard-summary"></div><div class="privacy-note">Kaydı tamamladığınızda seçiminize göre öğrenci, ilk ders ve paket birbirine bağlı olarak oluşturulur.</div>';
    const progress=document.createElement('nav');progress.className='pire-wizard-progress';progress.setAttribute('aria-label','Kayıt adımları');
    ['Öğrenci','Veli','Eğitim','Onay'].forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.innerHTML='<i>'+(i+1)+'</i><span>'+name+'</span>';b.onclick=()=>showStep(form,i);progress.appendChild(b)});
    const actions=document.createElement('div');actions.className='pire-wizard-actions';
    actions.innerHTML='<button type="button" class="pire-wizard-back">← Geri</button><button type="button" class="pire-wizard-next">Devam et →</button>';
    form.querySelector('.student-form-title').after(progress);
    submit.before(student,guardian,buildEducationStep(form),review,actions);
    submit.textContent='Kaydı tamamla';submit.classList.add('pire-wizard-submit');
    actions.querySelector('.pire-wizard-back').onclick=()=>showStep(form,Number(form.dataset.wizardStep||0)-1);
    actions.querySelector('.pire-wizard-next').onclick=()=>showStep(form,Number(form.dataset.wizardStep||0)+1);
    form.noValidate=true;
    form.addEventListener('submit',event=>{
      if(Number(form.dataset.wizardStep)!==3){event.preventDefault();event.stopImmediatePropagation();showStep(form,Number(form.dataset.wizardStep||0)+1);return}
      const invalid=renderMissing(form);
      if(invalid.length){
        event.preventDefault();event.stopImmediatePropagation();
        const first=invalid[0],section=first.closest('[data-wizard-step]'),index=Number(section?.dataset.wizardStep||0);
        alert('Eksik zorunlu alanlar var. İlk eksik alanın bulunduğu bölüme yönlendiriliyorsunuz.');
        showStep(form,index);
        setTimeout(()=>{first.focus();first.reportValidity()},0);
        return;
      }
      window[PENDING]={
        course:value(form,'wizardCourse'),createLesson:checked(form,'wizardCreateLesson'),createPackage:checked(form,'wizardCreatePackage'),
        teacher:value(form,'wizardTeacher'),room:value(form,'wizardRoom'),lessonDate:value(form,'wizardLessonDate'),startTime:value(form,'wizardStartTime'),endTime:value(form,'wizardEndTime'),recurrence:value(form,'wizardRecurrence'),
        totalLessons:value(form,'wizardTotalLessons'),packageStart:value(form,'wizardPackageStart'),packageEnd:value(form,'wizardPackageEnd')
      };
      submit.disabled=true;submit.textContent='Kayıtlar bağlanıyor…';
    },true);
    showStep(form,0);
  }

  const baseFetch=window.fetch.bind(window);
  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:input?.url||'',method=String(init?.method||'GET').toUpperCase();
    if(!url.includes('/api/students')||method!=='POST'||!window[PENDING])return baseFetch(input,init);
    const plan=window[PENDING];delete window[PENDING];
    const studentResponse=await baseFetch(input,init);
    if(!studentResponse.ok)return studentResponse;
    const studentData=await studentResponse.clone().json().catch(()=>({})),student=studentData.student;
    if(!student?.id)return new Response(JSON.stringify({error:'Öğrenci kimliği alınamadı'}),{status:500,headers:{'content-type':'application/json'}});
    let lessonId=null;
    try{
      if(plan.createLesson){
        const lessonRes=await baseFetch('/api/lessons',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({course:plan.course,lessonType:'Birebir ders',studentIds:[String(student.id)],teacher:plan.teacher,lessonDate:plan.lessonDate,startTime:plan.startTime,endTime:plan.endTime,room:plan.room,recurrence:plan.recurrence,pricingType:plan.createPackage?'Ders paketi':'Ders başına',status:'Planlandı'})});
        const lesson=await lessonRes.json();if(!lessonRes.ok)throw new Error(lesson.error||'İlk ders oluşturulamadı');lessonId=lesson.lesson?.id;
      }
      if(plan.createPackage){
        const packageRes=await baseFetch('/api/packages',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({studentId:student.id,course:plan.course,totalLessons:Number(plan.totalLessons),startDate:plan.packageStart,endDate:plan.packageEnd,makeupRights:0,frozenLessons:0})});
        const pkg=await packageRes.json();if(!packageRes.ok)throw new Error(pkg.error||'Paket oluşturulamadı');
      }
      return studentResponse;
    }catch(error){
      if(lessonId)await baseFetch('/api/lessons',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({lessonId})}).catch(()=>{});
      await baseFetch('/api/students',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({studentId:student.id,permanent:true})}).catch(()=>{});
      return new Response(JSON.stringify({error:error.message+'; yarım kayıt geri alındı.'}),{status:400,headers:{'content-type':'application/json'}});
    }
  };

  let scanFrame=0;
  function scan(){
    scanFrame=0;
    document.querySelectorAll('form.student-form').forEach(enhance);
  }
  function scheduleScan(){
    if(scanFrame)return;
    scanFrame=requestAnimationFrame(()=>{
      scanFrame=requestAnimationFrame(scan);
    });
  }
  loadOptions().finally(scheduleScan);
  new MutationObserver(scheduleScan).observe(document.documentElement,{childList:true,subtree:true});
})();

;(()=>{
  if(document.querySelector('script[data-pire-form-wizards]'))return;
  const script=document.createElement('script');
  script.src='/pire-form-wizards.js';
  script.defer=true;
  script.dataset.pireFormWizards='true';
  document.head.appendChild(script);
})();

;(()=>{
  if(!document.querySelector('link[data-pire-customer-archive]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='/pire-customer-archive.css';link.dataset.pireCustomerArchive='true';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-pire-customer-archive]')){
    const script=document.createElement('script');script.src='/pire-customer-archive.js';script.defer=true;script.dataset.pireCustomerArchive='true';document.head.appendChild(script);
  }
})();

;(()=>{
  if(!document.querySelector('link[data-pire-finance-menu]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='/pire-finance-menu.css';link.dataset.pireFinanceMenu='true';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-pire-finance-menu]')){
    const script=document.createElement('script');script.src='/pire-finance-menu.js';script.defer=true;script.dataset.pireFinanceMenu='true';document.head.appendChild(script);
  }
})();
