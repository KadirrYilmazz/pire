const test=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('./ui/dom-fixture.cjs');
const visitor=`<main class="app-shell visitor-mode"><aside class="sidebar"><button class="visitor-login-trigger">Giriş Yap</button><nav><button>Ana Sayfa</button><button>Akademik Koçluk</button><button>Enstrüman Eğitimi</button><button>Prodüktörlük ve Stüdyo Kaydı</button><button>Organizasyon</button><button>İletişim</button></nav></aside><section class="content"><section class="visitor-workspace"><h1>Matematik ve müziğin aynı ritimde buluştuğu yer.</h1></section></section></main>`;
const admin=`<main class="app-shell"><aside class="sidebar"><div class="navbar-tools"></div><nav><button>İletişim</button><button>Öğrenciler</button></nav></aside><section class="content"><h1>Yönetim</h1></section></main>`;
function button(ui,label){return [...ui.document.querySelectorAll('.sidebar button')].find(el=>el.textContent===label)}
function detail(html=visitor){return fixture(html,'pire-visitor-detail-v1.js',{},window=>{window.Element.prototype.scrollIntoView=()=>{}})}

test('administrator contact menu never creates visitor detail sections',t=>{
  const ui=detail(admin);t.after(()=>ui.close());button(ui,'İletişim').click();ui.flush();ui.mutate();
  assert.equal(ui.document.querySelector('#pire-vdetail'),null);assert.equal(ui.document.querySelector('.content h1').textContent,'Yönetim');
});
test('all five visitor service pages still open and home clears the detail',t=>{
  const ui=detail();t.after(()=>ui.close());
  for(const label of ['Akademik Koçluk','Enstrüman Eğitimi','Prodüktörlük ve Stüdyo Kaydı','Organizasyon','İletişim']){
    button(ui,label).click();ui.flush();assert.ok(ui.document.querySelector('#pire-vdetail .pvd-title'));
    assert.equal(ui.document.querySelectorAll('#pire-vdetail').length,1);
  }
  button(ui,'Ana Sayfa').click();ui.mutate();assert.equal(ui.document.querySelector('#pire-vdetail'),null);
});
test('login removes mounted visitor detail and does not reinsert it on admin mutations',t=>{
  const ui=detail();t.after(()=>ui.close());button(ui,'Akademik Koçluk').click();ui.flush();
  assert.ok(ui.document.querySelector('#pire-vdetail'));
  ui.document.querySelector('.app-shell').outerHTML=admin;ui.mutate();
  assert.equal(ui.document.querySelector('#pire-vdetail'),null);
  button(ui,'İletişim').click();ui.mutate();assert.equal(ui.document.querySelector('#pire-vdetail'),null);
  ui.document.querySelector('.app-shell').outerHTML=visitor;ui.mutate();button(ui,'İletişim').click();ui.flush();assert.ok(ui.document.querySelector('#pire-vdetail'));
});
test('delayed visitor clicks cannot inject public content after login',t=>{
  const ui=detail();t.after(()=>ui.close());button(ui,'Organizasyon').click();
  ui.document.querySelector('.app-shell').outerHTML=admin;ui.flush();ui.mutate();
  assert.equal(ui.document.querySelector('#pire-vdetail'),null);
});
test('visitor homepage additions are removed on login and return on logout',t=>{
  let disconnected=0;
  const ui=fixture(visitor,'pire-visitor-home-v2.js',{},window=>{window.IntersectionObserver=class{observe(){}disconnect(){disconnected++}}});t.after(()=>ui.close());
  assert.ok(ui.document.querySelector('#pire-vh2'));
  ui.document.querySelector('.app-shell').outerHTML=admin;ui.mutate();assert.equal(ui.document.querySelector('#pire-vh2'),null);assert.equal(disconnected,1);
  ui.document.querySelector('.app-shell').outerHTML=visitor;ui.mutate();assert.equal(ui.document.querySelectorAll('#pire-vh2').length,1);
});

test('canonical public page with navbar tools keeps both visitor enhancements available',t=>{
  const fs=require('node:fs'),path=require('node:path');
  const html=fs.readFileSync(path.join(__dirname,'..','pire-hydration-main.html'),'utf8');
  const ui=fixture(html,'pire-visitor-home-v2.js',{},window=>{window.IntersectionObserver=class{observe(){}disconnect(){}};window.Element.prototype.scrollIntoView=()=>{}});t.after(()=>ui.close());
  assert.ok(ui.document.querySelector('.navbar-tools'));
  assert.ok(ui.document.querySelector('#pire-vh2'));
  ui.window.eval(fs.readFileSync(path.join(__dirname,'..','pire-visitor-detail-v1.js'),'utf8'));
  button(ui,'İletişim').click();ui.flush();assert.ok(ui.document.querySelector('#pire-vdetail'));
});
