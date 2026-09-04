(()=>{
'use strict';if(window.__PIRE_VISITOR_NAV_LAYOUT__)return;window.__PIRE_VISITOR_NAV_LAYOUT__=true;
const labels=['Ana Sayfa','Akademik Koçluk','Enstrüman Eğitimi','Prodüktörlük ve Stüdyo Kaydı','Organizasyon','İletişim'];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const find=label=>[...document.querySelectorAll('button,a,[role="button"]')].find(el=>norm(el.textContent)===label);
function apply(){
 const items=labels.map(find);if(items.some(x=>!x))return;
 const nav=items[0].parentElement;if(!nav)return;
 const logo=[...document.querySelectorAll('img')].find(img=>{const r=img.getBoundingClientRect(),alt=norm(img.alt).toLowerCase();return r.top<230&&(alt.includes('logo')||(r.width>=55&&r.width<=120&&r.height>=55&&r.height<=120))});if(!logo)return;
 let brand=logo.parentElement;while(brand&&brand!==document.body){const text=norm(brand.textContent);const r=brand.getBoundingClientRect();if(text.includes('Pİ-RE')&&r.width<500&&r.height<190)break;brand=brand.parentElement}if(!brand||brand===document.body)return;
 let header=brand.parentElement;while(header&&header!==document.body){const r=header.getBoundingClientRect();if(r.width>window.innerWidth*.75&&r.top<230&&r.height<240)break;header=header.parentElement}if(!header||header===document.body)return;
 let row=header.querySelector(':scope > .pire-brand-nav-row');if(!row){row=document.createElement('div');row.className='pire-brand-nav-row';header.insertBefore(row,brand);row.appendChild(brand)}
 if(nav.parentElement!==row)row.appendChild(nav);nav.classList.add('pire-visitor-nav-inline');brand.classList.add('pire-visitor-brand');
}
const style=document.createElement('style');style.textContent=`.pire-brand-nav-row{display:flex!important;align-items:center!important;gap:42px!important;width:100%!important;min-height:112px!important}.pire-visitor-brand{flex:0 0 auto!important;margin:0!important}.pire-visitor-nav-inline{display:flex!important;align-items:center!important;gap:3px!important;flex:1 1 auto!important;margin:0!important;padding:0!important;width:auto!important;border:0!important}.pire-visitor-nav-inline>button,.pire-visitor-nav-inline>a,.pire-visitor-nav-inline>[role="button"]{white-space:nowrap!important;margin-top:0!important;margin-bottom:0!important}@media(max-width:1100px){.pire-brand-nav-row{gap:18px!important;overflow-x:auto!important}.pire-visitor-nav-inline{min-width:max-content!important}}`;document.head.appendChild(style);
const mo=new MutationObserver(()=>requestAnimationFrame(apply));if(document.body){apply();mo.observe(document.body,{childList:true,subtree:true})}else addEventListener('DOMContentLoaded',()=>{apply();mo.observe(document.body,{childList:true,subtree:true})},{once:true});setTimeout(apply,500);setTimeout(apply,1500);
})();