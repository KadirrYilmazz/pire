/*
 * Pİ-RE site geneli arka plan müziği.
 * Parça: Classical Vibes 5 — Grigoriy Nuzhny, 2:03.
 * Lisans: Mixkit Stock Music Free License, https://mixkit.co/license/#musicFree
 * Kaynak: https://mixkit.co/free-stock-music/instrument/piano/
 */
(()=>{
  const STORAGE_KEY='pire-background-music-muted';
  const TRACK_URL='/pire-background-piano.mp3';
  const DEFAULT_VOLUME=0.16;
  const ICON='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path class="pire-music-wave pire-music-wave-near" d="M15 9a4.3 4.3 0 0 1 0 6"></path><path class="pire-music-wave pire-music-wave-far" d="M18 6a8.5 8.5 0 0 1 0 12"></path><path class="pire-music-muted-line" d="m3 3 18 18"></path></svg>';
  let audio=null,queued=false,unlockBound=false;

  const isMuted=()=>{try{return localStorage.getItem(STORAGE_KEY)==='true'}catch(_){return false}};
  const saveMuted=value=>{try{localStorage.setItem(STORAGE_KEY,String(value))}catch(_){}};

  function player(){
    if(audio)return audio;
    audio=new Audio(TRACK_URL);
    audio.preload='none';
    audio.loop=true;
    audio.volume=DEFAULT_VOLUME;
    audio.setAttribute('playsinline','');
    return audio;
  }

  function updateButtons(){
    const muted=isMuted();
    document.querySelectorAll('.pire-music-toggle').forEach(button=>{
      button.classList.toggle('is-muted',muted);
      button.setAttribute('aria-pressed',String(!muted));
      button.setAttribute('aria-label',muted?'Arka plan müziğini aç':'Arka plan müziğini sessize al');
      button.title=muted?'Müziği aç':'Müziği sessize al';
    });
  }

  function play(){
    if(isMuted())return;
    const attempt=player().play();
    if(attempt&&typeof attempt.catch==='function')attempt.catch(()=>bindUnlock());
  }

  function unlock(event){
    if(event.target?.closest?.('.pire-music-toggle'))return;
    if(isMuted())return;
    const attempt=player().play();
    if(attempt&&typeof attempt.then==='function')attempt.then(unbindUnlock).catch(()=>{});
    else unbindUnlock();
  }

  function bindUnlock(){
    if(unlockBound)return;
    unlockBound=true;
    document.addEventListener('pointerdown',unlock,true);
    document.addEventListener('keydown',unlock,true);
    document.addEventListener('touchstart',unlock,true);
  }

  function unbindUnlock(){
    if(!unlockBound)return;
    unlockBound=false;
    document.removeEventListener('pointerdown',unlock,true);
    document.removeEventListener('keydown',unlock,true);
    document.removeEventListener('touchstart',unlock,true);
  }

  function toggle(event){
    event.stopPropagation();
    const nextMuted=!isMuted();
    saveMuted(nextMuted);
    if(nextMuted){if(audio)audio.pause();unbindUnlock()}
    else play();
    updateButtons();
  }

  function placeButton(){
    document.querySelectorAll('.app-shell .navbar-tools').forEach(tools=>{
      if(tools.querySelector('.pire-music-toggle'))return;
      const button=document.createElement('button');
      button.type='button';
      button.className='pire-music-toggle navbar-icon-button';
      button.innerHTML=ICON;
      button.addEventListener('click',toggle);
      const notifications=tools.querySelector('.notification-wrap');
      const firstControl=tools.querySelector('.navbar-icon-button, .visitor-login-trigger');
      if(notifications)notifications.insertAdjacentElement('beforebegin',button);
      else if(firstControl)firstControl.insertAdjacentElement('beforebegin',button);
      else tools.appendChild(button);
    });
    updateButtons();
  }

  function queuePlacement(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;placeButton()});
  }

  function boot(){
    queuePlacement();
    new MutationObserver(queuePlacement).observe(document.body,{childList:true,subtree:true});
    if(!isMuted()){bindUnlock();play()}
    window.addEventListener('storage',event=>{
      if(event.key!==STORAGE_KEY)return;
      if(isMuted()){if(audio)audio.pause();unbindUnlock()}
      else{bindUnlock();play()}
      updateButtons();
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
