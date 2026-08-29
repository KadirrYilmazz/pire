/* Pİ-RE cari alacak / tahsilat alt sekmeleri */
(()=>{
  const KEY='pire-payment-tab-v1';
  const tabs=[
    {id:'summary',label:'Özet',selector:'.payment-flow-summary'},
    {id:'open',label:'Açık Alacaklar',selector:'.collection-priority'},
    {id:'collections',label:'Tahsilatlar',selector:'.monthly-collections'},
    {id:'relations',label:'Ders / Paket',selector:'.finance-analysis'}
  ];
  let active=sessionStorage.getItem(KEY)||'summary';

  function workspace(){return document.querySelector('.payments-workspace')}
  function renameHeading(){
    const heading=[...document.querySelectorAll('h1')].find(x=>x.textContent.trim()==='Ödeme Takibi');
    if(heading)heading.textContent='Cari Alacak / Tahsilatlar';
    return heading||[...document.querySelectorAll('h1')].find(x=>/Cari Alacak\s*\/\s*Tahsilatlar/.test(x.textContent));
  }
  function show(id){
    if(!tabs.some(x=>x.id===id))id='summary';active=id;sessionStorage.setItem(KEY,id);
    const root=workspace();if(!root)return;
    tabs.forEach(tab=>{
      const section=root.querySelector(tab.selector);if(section)section.hidden=tab.id!==id;
      const button=document.querySelector(`.pire-payment-tabs [data-tab="${tab.id}"]`);
      if(button){button.classList.toggle('active',tab.id===id);button.setAttribute('aria-selected',String(tab.id===id))}
    });
  }
  function positionNav(nav,header,heading){
    const headerBox=header.getBoundingClientRect(),titleBox=heading.parentElement.getBoundingClientRect();
    const gap=34,minWidth=560,left=titleBox.right+gap,right=headerBox.right;
    if(right-left>=minWidth){
      nav.classList.remove('compact-row');
      nav.style.left=`${window.scrollX+left}px`;nav.style.top=`${window.scrollY+headerBox.top+Math.max(0,(headerBox.height-54)/2)}px`;nav.style.width=`${right-left}px`;
    }else{
      nav.classList.add('compact-row');
      nav.style.left=`${window.scrollX+headerBox.left}px`;nav.style.top=`${window.scrollY+headerBox.bottom+8}px`;nav.style.width=`${headerBox.width}px`;
    }
  }
  function enhance(){
    const root=workspace();
    if(!root){document.querySelector('.pire-payment-tabs')?.remove();return}
    const heading=renameHeading(),header=heading?.closest('header');
    let nav=document.querySelector('.pire-payment-tabs');
    if(!nav){
      nav=document.createElement('nav');nav.className='pire-payment-tabs';nav.setAttribute('aria-label','Cari alacak ve tahsilat bölümleri');nav.setAttribute('role','tablist');
      tabs.forEach(tab=>{const button=document.createElement('button');button.type='button';button.dataset.tab=tab.id;button.setAttribute('role','tab');button.innerHTML=`<span>${tab.label}</span>`;button.addEventListener('click',()=>show(tab.id));nav.appendChild(button)});
    }
    if(header&&nav.parentElement!==document.body)document.body.appendChild(nav);
    if(header)positionNav(nav,header,heading);
    show(active);
  }
  let queued=false;
  function scan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
  scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('resize',scan,{passive:true});addEventListener('scroll',scan,{passive:true});
})();
