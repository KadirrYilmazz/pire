(()=>{
'use strict';if(window.__PIRE_VISITOR_NAV_LAYOUT_V16__)return;window.__PIRE_VISITOR_NAV_LAYOUT_V16__=true;
const labels=['Ana Sayfa','Akademik Koçluk','Enstrüman Eğitimi','Prodüktörlük ve Stüdyo Kaydı','Organizasyon','İletişim'];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect(),st=getComputedStyle(el);return r.width>0&&r.height>0&&st.display!=='none'&&st.visibility!=='hidden'&&st.opacity!=='0'};
const controls=()=>[...document.querySelectorAll('button,a,[role="button"]')];
const findVisible=label=>controls().find(el=>norm(el.textContent)===label&&visible(el)&&!el.closest('#pire-visitor-nav-fixed'))||null;
const findAny=label=>controls().find(el=>norm(el.textContent)===label&&!el.closest('#pire-visitor-nav-fixed'))||null;
const isVisitor=()=>!!findVisible('Giriş Yap')&&!findVisible('Çıkış Yap');
function cleanup(){
 document.getElementById('pire-visitor-nav-fixed')?.remove();
 document.querySelectorAll('[data-pire-original-visitor-nav="1"]').forEach(nav=>{nav.style.removeProperty('visibility');nav.style.removeProperty('pointer-events');nav.removeAttribute('data-pire-original-visitor-nav')});
 document.querySelectorAll('[data-pire-visitor-header="1"]').forEach(h=>{h.style.removeProperty('position');h.removeAttribute('data-pire-visitor-header')});
}
function getInfo(){
 const home=findVisible('Ana Sayfa');if(!home)return null;const nav=home.parentElement;if(!nav)return null;
 const logo=[...document.querySelectorAll('img')].filter(visible).find(img=>{const r=img.getBoundingClientRect();return r.top<280&&r.width>=45&&r.width<=150&&r.height>=45&&r.height<=150});if(!logo)return null;
 let brand=logo.parentElement;while(brand&&brand!==document.body){const r=brand.getBoundingClientRect(),txt=norm(brand.textContent);if(txt.includes('Pİ-RE')&&r.width<460&&r.height<220)break;brand=brand.parentElement}if(!brand||brand===document.body)return null;
 let header=brand;while(header&&header!==document.body&&!header.contains(nav))header=header.parentElement;if(!header||header===document.body)return null;
 while(header.parentElement&&header.parentElement!==document.body){const r=header.getBoundingClientRect();if(r.width>innerWidth*.85&&r.top<300&&r.height<340)break;header=header.parentElement}
 return {nav,brand,header};
}
function makeNav(){
 const wrap=document.createElement('div');wrap.id='pire-visitor-nav-fixed';
 wrap.style.cssText='position:absolute;display:flex;align-items:center;gap:1px;z-index:90;white-space:nowrap;';
 labels.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.target=label;b.style.cssText=`font-size:17px;line-height:1.2;min-height:70px;padding:${i===labels.length-1?'0 10px':'0 16px'};margin:0;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;border:0;background:transparent;color:inherit;cursor:pointer;font-family:inherit;font-weight:inherit;`;
 const original=findAny(label);if(original&&(original.getAttribute('aria-current')||String(original.className).toLowerCase().includes('active'))){b.style.background='rgba(214,181,95,.10)';b.style.boxShadow='inset 0 -1px 0 rgba(214,181,95,.85)';b.style.fontWeight='800'}
 b.addEventListener('click',()=>findAny(label)?.click());wrap.appendChild(b)});return wrap;
}
function apply(){
 if(!isVisitor()){cleanup();return}
 const info=getInfo();if(!info)return;const {nav,brand,header}=info;
 nav.setAttribute('data-pire-original-visitor-nav','1');nav.style.setProperty('visibility','hidden','important');nav.style.setProperty('pointer-events','none','important');
 if(getComputedStyle(header).position==='static'){header.style.setProperty('position','relative','important');header.setAttribute('data-pire-visitor-header','1')}
 let fixed=document.getElementById('pire-visitor-nav-fixed');if(!fixed){fixed=makeNav();header.appendChild(fixed)}
 const hr=header.getBoundingClientRect(),br=brand.getBoundingClientRect();fixed.style.left=`${Math.round(br.right-hr.left+18)}px`;fixed.style.top=`${Math.round(br.top-hr.top+(br.height-70)/2)}px`;
}
let raf=0;const rerun=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply)};const mo=new MutationObserver(rerun);
function start(){apply();mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']});setInterval(apply,250)}
if(document.body)start();else addEventListener('DOMContentLoaded',start,{once:true});addEventListener('resize',rerun);
})();