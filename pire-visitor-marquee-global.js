(()=>{
'use strict';if(window.__PIRE_VISITOR_MARQUEE_GLOBAL__)return;window.__PIRE_VISITOR_MARQUEE_GLOBAL__=true;
const items=[
['Akademik Koçluk','Akademik Koçluk'],
['Enstrüman Eğitimi','Enstrüman Eğitimi'],
['Prodüktörlük','Prodüktörlük ve Stüdyo Kaydı'],
['Stüdyo Kaydı','Prodüktörlük ve Stüdyo Kaydı'],
['Organizasyon','Organizasyon'],
['İletişim','İletişim']
];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const find=label=>[...document.querySelectorAll('button,a,[role="button"]')].find(el=>norm(el.textContent)===label);
function isVisitor(){return !!(find('Giriş Yap')||find('Sign In'))}
function go(label){const target=find(label);if(target){target.click();requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}))}}
function style(){if(document.getElementById('pire-global-marquee-style'))return;const s=document.createElement('style');s.id='pire-global-marquee-style';s.textContent=`
#pire-global-marquee{width:100%;overflow:hidden;white-space:nowrap;background:#0d0f0d;border-block:1px solid rgba(214,181,95,.18);position:relative;z-index:30}
#pire-global-marquee .pgm-track{display:inline-flex;align-items:center;gap:42px;padding:20px 0;animation:pgm-slide 26s linear infinite;will-change:transform}
#pire-global-marquee:hover .pgm-track{animation-play-state:paused}
#pire-global-marquee .pgm-link{border:0;background:none;color:#ded8ca;font:800 13px/1.2 inherit;letter-spacing:.14em;text-transform:uppercase;padding:4px 0;cursor:pointer;white-space:nowrap}
#pire-global-marquee .pgm-link:hover,#pire-global-marquee .pgm-link:focus-visible{color:#d6b55f;outline:none;text-decoration:underline;text-underline-offset:5px}
#pire-global-marquee .pgm-star{color:#d6b55f;font-size:18px;pointer-events:none}
body>.pvh-marquee,#pire-vh2>.pvh-marquee{display:none!important}
@keyframes pgm-slide{to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){#pire-global-marquee .pgm-track{animation:none!important}}
`;document.head.appendChild(s)}
function markup(){const one=items.map(([text,target])=>`<button type="button" class="pgm-link" data-target="${target}">${text}</button><span class="pgm-star">✦</span>`).join('');return `<div class="pgm-track">${one}${one}</div>`}
function mount(){if(!isVisitor())return;style();let bar=document.getElementById('pire-global-marquee');if(!bar){bar=document.createElement('div');bar.id='pire-global-marquee';bar.innerHTML=markup();bar.addEventListener('click',e=>{const b=e.target.closest('.pgm-link');if(b)go(b.dataset.target)})}
const home=find('Ana Sayfa');if(!home)return;let nav=home.parentElement;while(nav.parentElement&&nav.parentElement!==document.body){const r=nav.getBoundingClientRect();if(r.width>window.innerWidth*.8&&r.top<300)break;nav=nav.parentElement}
if(nav.parentElement&&bar.previousElementSibling!==nav)nav.insertAdjacentElement('afterend',bar)
}
let t;const mo=new MutationObserver(()=>{clearTimeout(t);t=setTimeout(mount,80)});if(document.body){mount();mo.observe(document.body,{childList:true,subtree:true})}else addEventListener('DOMContentLoaded',()=>{mount();mo.observe(document.body,{childList:true,subtree:true})},{once:true});setTimeout(mount,500);setTimeout(mount,1500);
})();