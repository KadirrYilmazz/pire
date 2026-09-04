(()=>{
'use strict';if(window.__PIRE_VISITOR_NAV_LAYOUT__)return;window.__PIRE_VISITOR_NAV_LAYOUT__=true;
const labels=['Ana Sayfa','Akademik Koçluk','Enstrüman Eğitimi','Prodüktörlük ve Stüdyo Kaydı','Organizasyon','İletişim'];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
function find(label){return [...document.querySelectorAll('button,a,[role="button"]')].find(el=>norm(el.textContent)===label)}
function apply(){
 const items=labels.map(find);if(items.some(x=>!x))return;
 const home=items[0], nav=home.parentElement;if(!nav||nav.dataset.pireNavMoved)return;
 let logo=[...document.querySelectorAll('img')].find(img=>{const r=img.getBoundingClientRect();return r.width>45&&r.width<150&&r.top<220});
 if(!logo)return;
 let brand=logo.parentElement;while(brand&&brand!==document.body){const r=brand.getBoundingClientRect();if(r.width>170&&r.width<420&&r.height>70&&r.height<180)break;brand=brand.parentElement}if(!brand||brand===document.body)return;
 const host=brand.parentElement;if(!host)return;
 nav.dataset.pireNavMoved='1';host.classList.add('pire-visitor-brandnav-row');brand.classList.add('pire-visitor-brand');nav.classList.add('pire-visitor-nav-inline');
 if(nav.parentElement!==host)host.insertBefore(nav,brand.nextSibling);
}
const style=document.createElement('style');style.textContent=`.pire-visitor-brandnav-row{display:flex!important;align-items:center!important;gap:34px!important;flex-wrap:nowrap!important}.pire-visitor-brand{flex:0 0 auto!important}.pire-visitor-nav-inline{display:flex!important;align-items:center!important;gap:4px!important;flex:1 1 auto!important;margin:0!important;padding:0!important;border:0!important;min-width:0!important}.pire-visitor-nav-inline>button,.pire-visitor-nav-inline>a,.pire-visitor-nav-inline>[role="button"]{white-space:nowrap!important}@media(max-width:1100px){.pire-visitor-brandnav-row{align-items:flex-start!important;flex-wrap:wrap!important;gap:12px 24px!important}.pire-visitor-nav-inline{flex-basis:100%!important;overflow-x:auto!important}}`;document.head.appendChild(style);
const mo=new MutationObserver(apply);if(document.body){apply();mo.observe(document.body,{childList:true,subtree:true})}else addEventListener('DOMContentLoaded',()=>{apply();mo.observe(document.body,{childList:true,subtree:true})},{once:true});
})();