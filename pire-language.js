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
    'Rehber adımlarını tamamladınız.':'You have completed the guide steps.'
  }));
  const originalText=new WeakMap(),originalAttrs=new WeakMap();
  let queued=false,observer=null;

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
    if(!originalText.has(node))originalText.set(node,node.nodeValue);
    const source=originalText.get(node),trimmed=source.trim();
    node.nodeValue=toEnglish?preserveWhitespace(source,translatePhrase(trimmed)):source;
  }

  function applyAttributes(element,toEnglish){
    if(!(element instanceof Element)||element.closest('.pire-language-toggle'))return;
    let originals=originalAttrs.get(element);
    if(!originals){originals={};originalAttrs.set(element,originals)}
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

  function updateButtons(){
    const current=language();
    document.querySelectorAll('.pire-language-toggle').forEach(button=>{
      button.innerHTML=`<span class="pire-language-current">${current==='tr'?'TR':'ENG'}</span><span class="pire-language-next">${current==='tr'?'ENG':'TR'}</span>`;
      button.setAttribute('aria-label',current==='tr'?'Switch site language to English':'Site dilini Türkçe yap');
      button.title=current==='tr'?'English':'Türkçe';
    });
  }

  function toggle(event){
    event.stopPropagation();
    saveLanguage(language()==='tr'?'en':'tr');
    translate(document);
  }

  function addStyle(){
    if(document.querySelector('style[data-pire-language]'))return;
    const style=document.createElement('style');style.dataset.pireLanguage='true';
    style.textContent=`
      .pire-language-toggle{width:auto!important;min-width:72px!important;padding:0 9px!important;gap:5px!important;font-size:9px!important;font-weight:750!important;letter-spacing:.04em!important}
      .pire-language-toggle .pire-language-current{color:#e4c676}
      .pire-language-toggle .pire-language-next{color:#77736b;border-left:1px solid #ffffff1a;padding-left:5px}
      html[data-theme="light"] .pire-language-toggle .pire-language-current{color:#765b20}
      html[data-theme="light"] .pire-language-toggle .pire-language-next{color:#8b867d;border-left-color:#29261f22}
      @media(max-width:700px){.pire-language-toggle{min-width:60px!important;padding:0 7px!important}.pire-language-toggle .pire-language-next{display:none}}
    `;
    document.head.appendChild(style);
  }

  function placeButtons(){
    document.querySelectorAll('.app-shell .navbar-tools').forEach(tools=>{
      if(tools.querySelector('.pire-language-toggle'))return;
      const button=document.createElement('button');button.type='button';button.className='pire-language-toggle navbar-icon-button';
      button.addEventListener('click',toggle);
      const music=tools.querySelector('.pire-music-toggle');
      const notifications=tools.querySelector('.notification-wrap');
      if(music)music.insertAdjacentElement('afterend',button);
      else if(notifications)notifications.insertAdjacentElement('beforebegin',button);
      else tools.appendChild(button);
    });
    updateButtons();
  }

  function sync(){placeButtons();translate(document)}
  function queueSync(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})}
  function boot(){
    addStyle();sync();
    observer=new MutationObserver(records=>{
      const relevant=records.some(record=>[...record.addedNodes].some(node=>node.nodeType===Node.ELEMENT_NODE||node.nodeType===Node.TEXT_NODE));
      if(relevant)queueSync();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY)queueSync()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
