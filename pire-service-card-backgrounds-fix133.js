(()=>{
  'use strict';
  if(window.__PIRE_SERVICE_CARD_BACKGROUNDS_FIX133__)return;
  window.__PIRE_SERVICE_CARD_BACKGROUNDS_FIX133__=true;

  const images={
    academic:"/academic-coaching.webp",
    production:"/production-studio.webp",
    event:"/organization.webp"
  };

  function apply(){
    if(!document.querySelector('.app-shell.visitor-mode'))return;
    for(const [key,url] of Object.entries(images)){
      const card=document.querySelector(`#pire-vh2 .pvh-card[data-go="${key}"]`);
      const media=card?.querySelector('.pvh-card-media');
      if(!media)continue;
      media.style.backgroundImage=`url('${url}')`;
      media.style.backgroundSize='cover';
      media.style.backgroundPosition=key==='academic'?'center 42%':key==='production'?'center 55%':'center 50%';
      media.style.backgroundRepeat='no-repeat';
      media.style.opacity='1';
      media.style.filter='none';
      media.style.imageRendering='auto';
    }
  }

  let raf=0;
  const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply)};
  apply();
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',apply,{once:true});
})();