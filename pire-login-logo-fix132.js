(()=>{
'use strict';
if(window.__PIRE_LOGIN_LOGO_FIX132__)return;
window.__PIRE_LOGIN_LOGO_FIX132__=true;
const STYLE_ID='pire-login-logo-fix132-style';
if(!document.getElementById(STYLE_ID)){
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
.visitor-login-brand{display:flex!important;align-items:center!important;gap:14px!important}
.visitor-login-brand .pire-login-real-logo{width:58px!important;height:58px!important;min-width:58px!important;object-fit:contain!important;border-radius:50%!important;display:block!important;filter:drop-shadow(0 6px 16px rgba(0,0,0,.32))!important}
.visitor-login-brand .pire-login-old-mark{display:none!important}
@media(max-width:700px){.visitor-login-brand .pire-login-real-logo{width:52px!important;height:52px!important;min-width:52px!important}}
`;
  (document.head||document.documentElement).appendChild(s);
}
function mountLogo(){
  const brand=document.querySelector('.visitor-login-brand');
  if(!brand)return;
  if(brand.querySelector('.pire-login-real-logo'))return;
  const first=brand.firstElementChild;
  if(first)first.classList.add('pire-login-old-mark');
  const img=document.createElement('img');
  img.className='pire-login-real-logo';
  img.src='/pire-logo-clean.png';
  img.alt='Pİ-RE logosu';
  brand.insertBefore(img,first||brand.firstChild);
}
let timer;
const schedule=()=>{clearTimeout(timer);timer=setTimeout(mountLogo,30)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountLogo,{once:true});else mountLogo();
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();