(()=>{
'use strict';if(window.__PIRE_VISITOR_NAV_LAYOUT_V5__)return;window.__PIRE_VISITOR_NAV_LAYOUT_V5__=true;
const labels=['Ana Sayfa','Akademik Koçluk','Enstrüman Eğitimi','Prodüktörlük ve Stüdyo Kaydı','Organizasyon','İletişim'];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const find=label=>[...document.querySelectorAll('button,a,[role="button"]')].find(el=>norm(el.textContent)===label);
function lca(a,b){if(!a||!b)return null;const seen=new Set();for(let x=a;x;x=x.parentElement)seen.add(x);for(let y=b;y;y=y.parentElement)if(seen.has(y))return y;return null}
function apply(){
 const items=labels.map(find);if(items.some(x=>!x))return;
 const nav=items[0].parentElement;if(!nav)return;
 const logo=[...document.querySelectorAll('img')].find(img=>{const r=img.getBoundingClientRect();return r.top<260&&r.width>=45&&r.width<=140&&r.height>=45&&r.height<=140});if(!logo)return;
 let brand=logo.parentElement;while(brand&&brand!==document.body){const r=brand.getBoundingClientRect(),txt=norm(brand.textContent);if(txt.includes('Pİ-RE')&&r.width<420&&r.height<180)break;brand=brand.parentElement}if(!brand||brand===document.body)return;
 const header=lca(brand,nav);if(!header||header===document.body)return;
 const hr=header.getBoundingClientRect(),br=brand.getBoundingClientRect();
 header.style.setProperty('position','relative','important');
 nav.style.setProperty('position','absolute','important');
 nav.style.setProperty('left',`${Math.max(0,br.right-hr.left+28)}px`,'important');
 nav.style.setProperty('top',`${Math.max(0,br.top-hr.top+(br.height-nav.getBoundingClientRect().height)/2)}px`,'important');
 nav.style.setProperty('width','auto','important');
 nav.style.setProperty('margin','0','important');
 nav.style.setProperty('display','flex','important');
 nav.style.setProperty('align-items','center','important');
 nav.style.setProperty('gap','2px','important');
 items.forEach(el=>{el.style.setProperty('font-size','17px','important');el.style.setProperty('line-height','1.2','important');el.style.setProperty('min-height','70px','important');el.style.setProperty('padding','0 18px','important');el.style.setProperty('margin','0','important');el.style.setProperty('white-space','nowrap','important');el.style.setProperty('display','inline-flex','important');el.style.setProperty('align-items','center','important');el.style.setProperty('justify-content','center','important');el.style.setProperty('border-radius','12px','important')});
}
let t;const rerun=()=>{clearTimeout(t);t=setTimeout(apply,80)};const mo=new MutationObserver(rerun);if(document.body){apply();mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']})}else addEventListener('DOMContentLoaded',()=>{apply();mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']})},{once:true});addEventListener('resize',rerun);setTimeout(apply,400);setTimeout(apply,1200);
})();