(()=>{
'use strict';if(window.__PIRE_VISITOR_NAV_LAYOUT_V9__)return;window.__PIRE_VISITOR_NAV_LAYOUT_V9__=true;
const labels=['Ana Sayfa','Akademik Koçluk','Enstrüman Eğitimi','Prodüktörlük ve Stüdyo Kaydı','Organizasyon','İletişim'];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const all=label=>[...document.querySelectorAll('button,a,[role="button"]')].filter(el=>norm(el.textContent)===label);
const find=label=>all(label)[0];
const visitor=()=>!!([...document.querySelectorAll('button,a,[role="button"]')].find(el=>norm(el.textContent)==='Giriş Yap'))&&!([...document.querySelectorAll('button,a,[role="button"]')].find(el=>norm(el.textContent)==='Çıkış Yap'));
const props=['position','left','top','margin','width','display','align-items','gap','z-index','transform','font-size','line-height','min-height','padding','white-space','justify-content','border-radius'];
function clearStyles(){
 labels.forEach(label=>all(label).forEach(el=>props.forEach(p=>el.style.removeProperty(p))));
 const home=find('Ana Sayfa');const nav=home?.parentElement;if(nav)props.forEach(p=>nav.style.removeProperty(p));
}
function apply(){
 if(!visitor()){clearStyles();return}
 const items=labels.map(find);if(items.some(x=>!x))return;
 const nav=items[0].parentElement;if(!nav)return;
 const logo=[...document.querySelectorAll('img')].find(img=>{const r=img.getBoundingClientRect();return r.top<260&&r.width>=45&&r.width<=140&&r.height>=45&&r.height<=140});if(!logo)return;
 let brand=logo.parentElement;while(brand&&brand!==document.body){const r=brand.getBoundingClientRect(),txt=norm(brand.textContent);if(txt.includes('Pİ-RE')&&r.width<420&&r.height<180)break;brand=brand.parentElement}if(!brand||brand===document.body)return;
 nav.style.setProperty('position','relative','important');nav.style.setProperty('left','auto','important');nav.style.setProperty('top','auto','important');nav.style.setProperty('margin','0','important');nav.style.setProperty('width','max-content','important');nav.style.setProperty('display','flex','important');nav.style.setProperty('align-items','center','important');nav.style.setProperty('gap','1px','important');nav.style.setProperty('z-index','60','important');nav.style.setProperty('transform','none','important');
 const br=brand.getBoundingClientRect(),nr=nav.getBoundingClientRect();const dx=(br.right+14)-nr.left;const dy=(br.top+br.height/2)-(nr.top+nr.height/2);nav.style.setProperty('transform',`translate(${Math.round(dx)}px,${Math.round(dy)}px)`,'important');
 items.forEach((el,i)=>{el.style.setProperty('font-size','17px','important');el.style.setProperty('line-height','1.2','important');el.style.setProperty('min-height','70px','important');el.style.setProperty('padding',i===items.length-1?'0 10px':'0 17px','important');el.style.setProperty('margin','0','important');el.style.setProperty('white-space','nowrap','important');el.style.setProperty('display','inline-flex','important');el.style.setProperty('align-items','center','important');el.style.setProperty('justify-content','center','important');el.style.setProperty('border-radius','12px','important')});
}
let raf=0;const rerun=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply)};const mo=new MutationObserver(rerun);
if(document.body){apply();mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']})}else addEventListener('DOMContentLoaded',()=>{apply();mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']})},{once:true});
addEventListener('resize',rerun);setInterval(apply,250);
})();