(()=>{
'use strict';
if(window.__PIRE_LOGIN_SCREEN_FIX132__)return;
window.__PIRE_LOGIN_SCREEN_FIX132__=true;

const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'};

function ensureStyle(){
  if(document.getElementById('pire-login-screen-fix132-style'))return;
  const s=document.createElement('style');
  s.id='pire-login-screen-fix132-style';
  s.textContent=`
[data-pire-login132-modal="1"]{
  width:min(920px,calc(100vw - 32px))!important;
  max-height:min(92vh,820px)!important;
  padding:30px 36px 32px!important;
  border-radius:26px!important;
  border:1px solid rgba(214,181,95,.28)!important;
  background:linear-gradient(180deg,rgba(18,20,19,.985),rgba(12,14,13,.99))!important;
  box-shadow:0 28px 90px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.025)!important;
  overflow:auto!important;
}
[data-pire-login132-head="1"]{margin:0 0 24px!important;max-width:760px!important}
[data-pire-login132-title="1"]{font-size:clamp(34px,3.2vw,48px)!important;line-height:1.02!important;letter-spacing:-.045em!important;margin:8px 0 12px!important}
[data-pire-login132-subtitle="1"]{font-size:15px!important;line-height:1.65!important;max-width:660px!important;margin:0!important;color:rgba(235,231,220,.58)!important}
[data-pire-login132-roles="1"]{
  display:grid!important;
  grid-template-columns:repeat(4,minmax(0,1fr))!important;
  gap:12px!important;
  margin:24px 0 28px!important;
}
[data-pire-login132-role="1"]{
  min-width:0!important;
  width:100%!important;
  min-height:142px!important;
  height:142px!important;
  padding:18px 17px!important;
  border-radius:14px!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:flex-start!important;
  justify-content:space-between!important;
  text-align:left!important;
  box-sizing:border-box!important;
  transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease!important;
}
[data-pire-login132-role="1"]:hover{transform:translateY(-2px)!important;border-color:rgba(214,181,95,.38)!important}
[data-pire-login132-role="1"][data-pire-selected="1"]{background:linear-gradient(145deg,rgba(214,181,95,.16),rgba(214,181,95,.07))!important;border-color:rgba(214,181,95,.72)!important;box-shadow:inset 0 0 0 1px rgba(214,181,95,.08)!important}
[data-pire-login132-form="1"]{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:14px 16px!important;margin-top:0!important}
[data-pire-login132-field="1"]{min-width:0!important;width:100%!important;margin:0!important}
[data-pire-login132-field="1"] input{width:100%!important;min-height:62px!important;height:62px!important;box-sizing:border-box!important;border-radius:12px!important;padding:0 16px!important;font-size:16px!important}
[data-pire-login132-field="1"]>span,[data-pire-login132-field="1"]>label{display:block!important;margin-bottom:8px!important;font-size:13px!important}
[data-pire-login132-wide="1"]{grid-column:1/-1!important}
[data-pire-login132-submit="1"]{grid-column:1/-1!important;width:100%!important;min-height:64px!important;height:64px!important;border-radius:12px!important;margin-top:4px!important;font-size:15px!important;font-weight:800!important;padding:0 20px!important}
[data-pire-login132-helperrow="1"]{grid-column:1/-1!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;min-height:28px!important;margin:0!important}
[data-pire-login132-footer="1"]{grid-column:1/-1!important;text-align:center!important;margin-top:2px!important}
[data-pire-login132-close="1"]{width:46px!important;height:46px!important;min-width:46px!important;border-radius:12px!important;display:grid!important;place-items:center!important}
@media(max-width:820px){
 [data-pire-login132-modal="1"]{padding:24px 20px 26px!important}
 [data-pire-login132-roles="1"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 [data-pire-login132-form="1"]{grid-template-columns:1fr!important}
 [data-pire-login132-wide="1"],[data-pire-login132-submit="1"],[data-pire-login132-helperrow="1"],[data-pire-login132-footer="1"]{grid-column:1!important}
}
@media(max-width:520px){
 [data-pire-login132-roles="1"]{grid-template-columns:1fr!important}
 [data-pire-login132-role="1"]{height:112px!important;min-height:112px!important}
}
`;
  document.head.appendChild(s);
}

function findModal(){
  const title=[...document.querySelectorAll('h1,h2,h3')].find(el=>visible(el)&&norm(el.textContent).includes('Rolünüzü seçin'));
  if(!title)return null;
  let modal=title.parentElement;
  while(modal&&modal!==document.body){
    const r=modal.getBoundingClientRect();
    const txt=norm(modal.textContent);
    if(r.width>620&&r.height>420&&txt.includes('Yönetici')&&txt.includes('Eğitmen')&&txt.includes('Öğrenci')&&txt.includes('Veli'))break;
    modal=modal.parentElement;
  }
  if(!modal||modal===document.body)return null;
  return {modal,title};
}

function markRoleCards(modal){
  const roleNames=['Yönetici','Eğitmen','Öğrenci','Veli'];
  const cards=roleNames.map(name=>[...modal.querySelectorAll('button,[role="button"],div')].find(el=>{
    if(!visible(el))return false;
    const t=norm(el.textContent);
    if(!t.startsWith(name))return false;
    const r=el.getBoundingClientRect();
    return r.width>110&&r.width<260&&r.height>90&&r.height<220;
  })).filter(Boolean);
  const uniq=[...new Set(cards)];
  if(uniq.length<4)return;
  let parent=uniq[0].parentElement;
  while(parent&&parent!==modal&&!uniq.every(x=>parent.contains(x)))parent=parent.parentElement;
  if(parent&&parent!==modal)parent.setAttribute('data-pire-login132-roles','1');
  uniq.forEach(card=>{
    card.setAttribute('data-pire-login132-role','1');
    const active=card.getAttribute('aria-pressed')==='true'||String(card.className).toLowerCase().includes('active')||getComputedStyle(card).borderColor.includes('214');
    if(active)card.setAttribute('data-pire-selected','1');else card.removeAttribute('data-pire-selected');
  });
}

function markForm(modal){
  const phone=[...modal.querySelectorAll('input')].find(el=>visible(el)&&((el.type||'').toLowerCase()==='tel'||/5xx|telefon/i.test(el.placeholder||'')));
  const pass=[...modal.querySelectorAll('input')].find(el=>visible(el)&&el.type==='password');
  if(!phone||!pass)return;
  let form=phone.closest('form')||phone.parentElement;
  if(!form)return;
  form.setAttribute('data-pire-login132-form','1');
  [phone,pass].forEach(input=>{
    const wrap=input.closest('label')||input.parentElement;
    if(wrap)wrap.setAttribute('data-pire-login132-field','1');
  });
  const submit=[...form.querySelectorAll('button')].find(b=>/olarak giriş yap/i.test(norm(b.textContent)));
  if(submit)submit.setAttribute('data-pire-login132-submit','1');
  const remember=[...form.querySelectorAll('label,div')].find(el=>/Beni hatırla/i.test(norm(el.textContent))&&el.querySelector('input[type="checkbox"]'));
  const support=[...form.querySelectorAll('a,button,span')].find(el=>norm(el.textContent)==='Giriş desteği');
  if(remember||support){
    let row=remember?.parentElement||support?.parentElement;
    if(row&&row!==form)row.setAttribute('data-pire-login132-helperrow','1');
  }
  const firstAdmin=[...form.querySelectorAll('a,button')].find(el=>/İlk yönetici hesabını oluştur/i.test(norm(el.textContent)));
  if(firstAdmin){const wrap=firstAdmin.parentElement;if(wrap)wrap.setAttribute('data-pire-login132-footer','1')}
}

function markHeader(modal,title){
  modal.setAttribute('data-pire-login132-modal','1');
  title.setAttribute('data-pire-login132-title','1');
  const p=[...modal.querySelectorAll('p')].find(el=>visible(el)&&/çalışma alanına giriş/i.test(norm(el.textContent)));
  if(p)p.setAttribute('data-pire-login132-subtitle','1');
  const head=title.parentElement;if(head)head.setAttribute('data-pire-login132-head','1');
  const close=[...modal.querySelectorAll('button')].find(b=>{const t=norm(b.textContent);return t==='×'||t==='✕'||b.getAttribute('aria-label')?.toLowerCase().includes('kapat')});
  if(close)close.setAttribute('data-pire-login132-close','1');
}

function enhance(){
  ensureStyle();
  const found=findModal();
  if(!found)return;
  markHeader(found.modal,found.title);
  markRoleCards(found.modal);
  markForm(found.modal);
}

let timer;
const schedule=()=>{clearTimeout(timer);timer=setTimeout(enhance,40)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed']});
})();