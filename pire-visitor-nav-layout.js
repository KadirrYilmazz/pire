(()=>{
'use strict';if(window.__PIRE_VISITOR_NAV_LAYOUT_V4__)return;window.__PIRE_VISITOR_NAV_LAYOUT_V4__=true;
const labels=['Ana Sayfa','Akademik Koçluk','Enstrüman Eğitimi','Prodüktörlük ve Stüdyo Kaydı','Organizasyon','İletişim'];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const find=label=>[...document.querySelectorAll('button,a,[role="button"]')].find(el=>norm(el.textContent)===label);
function apply(){
 const items=labels.map(find);if(items.some(x=>!x))return;
 items.forEach(el=>{
   el.style.setProperty('font-size','17px','important');
   el.style.setProperty('line-height','1.2','important');
   el.style.setProperty('min-height','70px','important');
   el.style.setProperty('padding-left','20px','important');
   el.style.setProperty('padding-right','20px','important');
   el.style.setProperty('margin-top','0','important');
   el.style.setProperty('margin-bottom','0','important');
   el.style.setProperty('white-space','nowrap','important');
   el.style.setProperty('display','inline-flex','important');
   el.style.setProperty('align-items','center','important');
   el.style.setProperty('justify-content','center','important');
   el.style.setProperty('border-radius','12px','important');
 });
}
let timer;const mo=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(apply,60)});
if(document.body){apply();mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-current']})}
else addEventListener('DOMContentLoaded',()=>{apply();mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-current']})},{once:true});
setInterval(apply,800);
})();