(()=>{
'use strict';if(window.__PIRE_VISITOR_NAV_LAYOUT_V11__)return;window.__PIRE_VISITOR_NAV_LAYOUT_V11__=true;
const labels=['Ana Sayfa','Akademik Koçluk','Enstrüman Eğitimi','Prodüktörlük ve Stüdyo Kaydı','Organizasyon','İletişim'];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();const st=getComputedStyle(el);return r.width>0&&r.height>0&&st.display!=='none'&&st.visibility!=='hidden'};
const all=label=>[...document.querySelectorAll('button,a,[role="button"]')].filter(el=>norm(el.textContent)===label&&visible(el));
const find=label=>all(label)[0]||null;
const hasText=txt=>[...document.querySelectorAll('button,a,[role="button"]')].some(el=>norm(el.textContent).includes(txt)&&visible(el));
const visitor=()=>!hasText('Çıkış Yap')&&!hasText('Finans')&&!hasText('Öğrenciler');
const navProps=['position','left','right','top','bottom','margin','width','max-width','display','align-items','gap','z-index','transform','flex-wrap','overflow'];
const itemProps=['font-size','line-height','min-height','padding','margin','white-space','display','align-items','justify-content','border-radius'];
function cleanup(){
 const home=find('Ana Sayfa');const nav=home?.parentElement;if(nav){navProps.forEach(p=>nav.style.removeProperty(p));nav.removeAttribute('data-pire-visitor-nav')}
 labels.forEach(label=>all(label).forEach(el=>itemProps.forEach(p=>el.style.removeProperty(p))));
}
function apply(){
 if(!visitor()){cleanup();return}
 const items=labels.map(find);if(items.some(x=>!x))return;
 const nav=items[0].parentElement;if(!nav)return;
 const logo=[...document.querySelectorAll('img')].filter(visible).find(img=>{const r=img.getBoundingClientRect();return r.top<270&&r.width>=45&&r.width<=140&&r.height>=45&&r.height<=140});if(!logo)return;
 let brand=logo.parentElement;while(brand&&brand!==document.body){const r=brand.getBoundingClientRect(),txt=norm(brand.textContent);if(txt.includes('Pİ-RE')&&r.width<450&&r.height<200)break;brand=brand.parentElement}if(!brand||brand===document.body)return;
 nav.setAttribute('data-pire-visitor-nav','1');
 nav.style.setProperty('position','relative','important');nav.style.setProperty('left','auto','important');nav.style.setProperty('right','auto','important');nav.style.setProperty('top','auto','important');nav.style.setProperty('bottom','auto','important');nav.style.setProperty('margin','0','important');nav.style.setProperty('display','flex','important');nav.style.setProperty('align-items','center','important');nav.style.setProperty('gap','1px','important');nav.style.setProperty('z-index','70','important');nav.style.setProperty('flex-wrap','nowrap','important');nav.style.setProperty('overflow','visible','important');nav.style.setProperty('width','max-content','important');nav.style.setProperty('max-width','none','important');
 nav.style.setProperty('transform','none','important');
 const br=brand.getBoundingClientRect(),nr=nav.getBoundingClientRect();
 const dx=Math.round((br.right+18)-nr.left);const dy=Math.round((br.top+br.height/2)-(nr.top+nr.height/2));
 nav.style.setProperty('transform',`translate(${dx}px,${dy}px)`,'important');
 items.forEach((el,i)=>{el.style.setProperty('font-size','17px','important');el.style.setProperty('line-height','1.2','important');el.style.setProperty('min-height','70px','important');el.style.setProperty('padding',i===items.length-1?'0 10px':'0 16px','important');el.style.setProperty('margin','0','important');el.style.setProperty('white-space','nowrap','important');el.style.setProperty('display','inline-flex','important');el.style.setProperty('align-items','center','important');el.style.setProperty('justify-content','center','important');el.style.setProperty('border-radius','12px','important')});
}
let raf=0;const rerun=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply)};const mo=new MutationObserver(rerun);
if(document.body){apply();mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']})}else addEventListener('DOMContentLoaded',()=>{apply();mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']})},{once:true});
addEventListener('resize',rerun);setInterval(apply,250);
})();