(()=>{
  'use strict';
  if(window.__PIRE_SERVICE_CARD_BACKGROUNDS_FIX133__)return;
  window.__PIRE_SERVICE_CARD_BACKGROUNDS_FIX133__=true;

  const images={
    academic:"/academic-coaching.webp",
    production:"/production-studio.webp",
    event:"/organization.webp"
  };

  function ensureSharpStyle(){
    if(document.getElementById('pire-fix133-sharp-style'))return;
    const style=document.createElement('style');
    style.id='pire-fix133-sharp-style';
    style.textContent=`
      #pire-vh2 .pvh-card[data-go="academic"] .pvh-card-media,
      #pire-vh2 .pvh-card[data-go="production"] .pvh-card-media,
      #pire-vh2 .pvh-card[data-go="event"] .pvh-card-media{
        transform:none!important;
        opacity:1!important;
        filter:contrast(1.18) saturate(1.10) brightness(1.06)!important;
        image-rendering:auto;
        backface-visibility:hidden;
        will-change:auto;
      }
      #pire-vh2 .pvh-card[data-go="academic"]:hover .pvh-card-media,
      #pire-vh2 .pvh-card[data-go="production"]:hover .pvh-card-media,
      #pire-vh2 .pvh-card[data-go="event"]:hover .pvh-card-media{
        transform:none!important;
        opacity:1!important;
      }
    `;
    document.head.appendChild(style);
  }

  function apply(){
    if(!document.querySelector('.app-shell.visitor-mode'))return;
    ensureSharpStyle();
    for(const [key,url] of Object.entries(images)){
      const card=document.querySelector(`#pire-vh2 .pvh-card[data-go="${key}"]`);
      const media=card?.querySelector('.pvh-card-media');
      if(!media)continue;
      media.style.backgroundImage=`url('${url}')`;
      media.style.backgroundSize='cover';
      media.style.backgroundPosition=key==='academic'?'center 42%':key==='production'?'center 55%':'center 50%';
      media.style.backgroundRepeat='no-repeat';
      media.style.opacity='1';
      media.style.transform='none';
      media.style.filter='contrast(1.18) saturate(1.10) brightness(1.06)';
    }
  }

  let raf=0;
  const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply)};
  apply();
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',apply,{once:true});
})();