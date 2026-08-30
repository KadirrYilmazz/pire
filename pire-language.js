/* Pİ-RE site geneli Türkçe / İngilizce arayüz seçimi. */
(()=>{
  const STORAGE_KEY='pire-interface-language';
  const ATTRIBUTE_NAMES=['placeholder','title','aria-label'];
  const translations=new Map(Object.entries({
    'Ana Sayfa':'Home','Genel Bakış':'Overview','Müşteriler':'Customers','Öğrenciler':'Students',
    'Eğitmenler':'Instructors','Finans':'Finance','Dersler':'Lessons','Raporlar':'Reports',
    'Kullanıcılar':'Users','Sistem Sağlığı':'System Health','Ayarlar':'Settings','İletişim':'Contact',
    'Akademik Koçluk':'Academic Coaching','Enstrüman Eğitimi':'Instrument Training',
    'Prodüktörlük ve Stüdyo Kaydı':'Production & Studio Recording','Organizasyon':'Events',
    'Giriş Yap':'Sign In','Çıkış Yap':'Sign Out','Görünüm önizle':'Preview View','Yönetici':'Administrator',
    'Ziyaretçi':'Visitor','Eğitmen':'Instructor','Öğrenci':'Student','Veli':'Parent','Müşteri':'Customer',
    'Ara…':'Search…','Ara...':'Search...','Genel arama':'Global search','Aramayı temizle':'Clear search',
    'Filtreler':'Filters','Bildirimler':'Notifications','Akıllı uyarılar':'Smart Alerts',
    'Tümünü okundu yap':'Mark All as Read','Size özel bildirimler':'Your Notifications',
    'Uygulama içi':'In-app','Hesaba bağlı':'Account linked','Salt okunur':'Read-only',
    'Yeni':'New','Kaydet':'Save','İptal':'Cancel','Kapat':'Close','Sil':'Delete','Düzenle':'Edit',
    'Ekle':'Add','Güncelle':'Update','Detay':'Details','İncele':'Review','Aç':'Open','Tamamla':'Complete',
    'Geri':'Back','İleri':'Next','Bugün':'Today','Önceki ay':'Previous month','Sonraki ay':'Next month',
    'Takvim':'Calendar','Takvimde aç →':'Open in calendar →','Tam takvimde aç →':'Open full calendar →',
    'DERS PROGRAMI':'LESSON SCHEDULE','Pzt':'Mon','Sal':'Tue','Çar':'Wed','Per':'Thu','Cum':'Fri','Cmt':'Sat','Paz':'Sun',
    'Aktif öğrenci':'Active Students','Bu ay ders':'Lessons This Month','Katılım':'Attendance',
    'Bu ay tahsilat':'Collected This Month','Bu ay aramıza katıldı':'joined this month','yeni kayıt':'new registration',
    'ders bugün planlandı':'lessons scheduled today','Hedefin %24’i tamamlandı':'24% of target completed',
    'Öncelik sırasıyla':'BY PRIORITY','Paket süresi yaklaşıyor':'Package Expiring Soon',
    'Bekleyen tahsilatlar':'Pending Payments','Yoklama bekleyen dersler':'Lessons Awaiting Attendance',
    'Bugün ders planlanmamış':'No lessons scheduled today','Takvimden yeni bir ders oluşturabilirsiniz.':'You can create a new lesson from the calendar.',
    'Ders oluştur':'Create Lesson','ders planlandı':'lessons scheduled','Bu gün için ders planlanmamış':'No lessons scheduled for this day',
    'Ödemeler':'Payments','Giderler':'Expenses','Hakedişler':'Earnings','Ödeme Takibi':'Payment Tracking',
    'Gider Takibi':'Expense Tracking','Ders Paketleri':'Lesson Packages','Yoklama':'Attendance',
    'Telafiler':'Make-up Lessons','Ders Takvimi':'Lesson Calendar','Ders Listesi':'Lesson List',
    'Aktif':'Active','Pasif':'Inactive','Bekliyor':'Pending','Ödendi':'Paid','Kısmi':'Partial','Gecikmiş':'Overdue',
    'Kayıt dondurmuş':'Enrollment Frozen','Ayrılmış':'Left','Planlandı':'Scheduled','Katıldı':'Attended',
    'Ad Soyad':'Full Name','Telefon':'Phone','E-posta':'Email','Konu':'Subject','Mesaj':'Message',
    'Adres':'Address','Durum':'Status','Tarih':'Date','Tutar':'Amount','Açıklama':'Description',
    'Kategori':'Category','Branş':'Subject','Program':'Schedule','İş yükü':'Workload','Öğrenci sayısı':'Student Count',
    'Ders saati':'Lesson Hours','Kalan ders':'Remaining Lessons','Toplam ders':'Total Lessons',
    'Başlangıç':'Start','Bitiş':'End','Saat':'Time','Derslik':'Classroom','Aylık':'Monthly','Haftalık':'Weekly','Günlük':'Daily',
    'Aydınlık moda geç':'Switch to light mode','Karanlık moda geç':'Switch to dark mode',
    'Aydınlık mod':'Light mode','Karanlık mod':'Dark mode','Arka plan müziğini aç':'Turn on background music',
    'Arka plan müziğini sessize al':'Mute background music','Müziği aç':'Turn on music','Müziği sessize al':'Mute music',
    'Bize ulaşın':'Contact Us','Takip Et':'Follow Us','Her yaş ve seviyeye uygun':'For all ages and levels',
    'Hedefe özel plan ve takip':'Personalized planning and progress tracking','Fikirden tamamlanmış esere':'From idea to finished work',
    'Sahne ve etkinlik çözümleri':'Stage and event solutions','7’den 70’e eğitim':'Education for all ages',
    'Kişiye özel program':'Personalized program','Eğitim Atölye':'Education Studio',
    'PİRE ATÖLYE EĞİTİME HOŞGELDİNİZ':'WELCOME TO Pİ-RE EDUCATION STUDIO',
    'Matematik ve müziğin\naynı ritimde buluştuğu yer.':'Where mathematics and music\nmeet in the same rhythm.',
    'Panel kullanım asistanı':'Panel assistant','Ne yapmak istiyorsunuz?':'What would you like to do?',
    'Bu adımı göster':'Show This Step','Sonraki adım':'Next Step','İlk adımı ekranda göster':'Show the First Step',
    'Adım adım göster':'Show step by step','Pİ-RE kullanım rehberi':'Pİ-RE User Guide','Rehberi kapat':'Close Guide',
    'Gönder':'Send','Pİ-RE Rehberi aç':'Open Pİ-RE Guide','Pİ-RE Rehber':'Pİ-RE Guide',
    'Size nasıl yardımcı olabilirim?':'How can I help you?','Rehber adımlarını tamamladınız.':'You have completed the guide steps.',
    'Kendi ödeme durumunu görüntüleme':'View Your Payment Status','Kendi derslerini görüntüleme':'View Your Lessons',
    'Üst menüden kendi panelinizi açın.':'Open your panel from the top menu.',
    'Ödeme durumu alanında bu ayın borç, tahsilat ve kalan bakiye bilgilerini inceleyin.':'Review this month’s balance due, payments received, and remaining balance in the Payment Status section.',
    'Ders alanında son ve yaklaşan derslerin tarih, saat ve branş bilgilerini inceleyin.':'Review the date, time, and subject of recent and upcoming lessons in the Lessons section.',
    'Öğrenci Panelim':'My Student Panel','Veli Panelim':'My Parent Panel','Ödeme durumu':'Payment Status',
    'Ödeme bekleniyor':'Payment Pending','Borcunuz bulunmuyor':'No Outstanding Balance','Yaklaşan dersler':'Upcoming Lessons',
    'Son dersler':'Recent Lessons','Ders programı':'Lesson Schedule'
  }));
  const originalText=new WeakMap(),originalAttrs=new WeakMap();
  const trackedText=new Set(),trackedElements=new Set();
  let queued=false,observer=null,resumeTimer=null,ready=false;

  const language=()=>{try{return localStorage.getItem(STORAGE_KEY)==='en'?'en':'tr'}catch(_){return 'tr'}};
  const saveLanguage=value=>{try{localStorage.setItem(STORAGE_KEY,value)}catch(_){}};
  const preserveWhitespace=(source,value)=>`${source.match(/^\s*/)?.[0]||''}${value}${source.match(/\s*$/)?.[0]||''}`;

  function translatePhrase(value){
    const exact=translations.get(value);
    if(exact)return exact;
    return value
      .replace(/^(\d+) ders$/,'$1 lessons')
      .replace(/^(\d+) öğrenci$/,'$1 students')
      .replace(/^(\d+) okunmamış bildirim$/,'$1 unread notifications')
      .replace(/^(\d+) gün kaldı$/,'$1 days remaining')
      .replace(/^(\d+) gün gecikti$/,'$1 days overdue');
  }

  function eligibleText(node){
    const parent=node.parentElement;
    return parent&&!parent.closest('script,style,textarea,[contenteditable="true"],.pire-language-toggle')&&node.nodeValue?.trim();
  }

  function applyText(node,toEnglish){
    if(!eligibleText(node))return;
    if(!originalText.has(node)){originalText.set(node,node.nodeValue);trackedText.add(node)}
    const source=originalText.get(node),trimmed=source.trim();
    node.nodeValue=toEnglish?preserveWhitespace(source,translatePhrase(trimmed)):source;
  }

  function applyAttributes(element,toEnglish){
    if(!(element instanceof Element)||element.closest('.pire-language-toggle'))return;
    let originals=originalAttrs.get(element);
    if(!originals){originals={};originalAttrs.set(element,originals);trackedElements.add(element)}
    ATTRIBUTE_NAMES.forEach(name=>{
      if(!element.hasAttribute(name))return;
      if(!(name in originals))originals[name]=element.getAttribute(name);
      element.setAttribute(name,toEnglish?translatePhrase(originals[name]):originals[name]);
    });
  }

  function translate(root=document){
    const toEnglish=language()==='en';
    document.documentElement.lang=toEnglish?'en':'tr';
    if(root.nodeType===Node.TEXT_NODE)applyText(root,toEnglish);
    else if(root instanceof Element)applyAttributes(root,toEnglish);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode()))node.nodeType===Node.TEXT_NODE?applyText(node,toEnglish):applyAttributes(node,toEnglish);
    updateButtons();
  }

  function restoreOriginals(){
    trackedText.forEach(node=>{
      if(!node.isConnected){trackedText.delete(node);return}
      const source=originalText.get(node);if(source!==undefined)node.nodeValue=source;
    });
    trackedElements.forEach(element=>{
      if(!element.isConnected){trackedElements.delete(element);return}
      const originals=originalAttrs.get(element)||{};
      Object.entries(originals).forEach(([name,value])=>value===null?element.removeAttribute(name):element.setAttribute(name,value));
    });
    document.documentElement.lang='tr';
  }

  function protectReact(event){
    if(language()!=='en'||event.target?.closest?.('.pire-language-toggle'))return;
    clearTimeout(resumeTimer);
    restoreOriginals();
    resumeTimer=setTimeout(()=>{if(language()==='en')translate(document)},180);
  }

  function updateButtons(){
    const current=language();
    document.querySelectorAll('.pire-language-toggle').forEach(button=>{
      const label=current==='tr'?'TR':'ENG';
      if(button.textContent!==label)button.textContent=label;
      button.setAttribute('aria-label',current==='tr'?'Switch site language to English':'Site dilini Türkçe yap');
      button.title=current==='tr'?'English':'Türkçe';
    });
  }

  function toggle(event){
    event.stopPropagation();
    const next=language()==='tr'?'en':'tr';
    saveLanguage(next);
    if(next==='tr'||ready)translate(document);else updateButtons();
  }

  function addStyle(){
    if(document.querySelector('style[data-pire-language]'))return;
    const style=document.createElement('style');style.dataset.pireLanguage='true';
    style.textContent=`
      .navbar-tools > .pire-language-toggle{color:#e4c676!important;font-size:12px!important;font-weight:800!important;letter-spacing:.05em!important}
      html[data-theme="light"] .pire-language-toggle{color:#765b20!important}
      button:not(:disabled),a[href],select,summary,label[for],[role="button"],[tabindex]:not([tabindex="-1"]),input[type="checkbox"],input[type="radio"],input[type="button"],input[type="submit"],input[type="reset"]{cursor:pointer!important}
      button:disabled,select:disabled,input:disabled{cursor:not-allowed!important}
      .role-view-switch,.role-view-switch select{cursor:pointer!important}
      a.pire-social-icon.facebook-icon{cursor:pointer!important;pointer-events:auto!important;text-decoration:none!important}
      a.pire-social-icon.facebook-icon:hover{transform:translateY(-1px);filter:brightness(1.18)}
      a.pire-social-icon.facebook-icon:focus-visible{outline:2px solid #d5b15e;outline-offset:4px;border-radius:4px}
      a.pire-social-icon.tiktok-icon{cursor:pointer!important;pointer-events:auto!important;text-decoration:none!important}
      a.pire-social-icon.tiktok-icon:hover{transform:translateY(-1px);filter:brightness(1.18)}
      a.pire-social-icon.tiktok-icon:focus-visible{outline:2px solid #25f4ee;outline-offset:4px;border-radius:4px}
      a.pire-social-icon.linkedin-icon{color:#0a66c2!important;cursor:pointer!important;pointer-events:auto!important;text-decoration:none!important;display:inline-flex;align-items:center;justify-content:center}
      a.pire-social-icon.linkedin-icon svg{width:20px;height:20px;display:block}
      a.pire-social-icon.linkedin-icon:hover{transform:translateY(-1px);filter:brightness(1.18)}
      a.pire-social-icon.linkedin-icon:focus-visible{outline:2px solid #0a66c2;outline-offset:4px;border-radius:4px}
      @media(max-width:700px){.pire-language-toggle{font-size:10px!important}}
    `;
    document.head.appendChild(style);
  }

  function placeButtons(){
    const tools=document.querySelector('.app-shell .navbar-tools');
    const music=tools?.querySelector('.pire-music-toggle');
    const anchor=music||tools?.querySelector('.notification-wrap,.navbar-icon-button,.visitor-login-trigger');
    let button=document.querySelector('.pire-language-toggle');
    if(!tools||!anchor)return;
    if(!button){
      button=document.createElement('button');button.type='button';button.className='pire-language-toggle navbar-icon-button';
      button.addEventListener('click',toggle);
    }
    if(button.parentElement!==tools)tools.insertBefore(button,music||anchor);
    updateButtons();
  }

  function linkFacebookIcon(){
    document.querySelectorAll('.pire-social-icon.facebook-icon:not(a)').forEach(icon=>{
      const link=document.createElement('a');
      link.className=icon.className;
      link.href='https://www.facebook.com/profile.php?id=61593800193545';
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.setAttribute('aria-label','Pİ-RE Facebook sayfasını aç');
      link.title='Facebook';
      link.innerHTML=icon.innerHTML;
      icon.replaceWith(link);
    });
  }
  function linkTikTokIcon(){
    document.querySelectorAll('.pire-social-icon.tiktok-icon:not(a)').forEach(icon=>{
      const link=document.createElement('a');
      link.className=icon.className;
      link.href='https://www.tiktok.com/@pire.egitimatolye';
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.setAttribute('aria-label','Pİ-RE TikTok profilini aç');
      link.title='TikTok';
      link.innerHTML=icon.innerHTML;
      icon.replaceWith(link);
    });
  }
  function addLinkedInIcon(){
    if(document.querySelector('.pire-social-icon.linkedin-icon'))return;
    const facebook=document.querySelector('.contact-socials .pire-social-icon.facebook-icon');
    const container=facebook?.parentElement||document.querySelector('.contact-socials');
    if(!container)return;
    const link=document.createElement('a');
    link.className='pire-social-icon linkedin-icon';
    link.href='https://www.linkedin.com/in/pire-e%C4%9Fitim-at%C3%B6lye-536a7641b/';
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.setAttribute('aria-label','Pİ-RE LinkedIn profilini aç');
    link.title='LinkedIn';
    link.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 3.5A2.2 2.2 0 1 1 5.2 8a2.2 2.2 0 0 1 0-4.5ZM3.4 9.6H7V21H3.4V9.6Zm5.8 0h3.4v1.6h.1c.5-.9 1.7-2 3.7-2 3.9 0 4.6 2.5 4.6 5.9V21h-3.6v-5.2c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21H9.2V9.6Z"/></svg>';
    facebook?facebook.after(link):container.appendChild(link);
  }
  function sync(){linkFacebookIcon();linkTikTokIcon();addLinkedInIcon();if(ready)placeButtons();if(ready&&language()==='en')translate(document);else updateButtons()}
  function queueSync(){if(queued)return;queued=true;setTimeout(()=>{queued=false;sync()},90)}
  function loadLoginNotification(){
    if(document.querySelector('script[data-pire-login-notification]'))return;
    const script=document.createElement('script');
    script.src='/pire-login-notification.js';
    script.defer=true;
    script.dataset.pireLoginNotification='true';
    document.head.appendChild(script);
  }
  function loadCustomerRoleCleanup(){
    if(document.querySelector('script[data-pire-customer-role-cleanup]'))return;
    const script=document.createElement('script');
    script.src='/pire-customer-role-cleanup.js';
    script.defer=true;
    script.dataset.pireCustomerRoleCleanup='true';
    document.head.appendChild(script);
  }
  function loadNewTriggerStyle(){
    if(document.querySelector('link[data-pire-new-trigger-refine]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='/pire-new-trigger-refine.css';
    link.dataset.pireNewTriggerRefine='true';
    document.head.appendChild(link);
  }
  function loadAccountHonorific(){
    if(document.querySelector('script[data-pire-account-honorific]'))return;
    const script=document.createElement('script');
    script.src='/pire-account-honorific.js';script.defer=true;script.dataset.pireAccountHonorific='true';
    document.head.appendChild(script);
  }
  function boot(){
    addStyle();updateButtons();loadLoginNotification();loadCustomerRoleCleanup();loadNewTriggerStyle();loadAccountHonorific();
    ['pointerdown','keydown','submit','change'].forEach(type=>document.addEventListener(type,protectReact,true));
    observer=new MutationObserver(records=>{
      const relevant=records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===Node.ELEMENT_NODE||node.nodeType===Node.TEXT_NODE));
      if(relevant)queueSync();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY)queueSync()});
    const start=()=>requestAnimationFrame(()=>{ready=true;sync()});
    document.readyState==='complete'?start():window.addEventListener('load',start,{once:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

;(()=>{
  if(!document.querySelector('link[data-pire-reports-tabs]')){
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='/pire-reports-tabs.css';link.dataset.pireReportsTabs='true';
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-pire-reports-tabs]')){
    const script=document.createElement('script');
    script.src='/pire-reports-tabs.js';script.defer=true;script.dataset.pireReportsTabs='true';
    document.head.appendChild(script);
  }
})();

;(()=>{
  if(!document.querySelector('link[data-pire-accounts-tabs]')){
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='/pire-accounts-tabs.css';link.dataset.pireAccountsTabs='true';
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-pire-accounts-tabs]')){
    const script=document.createElement('script');
    script.src='/pire-accounts-tabs.js';script.defer=true;script.dataset.pireAccountsTabs='true';
    document.head.appendChild(script);
  }
})();

;(()=>{
  if(!document.querySelector('link[data-pire-health-tabs]')){
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='/pire-health-tabs.css';link.dataset.pireHealthTabs='true';
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-pire-health-tabs]')){
    const script=document.createElement('script');
    script.src='/pire-health-tabs.js';script.defer=true;script.dataset.pireHealthTabs='true';
    document.head.appendChild(script);
  }
})();

;(()=>{
  if(!document.querySelector('link[data-pire-settings-tabs]')){
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='/pire-settings-tabs.css';link.dataset.pireSettingsTabs='true';
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-pire-settings-tabs]')){
    const script=document.createElement('script');
    script.src='/pire-settings-tabs.js';script.defer=true;script.dataset.pireSettingsTabs='true';
    document.head.appendChild(script);
  }
})();


;(()=>{
  if(!document.querySelector('link[data-pire-finance-menu]')){
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='/pire-finance-menu.css?v=15';link.dataset.pireFinanceMenu='true';
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-pire-finance-menu]')){
    const script=document.createElement('script');
    script.src='/pire-finance-menu.js?v=15';script.defer=true;script.dataset.pireFinanceMenu='true';
    document.head.appendChild(script);
  }
})();
