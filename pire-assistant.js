(()=>{
  "use strict";

  const STYLE_ID="pire-guide-style";
  const ROOT_ID="pire-guide-root";
  const HIGHLIGHT_CLASS="pire-guide-highlight";
  const state={guide:null,suggestedGuide:null,step:0,pending:false,lastIntent:"",lastTask:null};
  const interfaceLanguage=()=>{try{return localStorage.getItem('pire-interface-language')==='en'?'en':'tr'}catch(_){return 'tr'}};
  const ui=(tr,en)=>interfaceLanguage()==='en'?en:tr;

  const guides=[
    {
      id:"view-teachers",
      completion:"view",
      match:/kaç\s+(?:aktif\s+)?eğitmen|eğitmen(?:ler)?(?:imiz)?.*(?:kaç|nerede|nereden|nasıl|liste|görüntüle)|(?:hoca|öğretmen).*(?:bul|nerede|göster|ulaş)/i,
      title:"Eğitmenleri görüntüleme",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüden Eğitmenler bölümünü açın.",targets:["Eğitmenler"]},
        {text:"Eğitmen kartlarında aktiflik, branş, program ve iş yükü bilgilerini inceleyin.",targets:["Eğitmenler","Aktif Eğitmen"]}
      ]
    },
    {
      id:"view-students",
      completion:"view",
      match:/kaç\s+(?:aktif\s+)?öğrenci|öğrenci(?:ler)?(?:miz)?.*(?:kaç|nerede|nereden|nasıl|liste|görüntüle)/i,
      title:"Öğrencileri görüntüleme",
      roles:["Yönetici","Eğitmen"],
      steps:[
        {text:"Üst menüden Öğrenciler bölümünü açın.",targets:["Öğrenciler"]},
        {text:"Öğrenci kartlarında aktiflik, branş, paket ve ders bilgilerini inceleyin.",targets:["Öğrenciler","Aktif Öğrenci"]}
      ]
    },
    {
      id:"view-expenses",
      completion:"view",
      match:/gider(?:leri|lere)?\s*(?:nereden|nasıl)?\s*(?:bak|gör|incele)|harcama(?:ları|lara)?\s*(?:nereden|nasıl)?\s*(?:bak|gör|incele)/i,
      title:"Kurum giderlerini görüntüleme",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüden Finans bölümünü açın.",targets:["Finans"]},
        {text:"Açılan menüden Gider Takibi seçeneğine basın.",targets:["Gider Takibi","Giderler"]},
        {text:"Gider listesinde tarihleri kontrol edin; bu aya ait kayıtların tutarlarını burada görebilirsiniz.",targets:["Gider Takibi","Giderler","Tutar"]}
      ]
    },
    {
      id:"view-receivables",
      completion:"view",
      match:/alacak|tahsil\s+edilecek|bekleyen\s+ödeme/i,
      title:"Alacakları görüntüleme",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüden Finans bölümünü açın.",targets:["Finans"]},
        {text:"Açılan menüden Ödeme Takibi seçeneğine basın.",targets:["Ödeme Takibi","Ödemeler"]},
        {text:"Ödeme listesinde Bekliyor, Kısmi veya Gecikmiş durumundaki kayıtları ve kalan bakiyeyi inceleyin.",targets:["Bekliyor","Kısmi","Gecikmiş","Bakiye"]}
      ]
    },
    {
      id:"view-own-payments",
      completion:"view",
      match:/ödem|borç|bakiye|ücret/i,
      title:"Kendi ödeme durumunu görüntüleme",
      roles:["Öğrenci","Veli"],
      steps:[
        {text:"Üst menüden kendi panelinizi açın.",targets:["Öğrenci Panelim","Veli Panelim"]},
        {text:"Ödeme durumu alanında bu ayın borç, tahsilat ve kalan bakiye bilgilerini inceleyin.",targets:["Ödeme durumu","Ödeme bekleniyor","Borcunuz bulunmuyor"]}
      ]
    },
    {
      id:"view-own-lessons",
      completion:"view",
      match:/ders|program/i,
      title:"Kendi derslerini görüntüleme",
      roles:["Öğrenci","Veli"],
      steps:[
        {text:"Üst menüden kendi panelinizi açın.",targets:["Öğrenci Panelim","Veli Panelim"]},
        {text:"Ders alanında son ve yaklaşan derslerin tarih, saat ve branş bilgilerini inceleyin.",targets:["Yaklaşan dersler","Son dersler","Ders programı"]}
      ]
    },
    {
      id:"today-lessons",
      completion:"view",
      match:/bug[uü]n(?:kü)?\s+(?:hangi\s+)?ders(?:ler)?(?:\s+var)?|bug[uü]n.*program/i,
      title:"Bugünün derslerini görüntüleme",
      roles:["Yönetici","Eğitmen","Öğrenci","Veli"],
      steps:[
        {text:"Üst menüden Genel Bakış bölümünü açın.",targets:["Genel Bakış","Ana Sayfa"]},
        {text:"Bugünkü Dersler alanında saat, branş ve ders durumlarını inceleyin.",targets:["Bugünkü Dersler","Bugünün Dersleri"]}
      ]
    },
    {
      id:"invoice-expense",
      match:/fatura|elektrik|doğalgaz|internet|telefon|su fatur|kira|gider/i,
      title:"Faturaları gider olarak kaydetme",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüde Finans bölümünü açın.",targets:["Finans"]},
        {text:"Açılan menüden Gider Takibi seçeneğine basın.",targets:["Gider Takibi","Giderler"]},
        {text:"Gider ekle veya Yeni gider düğmesine basın.",targets:["Gider ekle","Yeni gider","Gider Ekle"]},
        {text:"Kategori alanında Fatura seçin; faturanın açıklamasını, tutarını ve tarihini girin.",targets:["Kategori","Fatura"]},
        {text:"Bilgileri kontrol edip Kaydet düğmesine basın. Her faturayı ayrı kayıt olarak girin.",targets:["Kaydet","Gideri kaydet"]}
      ]
    },
    {
      id:"student",
      match:/öğrenci.*(ekle|kaydet|oluştur)|yeni öğrenci/i,
      title:"Yeni öğrenci ekleme",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüde Yeni düğmesine basın.",targets:["Yeni"]},
        {text:"Öğrenci ekle seçeneğini açın.",targets:["Öğrenci ekle"]},
        {text:"Öğrenci ve veli bilgilerini eksiksiz doldurun.",targets:["Ad Soyad","Öğrenci Bilgileri"]},
        {text:"Durumu Aktif seçip Kaydet düğmesine basın.",targets:["Kaydet","Öğrenciyi kaydet"]}
      ]
    },
    {
      id:"teacher",
      match:/eğitmen.*(ekle|kaydet|oluştur)|yeni eğitmen|öğretmen.*ekle/i,
      title:"Yeni eğitmen ekleme",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüde Yeni düğmesine basın.",targets:["Yeni"]},
        {text:"Eğitmen ekle seçeneğini açın.",targets:["Eğitmen ekle"]},
        {text:"Kimlik, iletişim ve branş bilgilerini doldurun.",targets:["Ad Soyad","Branş"]},
        {text:"Bilgileri kontrol edip Kaydet düğmesine basın.",targets:["Kaydet","Eğitmeni kaydet"]}
      ]
    },
    {
      id:"lesson",
      match:/ders.*(ekle|oluştur|planla|tanımla)|yeni ders/i,
      title:"Yeni ders oluşturma",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüde Yeni düğmesine basın.",targets:["Yeni"]},
        {text:"Ders oluştur seçeneğine basın.",targets:["Ders oluştur"]},
        {text:"Öğrenci, eğitmen, tarih, saat, süre ve dersliği seçin.",targets:["Öğrenci","Eğitmen"]},
        {text:"Tekrarlama ve ücret bilgilerini kontrol edin.",targets:["Tekrarlama","Ücret"]},
        {text:"Dersi Kaydet düğmesine basın.",targets:["Kaydet","Dersi oluştur"]}
      ]
    },
    {
      id:"payment",
      match:/ödeme|tahsilat|borç|ücret.*gir/i,
      title:"Ödeme veya tahsilat kaydı",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüde Finans bölümünü açın.",targets:["Finans"]},
        {text:"Ödeme Takibi seçeneğine basın.",targets:["Ödeme Takibi","Ödemeler"]},
        {text:"Ödeme ekle veya Tahsilat ekle düğmesini açın.",targets:["Ödeme ekle","Tahsilat ekle"]},
        {text:"Öğrenciyi, tutarı, tarihi ve ödeme yöntemini seçin.",targets:["Öğrenci","Tutar"]},
        {text:"Kaydet düğmesine basın.",targets:["Kaydet"]}
      ]
    },
    {
      id:"attendance",
      match:/yoklama|devamsız|katıldı|gelmedi/i,
      title:"Yoklama girme",
      roles:["Yönetici","Eğitmen"],
      steps:[
        {text:"Üst menüden Yoklama ve Ders Notları bölümünü açın.",targets:["Yoklama","Yoklama ve Ders Notları"]},
        {text:"İşlem yapmak istediğiniz dersi seçin.",targets:["Ders seç","Ders"]},
        {text:"Öğrencilerin katılım durumlarını işaretleyin.",targets:["Katıldı","Gelmedi"]},
        {text:"Yoklamayı Kaydet düğmesine basın.",targets:["Kaydet","Yoklamayı kaydet"]}
      ]
    },
    {
      id:"makeup",
      match:/telafi|ders.*iptal|ertele/i,
      title:"İptal ve telafi işlemi",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüden Telafi ve Ders Değişiklikleri bölümünü açın.",targets:["Telafi","Telafi ve Ders Değişiklikleri"]},
        {text:"İlgili iptal veya telafi kaydını seçin.",targets:["Telafi planla","İptal"]},
        {text:"Önerilen uygun saatlerden birini veya özel tarih ve saati seçin.",targets:["Uygun saat","Tarih"]},
        {text:"Çakışma uyarılarını kontrol edip Kaydet düğmesine basın.",targets:["Kaydet","Telafiyi planla"]}
      ]
    },
    {
      id:"report",
      completion:"view",
      match:/rapor|analiz|excel|pdf|istatistik/i,
      title:"Rapor görüntüleme",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüden Raporlar ve Analiz bölümünü açın.",targets:["Raporlar","Raporlar ve Analiz"]},
        {text:"İncelemek istediğiniz dönemi ve filtreleri seçin.",targets:["Bu ay","Filtre"]},
        {text:"İsterseniz Excel veya PDF dışa aktarma düğmesini kullanın.",targets:["Excel","PDF"]}
      ]
    },
    {
      id:"account",
      match:/kullanıcı|hesap|şifre|giriş.*yetki|rol ata/i,
      title:"Kullanıcı hesabı ve yetki işlemi",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüden Kullanıcı Hesapları bölümünü açın.",targets:["Kullanıcı Hesapları","Kullanıcılar"]},
        {text:"İlgili kişiyi bulun veya yeni hesap oluşturun.",targets:["Hesap oluştur","Kullanıcı ara"]},
        {text:"Rolü, bağlı öğrenci/eğitmen kaydını ve aktiflik durumunu kontrol edin.",targets:["Rol","Aktif"]},
        {text:"Değişiklikleri Kaydet düğmesine basın.",targets:["Kaydet"]}
      ]
    },
    {
      id:"settings",
      match:/ayar|kurum bilg|bildirim zamanı/i,
      title:"Kurum ayarlarını düzenleme",
      roles:["Yönetici"],
      steps:[
        {text:"Üst menüden Kurum Ayarları bölümünü açın.",targets:["Kurum Ayarları","Ayarlar"]},
        {text:"Değiştirmek istediğiniz ayar grubunu seçin.",targets:["Bildirim Zamanları","Genel"]},
        {text:"Yeni değeri girip Kaydet düğmesine basın.",targets:["Kaydet"]}
      ]
    }
  ];

  const safeActions={
    "view-teachers":{label:"Eğitmenler ekranını aç",path:[["Eğitmenler"]]},
    "view-students":{label:"Öğrenciler ekranını aç",path:[["Öğrenciler"]]},
    "view-expenses":{label:"Giderler ekranını aç",path:[["Finans"],["Gider Takibi","Giderler"]]},
    "view-receivables":{label:"Ödemeler ekranını aç",path:[["Finans"],["Ödeme Takibi","Ödemeler"]]},
    "today-lessons":{label:"Genel Bakış ekranını aç",path:[["Genel Bakış","Ana Sayfa"]]},
    student:{label:"Öğrenci formunu hazırla",path:[["Yeni"],["Öğrenci ekle"]],form:true},
    teacher:{label:"Eğitmen formunu hazırla",path:[["Yeni"],["Eğitmen ekle"]],form:true},
    lesson:{label:"Ders formunu hazırla",path:[["Yeni"],["Ders oluştur"]],form:true},
    payment:{label:"Ödeme formunu hazırla",path:[["Finans"],["Ödeme Takibi","Ödemeler"],["Ödeme ekle","Tahsilat ekle"]],form:true},
    "invoice-expense":{label:"Gider formunu hazırla",path:[["Finans"],["Gider Takibi","Giderler"],["Gider ekle","Yeni gider","Gider Ekle"]],form:true},
    attendance:{label:"Yoklama ekranını aç",path:[["Yoklama","Yoklama ve Ders Notları"]]},
    makeup:{label:"Telafi ekranını aç",path:[["Telafi","Telafi ve Ders Değişiklikleri"]]},
    report:{label:"Raporlar ekranını aç",path:[["Raporlar","Raporlar ve Analiz"]]},
    account:{label:"Kullanıcılar ekranını aç",path:[["Kullanıcı Hesapları","Kullanıcılar"]]},
    settings:{label:"Ayarlar ekranını aç",path:[["Kurum Ayarları","Ayarlar"]]}
  };

  const roleCapabilities={
    "Yönetici":{
      intro:"Kurum yönetimi için öğrenci, eğitmen, ders, finans ve rapor işlemlerinde yardımcı olabilirim.",
      items:[
        {kind:"prepare",title:"Öğrenci kaydı",description:"Yeni öğrenci formunu açıp ilk alanı hazırlayabilirim.",prompt:"Yeni öğrenci eklemek istiyorum."},
        {kind:"prepare",title:"Eğitmen kaydı",description:"Yeni eğitmen formunu güvenli biçimde açabilirim.",prompt:"Yeni eğitmen eklemek istiyorum."},
        {kind:"prepare",title:"Ders oluşturma",description:"Ders oluşturma formunu açabilirim; son kaydı siz onaylarsınız.",prompt:"Yeni ders oluşturmak istiyorum."},
        {kind:"prepare",title:"Ödeme ve gider",description:"Ödeme veya gider kayıt ekranını ve ilgili formu açabilirim.",prompt:"Ödeme kaydı girmek istiyorum."},
        {kind:"open",title:"Öğrenci ve eğitmenler",description:"Kayıt listelerini, program ve paket bilgilerini bulmanıza yardım edebilirim.",prompt:"Öğrencileri görüntülemek istiyorum."},
        {kind:"open",title:"Yoklama ve telafi",description:"Yoklama ya da telafi ekranına götürüp adımları gösterebilirim.",prompt:"Yoklama girmek istiyorum."},
        {kind:"info",title:"Finans özeti",description:"Yetkili kurum özetlerinden tahsilat, alacak ve gider bilgilerini açıklayabilirim.",prompt:"Bu ayın finans durumunu nasıl incelerim?"},
        {kind:"open",title:"Raporlar ve hesaplar",description:"Rapor, kullanıcı hesabı ve kurum ayarları ekranlarını açabilirim.",prompt:"Raporlar ekranını açmak istiyorum."}
      ]
    },
    "Eğitmen":{
      intro:"Yalnızca size atanmış dersler ve öğrenciler kapsamında program ve yoklama işlemlerinde yardımcı olabilirim.",
      items:[
        {kind:"info",title:"Bugünkü program",description:"Bugünkü derslerin nereden görüntüleneceğini gösterebilirim.",prompt:"Bugün hangi derslerim var?"},
        {kind:"open",title:"Öğrencilerim",description:"Yetkiniz kapsamındaki öğrenci listesini açabilirim.",prompt:"Öğrencilerimi görüntülemek istiyorum."},
        {kind:"open",title:"Yoklama",description:"Ders yoklaması ekranına götürüp adımları gösterebilirim.",prompt:"Yoklama girmek istiyorum."},
        {kind:"info",title:"Ders programı",description:"Kendi ders programınızı ve yaklaşan dersleri bulmanıza yardım edebilirim.",prompt:"Ders programımı nasıl görebilirim?"}
      ]
    },
    "Öğrenci":{
      intro:"Yalnızca kendi ders, yoklama, paket ve ödeme bilgilerinizi bulmanıza yardımcı olabilirim.",
      items:[
        {kind:"info",title:"Yaklaşan dersler",description:"Bir sonraki ve bu haftaki derslerinizi nereden göreceğinizi gösterebilirim.",prompt:"Bir sonraki dersim ne zaman?"},
        {kind:"info",title:"Ders geçmişi",description:"Son derslerinizi ve ders durumlarınızı bulmanıza yardımcı olabilirim.",prompt:"Son derslerimi göster."},
        {kind:"info",title:"Ödeme durumu",description:"Kendi borç, tahsilat ve kalan bakiye alanınızı gösterebilirim.",prompt:"Ödeme durumumu nasıl görebilirim?"},
        {kind:"info",title:"Bugünkü dersler",description:"Bugünkü ders alanına adım adım yönlendirebilirim.",prompt:"Bugün dersim var mı?"}
      ]
    },
    "Veli":{
      intro:"Yalnızca hesabınıza bağlı öğrencilerin ders, yoklama, paket ve ödeme bilgilerini bulmanıza yardımcı olabilirim.",
      items:[
        {kind:"info",title:"Çocuğumun dersleri",description:"Bağlı öğrencinin yaklaşan ve geçmiş derslerini gösterebilirim.",prompt:"Çocuğumun bir sonraki dersi ne zaman?"},
        {kind:"info",title:"Ödeme durumu",description:"Bağlı öğrencinin borç, tahsilat ve kalan bakiye alanını gösterebilirim.",prompt:"Çocuğumun ödeme durumunu göster."},
        {kind:"info",title:"Bugünkü program",description:"Bugünkü dersleri nereden inceleyeceğinizi gösterebilirim.",prompt:"Çocuğumun bugün dersi var mı?"},
        {kind:"info",title:"Ders ve paket özeti",description:"Ders programı ve kalan hak bilgilerinin bulunduğu bölüme yönlendirebilirim.",prompt:"Çocuğumun ders ve paket bilgilerini nasıl görürüm?"}
      ]
    }
  };

  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #${ROOT_ID}{position:fixed;right:22px;bottom:22px;z-index:2147482000;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
      .pire-guide-launcher{width:62px;height:62px;padding:5px;border:1px solid rgba(218,181,92,.68);border-radius:50%;background:#0d0e0d;box-shadow:0 16px 38px rgba(0,0,0,.42),0 0 0 7px rgba(218,181,92,.08);cursor:pointer;transition:.25s ease;overflow:hidden}
      .pire-guide-launcher img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover}
      .pire-guide-launcher:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 20px 44px rgba(0,0,0,.5),0 0 0 10px rgba(218,181,92,.12)}
      .pire-guide-nudge{position:absolute;right:73px;bottom:10px;width:max-content;max-width:240px;padding:10px 13px;border:1px solid rgba(218,181,92,.38);border-radius:12px;background:rgba(15,16,15,.97);color:#eee9df;box-shadow:0 12px 30px rgba(0,0,0,.38);font-size:12px;font-weight:800;opacity:0;visibility:hidden;transform:translateX(8px);transition:.22s ease;pointer-events:none}
      .pire-guide-nudge:after{content:"";position:absolute;right:-6px;top:50%;width:10px;height:10px;background:#111210;border-top:1px solid rgba(218,181,92,.38);border-right:1px solid rgba(218,181,92,.38);transform:translateY(-50%) rotate(45deg)}
      #${ROOT_ID}:has(.pire-guide-launcher:hover) .pire-guide-nudge,#${ROOT_ID}:has(.pire-guide-launcher:focus-visible) .pire-guide-nudge{opacity:1;visibility:visible;transform:none}
      .pire-guide-panel{position:absolute;right:0;bottom:76px;width:min(350px,calc(100vw - 30px));max-height:min(560px,calc(100vh - 115px));display:none;grid-template-rows:auto minmax(150px,1fr) auto auto;background:rgba(15,16,15,.98);color:#eee9df;border:1px solid rgba(218,181,92,.3);border-radius:18px;box-shadow:0 28px 75px rgba(0,0,0,.58);overflow:hidden;backdrop-filter:blur(18px)}
      .pire-guide-panel.open{display:grid;animation:pireGuideIn .24s ease-out}
      @keyframes pireGuideIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
      .pire-guide-head{display:flex;align-items:center;gap:11px;padding:15px 16px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(100deg,rgba(218,181,92,.13),transparent)}
      .pire-guide-mark{display:grid;place-items:center;width:39px;height:39px;padding:3px;border-radius:12px;background:#0d0e0d;border:1px solid rgba(218,181,92,.4);overflow:hidden}.pire-guide-mark img{width:100%;height:100%;border-radius:9px;object-fit:cover}
      .pire-guide-head div{display:grid;gap:2px;min-width:0}.pire-guide-head b{font-size:15px}.pire-guide-head small{color:#a9a296;font-size:11px}
      .pire-guide-reset,.pire-guide-close{border:0;background:transparent;color:#aaa39a;cursor:pointer;padding:5px}.pire-guide-reset{margin-left:auto;font-size:17px}.pire-guide-close{font-size:20px}.pire-guide-reset:hover,.pire-guide-reset:focus-visible,.pire-guide-close:hover,.pire-guide-close:focus-visible{color:#dabb6e}
      .pire-guide-messages{padding:16px;overflow:auto;display:flex;flex-direction:column;gap:11px}
      .pire-guide-message{max-width:94%;padding:12px 13px;border-radius:14px;font-size:13.5px;line-height:1.55;white-space:pre-line}
      .pire-guide-message.bot{align-self:flex-start;background:#20211f;border:1px solid rgba(218,181,92,.18);color:#eee9df;border-bottom-left-radius:4px}
      .pire-guide-message.user{align-self:flex-end;background:#b99343;color:#17130c;font-weight:700;border-bottom-right-radius:4px}
      .pire-guide-message.success{align-self:stretch;max-width:100%;background:rgba(57,151,91,.14);border:1px solid rgba(86,194,124,.48);color:#b9f1cb;font-weight:800;box-shadow:inset 3px 0 #56c27c}
      .pire-guide-card{display:grid;gap:10px;padding:13px;border:1px solid rgba(218,181,92,.25);border-radius:14px;background:rgba(218,181,92,.06)}
      .pire-guide-card b{font-size:14px;color:#dabb6e}.pire-guide-card ol{margin:0;padding-left:20px;display:grid;gap:9px;color:#ccc6bb;font-size:12.5px;line-height:1.5}
      .pire-guide-card li.active{color:#fff;font-weight:800}
      .pire-guide-controls{display:flex;gap:7px}.pire-guide-controls button{flex:1;border:1px solid rgba(218,181,92,.3);border-radius:9px;background:#24241f;color:#e8dfca;padding:10px 9px;font-size:12px;font-weight:800;cursor:pointer}.pire-guide-controls button.primary{background:#dabb6e;color:#17130c}
      .pire-guide-prepare{width:100%;border:1px solid rgba(86,194,124,.5);border-radius:9px;background:rgba(57,151,91,.16);color:#b9f1cb;padding:11px 10px;font-size:12px;font-weight:900;cursor:pointer}.pire-guide-prepare:disabled{cursor:wait;opacity:.6}
      .pire-guide-form{display:flex;gap:8px;padding:13px;border-top:1px solid rgba(255,255,255,.08);background:#121312}
      .pire-guide-capabilities-toggle{margin:0 13px 10px;border:1px solid rgba(218,181,92,.34);border-radius:11px;background:rgba(218,181,92,.08);color:#e8dfca;padding:10px 13px;font-size:12px;font-weight:900;cursor:pointer}
      .pire-guide-capabilities{display:grid;gap:10px;padding:13px;border:1px solid rgba(218,181,92,.25);border-radius:14px;background:rgba(218,181,92,.05)}
      .pire-guide-capabilities h3{margin:0;color:#dabb6e;font-size:14px}.pire-guide-capabilities>p{margin:0;color:#bdb6aa;font-size:12px;line-height:1.5}
      .pire-guide-capability-list{display:grid;gap:7px}.pire-guide-capability{display:grid;grid-template-columns:auto 1fr;gap:3px 8px;width:100%;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:#1b1c1a;color:#eee9df;text-align:left;cursor:pointer}
      .pire-guide-capability:hover,.pire-guide-capability:focus-visible{border-color:rgba(218,181,92,.55);background:#22221e}.pire-guide-capability b{font-size:12px}.pire-guide-capability small{grid-column:2;color:#aaa399;font-size:10.5px;line-height:1.4}
      .pire-guide-capability-kind{grid-row:1/3;align-self:start;border-radius:999px;padding:3px 6px;background:rgba(218,181,92,.14);color:#dabb6e;font-size:9px;font-weight:950;text-transform:uppercase}
      .pire-guide-quick{display:none;margin:0 13px 10px;border:1px solid rgba(218,181,92,.52);border-radius:11px;background:#dabb6e;color:#17130c;padding:11px 14px;font-size:12px;font-weight:900;cursor:pointer}.pire-guide-quick.visible{display:block}
      .pire-guide-form input{min-width:0;flex:1;border:1px solid rgba(255,255,255,.13);border-radius:11px;background:#1c1d1b;color:#fff;outline:none;padding:12px;font-size:13px}.pire-guide-form input:focus{border-color:#dabb6e}
      .pire-guide-form button{border:0;border-radius:11px;background:#dabb6e;color:#17130c;padding:0 14px;font-weight:950;cursor:pointer}
      .pire-guide-form button:disabled,.pire-guide-form input:disabled{cursor:wait;opacity:.6}
      .${HIGHLIGHT_CLASS}{position:relative!important;z-index:2147482500!important;outline:3px solid #e4bf62!important;outline-offset:5px!important;box-shadow:0 0 0 10px rgba(228,191,98,.18),0 0 35px rgba(228,191,98,.8)!important;animation:pireGuideSignal 1.15s ease-in-out infinite!important}
      @keyframes pireGuideSignal{50%{outline-offset:10px;box-shadow:0 0 0 16px rgba(228,191,98,.06),0 0 44px rgba(228,191,98,.55)}}
      .pire-guide-tip{position:fixed;z-index:2147483000;max-width:260px;padding:9px 11px;border-radius:10px;background:#dabb6e;color:#17130c;font:800 11px/1.35 Inter,system-ui,sans-serif;box-shadow:0 12px 35px rgba(0,0,0,.45);pointer-events:none}
      html[data-theme="light"] .pire-guide-panel{background:rgba(255,253,248,.98);color:#231f18;border-color:rgba(143,101,20,.28)}
      html[data-theme="light"] .pire-guide-message.bot{background:#f2eee5;color:#29251e}html[data-theme="light"] .pire-guide-card ol{color:#5d564b}html[data-theme="light"] .pire-guide-form{background:#f7f3eb}html[data-theme="light"] .pire-guide-form input{background:#fff;color:#211d16;border-color:#d9d1c3}
      html[data-theme="light"] .pire-guide-capabilities-toggle{color:#5b4518;background:#fbf3df}html[data-theme="light"] .pire-guide-capabilities>p{color:#655e53}html[data-theme="light"] .pire-guide-capability{background:#fff;color:#29251e;border-color:#ddd5c8}html[data-theme="light"] .pire-guide-capability small{color:#6d655a}
      @media(max-width:600px){#${ROOT_ID}{right:14px;bottom:14px}.pire-guide-panel{position:fixed;left:12px;right:12px;bottom:78px;width:auto;max-height:68vh}.pire-guide-launcher{width:55px;height:55px}.pire-guide-nudge{display:none}}
      @media(prefers-reduced-motion:reduce){.${HIGHLIGHT_CLASS},.pire-guide-panel.open{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  const normalized=value=>String(value||"").toLocaleLowerCase("tr-TR").replace(/\s+/g," ").trim();
  function hasExplicitTopic(query){
    return /öğrenci|eğitmen|öğretmen|hoca|finans|gider|harcama|masraf|ödeme|tahsilat|alacak|borç|ders|program|takvim|yoklama|devamsız|telafi|rapor|kullanıcı|hesap|ayar/i.test(normalized(query));
  }
  function isContextFollowup(query){
    const text=normalized(query);
    if(hasExplicitTopic(text))return false;
    if(/\b(?:buna|bunu|onu|orada|burada)\b/i.test(text))return true;
    if(/^(?:beni\s+sen\s+)?yönlendir|^adım\s+adım(?:\s+göster)?$|^rehberlik\s+et/i.test(text))return true;
    return text.split(" ").length<=4&&/(?:nereden|nasıl)\s+(?:bak|bul|gör)/i.test(text);
  }
  function isStepConfirmation(query){
    return /^(?:girdim|açtım|bastım|tıkladım|seçtim|yaptım|tamam|devam|oldu|hazır|sonraki(?:\s+adım)?)[.! ]*$/i.test(normalized(query));
  }
  function role(){
    const text=document.querySelector(".brand-user-identity span")?.textContent||document.querySelector(".authenticated-user-chip")?.textContent||"";
    const aliases=[
      ["Yönetici",/\b(?:Yönetici|Administrator|Admin)\b/i],
      ["Eğitmen",/\b(?:Eğitmen|Instructor|Teacher)\b/i],
      ["Öğrenci",/\b(?:Öğrenci|Student)\b/i],
      ["Veli",/\b(?:Veli|Parent|Guardian)\b/i]
    ];
    return aliases.find(([,pattern])=>pattern.test(text))?.[0]||"";
  }
  function fullName(){return document.querySelector(".brand-user-identity b")?.textContent?.trim()||""}
  function authenticated(){return Boolean(role()&&fullName())}
  function salutation(){
    const name=fullName().split(/\s+/)[0]||"";
    const suffix=role()==="Yönetici"?" Bey":"";
    return name?`${name}${suffix}`:"";
  }

  function addMessage(text,type="bot"){
    const box=document.querySelector(`#${ROOT_ID} .pire-guide-messages`);
    if(!box)return;
    const item=document.createElement("div");
    item.className=`pire-guide-message ${type}`;
    item.textContent=text;
    box.appendChild(item);
    box.scrollTop=box.scrollHeight;
  }

  function capabilityKindLabel(kind){
    const labels={info:ui("Bilgi","Info"),open:ui("Ekran","Open"),prepare:ui("Hazırla","Prepare")};
    return labels[kind]||labels.info;
  }

  function renderCapabilities(){
    const currentRole=role(),capability=roleCapabilities[currentRole];
    const box=document.querySelector(`#${ROOT_ID} .pire-guide-messages`);
    if(!box||!capability)return;
    box.querySelector(".pire-guide-capabilities")?.remove();
    const card=document.createElement("section");
    card.className="pire-guide-capabilities";
    card.setAttribute("aria-label",ui(`${currentRole} rolü için asistan özellikleri`,`${currentRole} assistant capabilities`));
    const title=document.createElement("h3");title.textContent=ui("Neler Yapabilirim?","What Can I Do?");card.appendChild(title);
    const intro=document.createElement("p");intro.textContent=capability.intro;card.appendChild(intro);
    const list=document.createElement("div");list.className="pire-guide-capability-list";
    capability.items.forEach(item=>{
      const button=document.createElement("button");button.type="button";button.className="pire-guide-capability";button.dataset.capabilityPrompt=item.prompt;
      const kind=document.createElement("span");kind.className="pire-guide-capability-kind";kind.textContent=capabilityKindLabel(item.kind);
      const name=document.createElement("b");name.textContent=item.title;
      const description=document.createElement("small");description.textContent=item.description;
      button.append(kind,name,description);list.appendChild(button);
    });
    card.appendChild(list);box.appendChild(card);box.scrollTop=box.scrollHeight;
  }

  function welcomeMessage(){
    return ui(`Merhabalar ${salutation()}. Bugün ne yapmak istiyorsunuz? Yapmak istediğiniz işlemi yazın; size adım adım göstereyim.`,`Hello ${salutation()}. What would you like to do today? Describe the action and I will guide you step by step.`);
  }

  function resetConversation(){
    const confirmed=window.confirm(ui("Mevcut asistan sohbeti ve devam eden rehber temizlenecek. Yeni sohbet başlatılsın mı?","The current assistant conversation and active guide will be cleared. Start a new conversation?"));
    if(!confirmed)return;
    removeHighlight();
    state.guide=null;state.suggestedGuide=null;state.step=0;state.pending=false;state.lastIntent="";state.lastTask=null;
    const root=document.getElementById(ROOT_ID),messages=root?.querySelector(".pire-guide-messages");
    if(messages)messages.innerHTML="";
    root?.querySelector(".pire-guide-quick")?.classList.remove("visible");
    const input=root?.querySelector(".pire-guide-form input"),submit=root?.querySelector(".pire-guide-form button");
    if(input){input.value="";input.disabled=false}if(submit)submit.disabled=false;
    addMessage(welcomeMessage());
    root?.querySelector(".pire-guide-panel")?.classList.add("open");
    input?.focus();
  }

  function removeHighlight(){
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(el=>el.classList.remove(HIGHLIGHT_CLASS));
    document.querySelectorAll(".pire-guide-tip").forEach(el=>el.remove());
  }

  function visible(el){const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=="hidden"&&s.display!=="none"}
  function findTarget(names){
    const selectors="button,summary,a,label,[role='button'],input,select,textarea";
    const elements=[...document.querySelectorAll(selectors)].filter(visible);
    for(const name of names||[]){
      const wanted=normalized(name);
      const exact=elements.find(el=>normalized(el.innerText||el.textContent||el.getAttribute("aria-label")||el.getAttribute("placeholder"))===wanted);
      if(exact)return exact;
      const partial=elements.find(el=>normalized(el.innerText||el.textContent||el.getAttribute("aria-label")||el.getAttribute("placeholder")).includes(wanted));
      if(partial)return partial;
    }
    return null;
  }

  const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
  async function waitForTarget(names,timeout=2600){
    const started=Date.now();
    while(Date.now()-started<timeout){
      const target=findTarget(names);
      if(target)return target;
      await wait(100);
    }
    return null;
  }

  function preparedField(){
    const scopes=[...document.querySelectorAll('[role="dialog"],.modal,.drawer,form')].filter(visible).reverse();
    for(const scope of scopes){
      const field=[...scope.querySelectorAll('input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled])')].find(visible);
      if(field)return field;
    }
    return null;
  }

  async function executeSafeAction(guide,button){
    const action=safeActions[guide?.id];
    if(!action||!guide.roles.includes(role()))return;
    button.disabled=true;
    removeHighlight();
    let keepPanelClosed=false;
    try{
      document.querySelector(`#${ROOT_ID} .pire-guide-panel`)?.classList.remove('open');
      for(const names of action.path){
        const target=await waitForTarget(names);
        if(!target)throw new Error(`“${names[0]}” düğmesini ekranda bulamadım.`);
        if(/kaydet|sil|onayla|öde|tamamla/i.test(normalized(target.textContent||target.getAttribute('aria-label'))))throw new Error('Son onay düğmesine güvenlik nedeniyle otomatik basılmadı.');
        target.click();
        await wait(420);
      }
      state.step=Math.min(action.path.length,guide.steps.length-1);
      if(action.form){
        const field=await waitForTarget(["Ad Soyad","Öğrenci","Tarih","Tutar","Açıklama"],1200)||preparedField();
        if(field){
          field.scrollIntoView({behavior:'smooth',block:'center'});
          field.classList.add(HIGHLIGHT_CLASS);
          const rect=field.getBoundingClientRect(),tip=document.createElement('div');
          tip.className='pire-guide-tip';
          tip.textContent=ui('Form hazır. Bilgileri doldurun; son kaydı siz onaylayın.','Form ready. Complete the fields and confirm the final save yourself.');
          tip.style.left=`${Math.max(10,Math.min(window.innerWidth-270,rect.left))}px`;
          tip.style.top=`${Math.min(window.innerHeight-55,rect.bottom+13)}px`;
          document.body.appendChild(tip);
        }
        keepPanelClosed=true;
      }
      addMessage(action.form
        ?ui('✓ Form hazırlandı. Bilgileri kontrol ederek doldurun; Kaydet düğmesine yalnızca siz basabilirsiniz.','✓ The form is ready. Review and complete the fields; only you can select Save.')
        :ui('✓ İlgili ekran açıldı. Kayıtları burada inceleyebilirsiniz.','✓ The requested screen is open. You can review the records here.'),'success');
    }catch(error){
      addMessage(`${error.message} İsterseniz “Bu adımı göster” ile manuel rehberi sürdürebilirsiniz.`);
    }finally{
      button.disabled=false;
      if(!keepPanelClosed)document.querySelector(`#${ROOT_ID} .pire-guide-panel`)?.classList.add('open');
    }
  }

  function showStep(){
    removeHighlight();
    if(!state.guide)return;
    const step=state.guide.steps[state.step];
    const target=findTarget(step.targets);
    document.querySelectorAll(".pire-guide-card li").forEach((li,index)=>li.classList.toggle("active",index===state.step));
    if(!target){
      addMessage(`Bu adım için ekranda “${step.targets?.[0]||"ilgili alan"}” öğesini göremedim. Önce önceki adımı tamamlayın veya ilgili menüyü açın.`);
      document.querySelector(`#${ROOT_ID} .pire-guide-panel`)?.classList.add("open");
      return;
    }
    document.querySelector(`#${ROOT_ID} .pire-guide-panel`)?.classList.remove("open");
    target.scrollIntoView({behavior:"smooth",block:"center",inline:"center"});
    setTimeout(()=>{
      target.classList.add(HIGHLIGHT_CLASS);
      const rect=target.getBoundingClientRect(),tip=document.createElement("div");
      tip.className="pire-guide-tip";
      tip.textContent=`${state.step+1}. adım: Buraya basın`;
      tip.style.left=`${Math.max(10,Math.min(window.innerWidth-270,rect.left))}px`;
      tip.style.top=`${Math.min(window.innerHeight-55,rect.bottom+13)}px`;
      document.body.appendChild(tip);
    },280);
  }

  function advanceStep(){
    if(!state.guide)return;
    removeHighlight();
    if(state.step>=state.guide.steps.length-1){
      const completedGuide=state.guide;
      document.querySelectorAll(".pire-guide-card li").forEach(li=>li.classList.remove("active"));
      const completionMessage=completedGuide.completion==="view"
        ?`✓ Rehber başarıyla tamamlandı.\nDoğru ekrana ulaştınız; ${completedGuide.title.toLocaleLowerCase("tr-TR")} bilgilerini burada inceleyebilirsiniz.`
        :"✓ Rehber başarıyla tamamlandı.\nİşlemi kaydettiyseniz sonucu ekrandaki işlem bildirimiyle kontrol edebilirsiniz.";
      addMessage(completionMessage,"success");
      document.querySelector(`#${ROOT_ID} .pire-guide-panel`)?.classList.add("open");
      state.guide=null;state.suggestedGuide=null;state.step=0;
      document.querySelector(`#${ROOT_ID} .pire-guide-quick`)?.classList.remove("visible");
      return;
    }
    state.step+=1;
    document.querySelectorAll(".pire-guide-card li").forEach((li,index)=>li.classList.toggle("active",index===state.step));
    window.setTimeout(showStep,650);
  }

  function renderGuide(guide){
    state.guide=guide;state.suggestedGuide=guide;state.step=0;
    const quick=document.querySelector(`#${ROOT_ID} .pire-guide-quick`);if(quick){quick.classList.add("visible");quick.textContent="İlk adımı ekranda göster"}
    const box=document.querySelector(`#${ROOT_ID} .pire-guide-messages`);
    const card=document.createElement("div");
    card.className="pire-guide-card";
    const action=safeActions[guide.id];
    card.innerHTML=`<b>${guide.title}</b><ol>${guide.steps.map((s,i)=>`<li class="${i===0?"active":""}">${s.text}</li>`).join("")}</ol>${action?`<button type="button" class="pire-guide-prepare" data-guide-action="prepare">${action.label}</button>`:""}<div class="pire-guide-controls"><button type="button" data-guide-action="show" class="primary">Bu adımı göster</button><button type="button" data-guide-action="next">Sonraki adım</button></div>`;
    box.appendChild(card);box.scrollTop=box.scrollHeight;
  }

  function offerGuide(guide){
    state.guide=null;state.suggestedGuide=guide;state.step=0;
    const quick=document.querySelector(`#${ROOT_ID} .pire-guide-quick`);
    if(quick){quick.classList.add("visible");quick.textContent="Adım adım göster"}
  }

  function accessToken(){
    try{
      for(let index=0;index<localStorage.length;index+=1){
        const key=localStorage.key(index)||"";
        if(!/^sb-.*-auth-token$/.test(key))continue;
        const stored=JSON.parse(localStorage.getItem(key)||"null");
        const token=stored?.access_token||stored?.currentSession?.access_token;
        if(token)return token;
      }
    }catch(_){ }
    return "";
  }

  function requestAI(token,body){
    return new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest();
      xhr.open("POST","/api/assistant",true);
      xhr.setRequestHeader("content-type","application/json");
      xhr.setRequestHeader("Authorization",`Bearer ${token}`);
      xhr.timeout=30_000;
      xhr.onload=()=>{
        let payload={};
        try{payload=JSON.parse(xhr.responseText||"{}")}catch(_){ }
        if(xhr.status>=200&&xhr.status<300)resolve(payload);
        else reject(new Error(`${payload.error||"AI yanıtı alınamadı."}${payload.serviceCode?` (Hata kodu: ${payload.serviceCode})`:""}`));
      };
      xhr.onerror=()=>reject(new Error("AI servisine bağlanılamadı."));
      xhr.ontimeout=()=>reject(new Error("AI yanıtı zaman aşımına uğradı."));
      xhr.send(JSON.stringify(body));
    });
  }

  function isMonthlyExpenseQuestion(query){
    const text=normalized(query);
    return /(bu|içinde bulunduğumuz|şu) ay/.test(text)&&/(harca|gider|masraf)/.test(text)&&/(ne kadar|toplam|tutar)/.test(text);
  }

  async function monthlyExpenseSummary(){
    const response=await window.fetch("/api/expenses");
    if(!response.ok)throw new Error("Gider kayıtları şu anda okunamadı.");
    const payload=await response.json();
    const now=new Date();
    const month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const expenses=(Array.isArray(payload)?payload:payload?.expenses)||[];
    const current=expenses.filter(item=>String(item?.expenseDate||"").slice(0,7)===month);
    return {metric:"monthly_expenses",month,total:current.reduce((sum,item)=>sum+Number(item?.amount||0),0),count:current.length};
  }

  async function institutionSummary(){
    const endpoints=["students","catalog","lessons","expenses","finance","packages","attendance","settings"];
    const values=await Promise.all(endpoints.map(async endpoint=>{
      try{const response=await window.fetch(`/api/${endpoint}`);return response.ok?await response.json():{}}catch(_){return {}}
    }));
    const [studentsData,catalogData,lessonsData,expensesData,financeData,packagesData,attendanceData,settingsData]=values;
    const students=studentsData?.students||[],teachers=catalogData?.teachers||[],courses=catalogData?.courses||[];
    const lessons=lessonsData?.lessons||[],expenses=expensesData?.expenses||[],packages=packagesData?.packages||[];
    const attendance=attendanceData?.attendance||[],today=new Date().toISOString().slice(0,10),month=today.slice(0,7);
    const monthExpenses=expenses.filter(item=>String(item?.expenseDate||"").slice(0,7)===month);
    return {
      metric:"institution_overview",generatedDate:today,
      students:{total:students.length,active:students.filter(item=>item?.status==="Aktif").length,frozen:students.filter(item=>item?.status==="Kayıt dondurmuş").length,archived:students.filter(item=>item?.status==="Ayrılmış").length},
      teachers:{total:teachers.length,active:teachers.filter(item=>item?.status==="Aktif").length},
      courses:{total:courses.length},
      lessons:{total:lessons.length,today:lessons.filter(item=>item?.lessonDate===today).length,planned:lessons.filter(item=>["Planlandı","Yaklaşıyor"].includes(item?.status)).length,completed:lessons.filter(item=>item?.status==="Tamamlandı").length},
      expenses:{month,count:monthExpenses.length,total:monthExpenses.reduce((sum,item)=>sum+Number(item?.amount||0),0)},
      finance:{totalCharged:Number(financeData?.summary?.totalCharged||0),totalPaid:Number(financeData?.summary?.totalPaid||0),totalBalance:Number(financeData?.summary?.totalBalance||0)},
      packages:{total:packages.length,active:packages.filter(item=>item?.status==="Aktif").length},
      attendance:{total:attendance.length,present:attendance.filter(item=>item?.status==="Katıldı").length,absent:attendance.filter(item=>/gelmedi/i.test(item?.status||"")).length},
      institution:{name:String(settingsData?.settings?.institutionName||"").slice(0,100)}
    };
  }

  async function askAI(query){
    const token=accessToken();
    if(!token){
      addMessage(ui("Bu soru hazır rehberlerin dışında. Güvenli AI yanıtı için gerçek Pİ-RE/Supabase oturumuyla giriş yapmanız gerekiyor; yerel kurtarma oturumu AI erişimi vermez.","This question is outside the built-in guides. Sign in with a real Pİ-RE/Supabase session for a secure AI answer; a local recovery session does not grant AI access."));
      return;
    }
    const summary=isMonthlyExpenseQuestion(query)?await monthlyExpenseSummary():(role()==="Yönetici"?await institutionSummary():undefined);
    const payload=await requestAI(token,{question:query,language:interfaceLanguage(),page:document.querySelector(".primary-nav .active")?.textContent?.trim()||"",...(state.lastTask?{previousTask:{intent:state.lastTask.intent,targetModule:state.lastTask.targetModule}}:{}),...(summary?{summary}:{})});
    const answer=payload.answer||ui("Bu soru için yanıt üretilemedi.","No answer could be generated for this question.");
    addMessage(answer);
    const intentGuides={"student.create":"student","teacher.create":"teacher","lesson.create":"lesson","payment.create":"payment","finance.receivables":"view-receivables","self.payment.view":"view-own-payments"};
    const moduleGuides={teachers:"view-teachers",students:"view-students",expenses:"view-expenses",payments:"payment",lessons:"today-lessons",attendance:"attendance",makeups:"makeup",reports:"report",accounts:"account",settings:"settings"};
    const ownLessonGuide=payload.task?.intent==="lesson.view"&&["Öğrenci","Veli"].includes(role())?"view-own-lessons":"";
    const guideId=ownLessonGuide||intentGuides[payload.task?.intent]||moduleGuides[payload.task?.targetModule];
    const relatedGuide=guides.find(item=>item.id===guideId);
    state.lastTask=payload.task||null;
    if(relatedGuide&&relatedGuide.roles.includes(role())){
      state.lastIntent=relatedGuide.id;
      if(payload.task?.needsGuide){
        addMessage(ui("Bu işlemi gerçek panel üzerinde gösterebilirim. Aşağıdaki “Adım adım göster” düğmesine basın.","I can show this action in the actual panel. Select “Show step by step” below."));
        offerGuide(relatedGuide);
      }
    }else if(/adım\s+adım|yönlendir|göster/i.test(query)){
      addMessage(ui("Bu işlem için güvenilir bir panel rehberi henüz tanımlı değil. Yanlış bir alanı göstermemek için otomatik yönlendirme başlatamıyorum.","A verified panel guide is not available for this action yet, so I cannot start automatic guidance without risking a wrong direction."));
    }
  }

  async function answer(query){
    const currentRole=role();
    const normalizedQuery=normalized(query);
    if(isStepConfirmation(query)){
      if(state.guide){
        const isLast=state.step>=state.guide.steps.length-1;
        addMessage(isLast?"Tamam, rehberin son adımını da tamamladınız.":`Tamam, ${state.step+1}. adımı tamamladınız. Sıradaki adımı gösteriyorum.`);
        advanceStep();
      }else{
        addMessage("Şu anda devam eden bir rehber bulunmuyor. Yapmak istediğiniz işlemi yazarsanız ilgili adımları başlatabilirim.");
      }
      return;
    }
    const contextFollowup=isContextFollowup(query);
    if(contextFollowup&&state.lastIntent){
      const rememberedGuide=guides.find(item=>item.id===state.lastIntent);
      if(rememberedGuide&&rememberedGuide.roles.includes(currentRole)){
        addMessage(`${rememberedGuide.title} için sizi gerçek panel üzerinde adım adım yönlendireceğim.`);
        renderGuide(rememberedGuide);
        return;
      }
    }
    if(contextFollowup&&state.lastTask&&!state.lastIntent){
      addMessage("Önceki istek için çalıştırılabilir bir panel rehberi bulunmuyor. Yanlış yönlendirmemek için adım gösteremiyorum.");
      return;
    }
    if(!contextFollowup){
      state.lastIntent="";state.lastTask=null;state.guide=null;state.suggestedGuide=null;state.step=0;
      document.querySelector(`#${ROOT_ID} .pire-guide-quick`)?.classList.remove("visible");
      removeHighlight();
    }
    if(state.lastIntent==="monthly-expenses"&&/(nereden|nasıl).*(bak|gör|incele)|(?:bak|gör|incele).*(nerede|nasıl)|buna|bunu/i.test(normalized(query))){
      const guide=guides.find(item=>item.id==="view-expenses");
      if(currentRole!=="Yönetici"){addMessage("Kurum giderleri yalnızca doğrulanmış yönetici hesabıyla görüntülenebilir.");return}
      addMessage("Kurum giderlerini görüntülemek için sizi adım adım yönlendireceğim.");
      renderGuide(guide);
      return;
    }
    if(isMonthlyExpenseQuestion(query)){
      if(currentRole!=="Yönetici"){addMessage("Kurum gider toplamı yalnızca doğrulanmış yönetici hesabıyla görüntülenebilir.");return}
      try{await askAI(query)}catch(error){addMessage(error?.message||"Gider toplamı şu anda alınamıyor.")}
      return;
    }
    const guide=guides.find(item=>!item.id.startsWith("view-")&&item.match.test(normalizedQuery)&&(item.roles.includes(currentRole)||item.roles.length===0));
    if(guide){addMessage(`${guide.title} için sizi adım adım yönlendireceğim.`);renderGuide(guide);return}
    const blocked=guides.find(item=>item.match.test(normalizedQuery)&&!item.roles.includes(currentRole)&&item.roles.length>0);
    if(blocked){addMessage(`Bu işlem ${currentRole} rolünde kullanılamıyor. Yetkili bir yönetici hesabıyla giriş yapmanız gerekir.`);return}
    try{await askAI(query)}catch(error){addMessage(error?.message||"AI servisine şu anda ulaşılamıyor. Lütfen biraz sonra tekrar deneyin.")}
  }

  function build(){
    if(document.getElementById(ROOT_ID))return;
    injectStyle();
    const root=document.createElement("div");root.id=ROOT_ID;root.hidden=true;
    root.innerHTML=`<section class="pire-guide-panel" aria-label="Pİ-RE kullanım rehberi"><header class="pire-guide-head"><span class="pire-guide-mark"><img src="/pire-logo-clean.png" alt=""></span><div><b>Pİ-RE Rehber</b><small>Panel kullanım asistanı</small></div><button type="button" class="pire-guide-reset" aria-label="Yeni sohbet başlat" title="Yeni sohbet">↻</button><button type="button" class="pire-guide-close" aria-label="Rehberi kapat">×</button></header><div class="pire-guide-messages" aria-live="polite"></div><button type="button" class="pire-guide-quick">Adım adım göster</button><button type="button" class="pire-guide-capabilities-toggle">Neler Yapabilirim?</button><form class="pire-guide-form"><input type="text" aria-label="Ne yapmak istiyorsunuz?" placeholder="Ne yapmak istiyorsunuz?" autocomplete="off"><button type="submit" aria-label="Gönder">➜</button></form></section><span class="pire-guide-nudge" aria-hidden="true">Size nasıl yardımcı olabilirim?</span><button type="button" class="pire-guide-launcher" aria-label="Pİ-RE Rehberi aç" title="Pİ-RE Rehber"><img src="/pire-logo-clean.png" alt=""></button>`;
    document.body.appendChild(root);
    root.querySelector(".pire-guide-launcher").addEventListener("click",()=>root.querySelector(".pire-guide-panel").classList.toggle("open"));
    root.querySelector(".pire-guide-close").addEventListener("click",()=>{root.querySelector(".pire-guide-panel").classList.remove("open");removeHighlight()});
    root.querySelector(".pire-guide-reset").addEventListener("click",resetConversation);
    root.querySelector(".pire-guide-capabilities-toggle").addEventListener("click",renderCapabilities);
    root.querySelector(".pire-guide-messages").addEventListener("click",event=>{
      const prompt=event.target.closest("[data-capability-prompt]")?.dataset.capabilityPrompt;
      if(!prompt||state.pending)return;
      const input=root.querySelector(".pire-guide-form input");input.value=prompt;
      root.querySelector(".pire-guide-form").requestSubmit();
    });
    root.querySelector(".pire-guide-quick").addEventListener("click",()=>{
      const guide=state.suggestedGuide;if(!guide)return;
      if(state.guide!==guide)renderGuide(guide);
      showStep();
    });
    root.querySelector("form").addEventListener("submit",async event=>{
      event.preventDefault();
      if(state.pending)return;
      const input=root.querySelector("input"),button=root.querySelector(".pire-guide-form button"),query=input.value.trim();
      if(!query)return;
      addMessage(query,"user");input.value="";state.pending=true;input.disabled=true;button.disabled=true;
      try{await answer(query)}finally{state.pending=false;input.disabled=false;button.disabled=false;input.focus()}
    });
    root.addEventListener("click",event=>{
      const action=event.target.closest("[data-guide-action]")?.dataset.guideAction;
      if(action==="show")showStep();
      if(action==="next"&&state.guide)advanceStep();
      if(action==="prepare"&&state.guide)executeSafeAction(state.guide,event.target.closest('[data-guide-action]'));
    });
    document.addEventListener("click",event=>{
      if(!state.guide||!event.target.closest(`.${HIGHLIGHT_CLASS}`))return;
      advanceStep();
    },true);
  }

  let lastAuth=false;
  function sync(){
    build();
    const root=document.getElementById(ROOT_ID),isAuth=authenticated();
    root.hidden=!isAuth;
    if(isAuth&&!lastAuth){
      const messages=root.querySelector(".pire-guide-messages");
      messages.innerHTML="";
      addMessage(welcomeMessage());
      root.querySelector(".pire-guide-panel").classList.add("open");
    }
    if(!isAuth){removeHighlight();root.querySelector(".pire-guide-panel")?.classList.remove("open")}
    lastAuth=isAuth;
  }

  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",sync):sync();
  new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true});
})();
