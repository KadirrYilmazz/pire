(()=>{
'use strict';
if(window.__PIRE_LOGIN_SCREEN_FIX132_V3__)return;
window.__PIRE_LOGIN_SCREEN_FIX132_V3__=true;
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const visible=el=>{if(!el||!(el instanceof Element))return false;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'&&cs.opacity!=='0'};
const all=sel=>[...document.querySelectorAll(sel)];
function style(){
 if(document.getElementById('pire-login132-v3-style'))return;
 const s=document.createElement('style');s.id='pire-login132-v3-style';s.textContent=`
[data-pire-login132-modal="1"]{width:min(860px,calc(100vw - 32px))!important;max-width:860px!important;max-height:94vh!important;padding:28px 34px 26px!important;border-radius:24px!important;border:1px solid rgba(214,181,95,.34)!important;background:radial-gradient(circle at 12% 0%,rgba(214,181,95,.08),transparent 34%),linear-gradient(160deg,#171a18 0%,#0c0e0d 78%)!important;box-shadow:0 36px 120px rgba(0,0,0,.62),inset 0 1px rgba(255,255,255,.035)!important;box-sizing:border-box!important;overflow:auto!important}
[data-pire-login132-title="1"]{font-size:38px!important;line-height:1.02!important;letter-spacing:-.045em!important;margin:10px 0 10px!important;font-weight:780!important}
[data-pire-login132-subtitle="1"]{font-size:14px!important;line-height:1.55!important;color:rgba(240,236,226,.58)!important;margin:0 0 4px!important}
[data-pire-login132-roles="1"]{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;width:100%!important;margin:22px 0 22px!important}
[data-pire-login132-role="1"]{width:100%!important;min-width:0!important;height:92px!important;min-height:92px!important;padding:15px 16px!important;box-sizing:border-box!important;border-radius:13px!important;display:grid!important;grid-template-columns:34px 1fr!important;grid-template-rows:1fr 1fr!important;align-items:center!important;column-gap:12px!important;text-align:left!important;background:rgba(255,255,255,.018)!important;border:1px solid rgba(255,255,255,.08)!important;transition:.18s ease!important}
[data-pire-login132-role="1"]:hover{transform:translateY(-2px)!important;border-color:rgba(214,181,95,.48)!important;background:rgba(214,181,95,.055)!important}
[data-pire-login132-role="1"][data-pire-selected="1"]{border-color:#d6b55f!important;background:linear-gradient(135deg,rgba(214,181,95,.18),rgba(214,181,95,.065))!important;box-shadow:inset 0 0 0 1px rgba(214,181,95,.08),0 10px 28px rgba(0,0,0,.18)!important}
[data-pire-login132-role="1"]>*:first-child{grid-row:1/3!important}
[data-pire-login132-fields="1"]{display:grid!important;grid-template-columns:1fr!important;gap:12px!important;width:100%!important;align-items:end!important}
[data-pire-login132-field="1"]{width:100%!important;min-width:0!important;margin:0!important;box-sizing:border-box!important}
[data-pire-login132-field="1"] input{width:100%!important;height:56px!important;min-height:56px!important;box-sizing:border-box!important;border-radius:11px!important;padding-inline:16px!important;font-size:15px!important}
[data-pire-login132-field="1"]>span,[data-pire-login132-field="1"]>label{display:block!important;margin-bottom:7px!important;font-size:12px!important}
[data-pire-login132-helper="1"]{display:flex!important;align-items:center!important;justify-content:space-between!important;width:100%!important;min-height:30px!important;margin:6px 0 9px!important}
[data-pire-login132-submit="1"]{width:100%!important;height:58px!important;min-height:58px!important;border-radius:11px!important;padding:0 22px!important;margin:0!important;font-size:15px!important;font-weight:800!important;box-shadow:0 10px 26px rgba(214,181,95,.12)!important}
[data-pire-login132-adminlink="1"]{display:flex!important;justify-content:center!important;width:100%!important;margin:14px 0 7px!important}
[data-pire-login132-security="1"]{display:block!important;text-align:center!important;width:100%!important;margin:0 auto!important;max-width:700px!important;line-height:1.45!important;font-size:11px!important;opacity:.72!important}
[data-pire-login132-close="1"]{width:44px!important;height:44px!important;min-width:44px!important;border-radius:12px!important;display:grid!important;place-items:center!important}
@media(max-width:700px){[data-pire-login132-modal="1"]{padding:24px 20px!important}[data-pire-login132-roles="1"]{grid-template-columns:1fr!important}[data-pire-login132-title="1"]{font-size:34px!important}}
`;document.head.appendChild(s)
}
function exactText(text){return all('body *').find(el=>visible(el)&&norm(el.textContent)===text)||null}
function modalFromTitle(title){let el=title;while(el&&el!==document.body){const r=el.getBoundingClientRect(),t=norm(el.textContent);if(r.width>600&&r.height>430&&t.includes('Yönetici')&&t.includes('Eğitmen')&&t.includes('Öğrenci')&&t.includes('Veli')&&t.includes('Telefon numarası'))return el;el=el.parentElement}return null}
function roleCard(modal,name){const text=[...modal.querySelectorAll('*')].find(el=>visible(el)&&norm(el.textContent)===name);if(!text)return null;let el=text;while(el&&el!==modal){const r=el.getBoundingClientRect(),t=norm(el.textContent);if(r.width>120&&r.width<360&&r.height>70&&r.height<180&&t.includes(name))return el;el=el.parentElement}return text.closest('button,[role="button"]')}
function fieldWrap(input,modal){let el=input.parentElement,best=input.parentElement;while(el&&el!==modal){const r=el.getBoundingClientRect();if(r.width>250&&r.width<820&&r.height>50&&r.height<130)best=el;if(r.height>150)break;el=el.parentElement}return best}
function enhance(){style();const title=exactText('Rolünüzü seçin');if(!title)return;const modal=modalFromTitle(title);if(!modal)return;modal.setAttribute('data-pire-login132-modal','1');title.setAttribute('data-pire-login132-title','1');
 const subtitle=[...modal.querySelectorAll('*')].find(el=>visible(el)&&norm(el.textContent).startsWith('Size ayrılan çalışma alanına giriş yapmak'));if(subtitle)subtitle.setAttribute('data-pire-login132-subtitle','1');
 const close=all('button').find(b=>modal.contains(b)&&visible(b)&&(norm(b.textContent)==='×'||norm(b.textContent)==='✕'||/kapat/i.test(b.getAttribute('aria-label')||'')));if(close)close.setAttribute('data-pire-login132-close','1');
 const names=['Yönetici','Eğitmen','Öğrenci','Veli'];const cards=names.map(n=>roleCard(modal,n)).filter(Boolean);if(cards.length===4){let p=cards[0].parentElement;while(p&&p!==modal&&!cards.every(c=>p.contains(c)))p=p.parentElement;if(p)p.setAttribute('data-pire-login132-roles','1');cards.forEach((c,i)=>{c.setAttribute('data-pire-login132-role','1');const selected=c.getAttribute('aria-pressed')==='true'||String(c.className).toLowerCase().includes('active')||i===0&&/Yönetici olarak giriş yap/i.test(norm(modal.textContent));c.toggleAttribute('data-pire-selected',selected)})}
 const inputs=[...modal.querySelectorAll('input')].filter(visible);const phone=inputs.find(i=>(i.type||'').toLowerCase()==='tel'||/5xx|telefon/i.test(i.placeholder||''));const pass=inputs.find(i=>(i.type||'').toLowerCase()==='password');if(phone&&pass){const pw=fieldWrap(phone,modal),sw=fieldWrap(pass,modal);if(pw)pw.setAttribute('data-pire-login132-field','1');if(sw)sw.setAttribute('data-pire-login132-field','1');let row=pw?.parentElement;while(row&&row!==modal&&!(row.contains(pw)&&row.contains(sw)))row=row.parentElement;if(row&&row!==modal)row.setAttribute('data-pire-login132-fields','1')}
 const remember=[...modal.querySelectorAll('*')].find(el=>visible(el)&&norm(el.textContent)==='Beni hatırla');const support=[...modal.querySelectorAll('*')].find(el=>visible(el)&&norm(el.textContent)==='Giriş desteği');if(remember&&support){let row=remember.parentElement;while(row&&row!==modal&&!row.contains(support))row=row.parentElement;if(row&&row!==modal)row.setAttribute('data-pire-login132-helper','1')}
 const submit=[...modal.querySelectorAll('button')].find(b=>visible(b)&&/olarak giriş yap/i.test(norm(b.textContent)));if(submit)submit.setAttribute('data-pire-login132-submit','1');
 const admin=[...modal.querySelectorAll('a,button')].find(el=>visible(el)&&/İlk yönetici hesabını oluştur/i.test(norm(el.textContent)));if(admin)admin.parentElement?.setAttribute('data-pire-login132-adminlink','1');
 const sec=[...modal.querySelectorAll('*')].find(el=>visible(el)&&/Supabase Auth üzerinden güvenli/i.test(norm(el.textContent)));if(sec)sec.setAttribute('data-pire-login132-security','1');
}
let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(enhance,30)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed','style']});
})();