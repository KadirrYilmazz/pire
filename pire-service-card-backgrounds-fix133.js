(()=>{
  'use strict';
  const images={
    academic:'/academic-coaching.webp?v=6',
    production:'/production-studio.webp?v=6',
    event:'/organization.webp?v=6'
  };

  function mountMedia(media,url,key){
    let img=media.querySelector('img[data-pire-fix133]');
    if(!img){
      media.innerHTML='';
      img=document.createElement('img');
      img.setAttribute('data-pire-fix133','1');
      img.alt='';
      img.decoding='async';
      img.loading='eager';
      Object.assign(img.style,{
        position:'absolute',inset:'0',width:'100%',height:'100%',
        objectFit:'cover',display:'block',opacity:'1',filter:'none',transform:'none'
      });
      media.appendChild(img);
      const shade=document.createElement('span');
      shade.setAttribute('data-pire-fix133-shade','1');
      Object.assign(shade.style,{
        position:'absolute',inset:'0',display:'block',pointerEvents:'none',
        background:'linear-gradient(180deg,rgba(5,7,5,.06) 10%,rgba(5,7,5,.18) 48%,rgba(5,7,5,.76) 100%)'
      });
      media.appendChild(shade);
    }
    if(img.getAttribute('src')!==url) img.setAttribute('src',url);
    img.style.objectPosition=key==='academic'?'center 42%':key==='production'?'center 55%':'center 50%';
    Object.assign(media.style,{
      background:'none',opacity:'1',filter:'none',transform:'none',position:'absolute',inset:'0'
    });
  }

  function apply(){
    const root=document.querySelector('#pire-vh2');
    if(!root)return;
    for(const [key,url] of Object.entries(images)){
      const card=root.querySelector(`.pvh-card[data-go="${key}"]`);
      const media=card?.querySelector('.pvh-card-media');
      if(media)mountMedia(media,url,key);
    }
  }

  let raf=0;
  const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply)};
  apply();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',apply,{once:true});
  window.addEventListener('pageshow',apply);
})();