/* Pİ-RE gider takibi gün / hafta / ay görünümü */
(()=>{
  const state={mode:'month',date:new Date()};
  const trMonths=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  const startOfWeek=date=>{const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d};
  const endOfWeek=date=>{const d=startOfWeek(date);d.setDate(d.getDate()+6);return d};
  const parseDate=text=>{const m=String(text).match(/(\d{2})\.(\d{2})\.(\d{4})/);return m?new Date(+m[3],+m[2]-1,+m[1]):null};
  const money=text=>Number(String(text).replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'))||0;
  const formatMoney=value=>'₺'+Math.round(value).toLocaleString('tr-TR');
  function expensePage(){return [...document.querySelectorAll('h1,h2')].some(x=>x.textContent.trim()==='Gider Takibi')}
  function rows(){return [...document.querySelectorAll('tbody tr')].map(row=>({row,date:parseDate(row.cells?.[0]?.textContent),amount:money(row.cells?.[row.cells.length-1]?.textContent)})).filter(x=>x.date)}
  function inPeriod(date){if(state.mode==='day')return sameDay(date,state.date);if(state.mode==='week'){const a=startOfWeek(state.date),b=endOfWeek(state.date);return date>=a&&date<=b}return date.getFullYear()===state.date.getFullYear()&&date.getMonth()===state.date.getMonth()}
  function periodLabel(){if(state.mode==='day')return `${state.date.getDate()} ${trMonths[state.date.getMonth()]} ${state.date.getFullYear()}`;if(state.mode==='week'){const a=startOfWeek(state.date),b=endOfWeek(state.date);return a.getMonth()===b.getMonth()?`${a.getDate()}–${b.getDate()} ${trMonths[b.getMonth()]} ${b.getFullYear()}`:`${a.getDate()} ${trMonths[a.getMonth()]} – ${b.getDate()} ${trMonths[b.getMonth()]} ${b.getFullYear()}`}return `${trMonths[state.date.getMonth()]} ${state.date.getFullYear()}`}
  function move(amount){const d=new Date(state.date);if(state.mode==='day')d.setDate(d.getDate()+amount);else if(state.mode==='week')d.setDate(d.getDate()+amount*7);else d.setMonth(d.getMonth()+amount);state.date=d;apply()}
  function findCard(){const table=document.querySelector('tbody')?.closest('table');return table?.parentElement||null}
  function ensureControls(){
    if(!expensePage()||document.querySelector('.pire-expense-periods'))return;
    const card=findCard();if(!card)return;
    const controls=document.createElement('div');controls.className='pire-expense-periods';
    controls.innerHTML='<div class="pire-expense-modes" role="group" aria-label="Gider görünümü"><button type="button" data-mode="day">Gün</button><button type="button" data-mode="week">Hafta</button><button type="button" data-mode="month">Ay</button></div><div class="pire-expense-navigation"><button type="button" data-move="-1" aria-label="Önceki dönem">←</button><button type="button" data-today>Bugün</button><strong data-period></strong><button type="button" data-move="1" aria-label="Sonraki dönem">→</button></div>';
    const table=card.querySelector('table');card.insertBefore(controls,table);
    controls.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.mode){state.mode=button.dataset.mode;apply()}else if(button.dataset.move)move(Number(button.dataset.move));else if(button.hasAttribute('data-today')){state.date=new Date();apply()}});
  }
  function updateHeading(label){const heading=[...document.querySelectorAll('h2,h3')].find(x=>/giderleri$/i.test(x.textContent.trim()));if(heading&&heading.textContent!==label+' giderleri')heading.textContent=label+' giderleri'}
  function updateTotal(total){const card=findCard();if(!card)return;const totalBox=[...card.querySelectorAll('div,span,p')].find(x=>/^Toplam\s*[₺\d]/.test(x.textContent.trim())&&x.children.length<=2);const strong=totalBox?.querySelector('strong,b');if(strong)strong.textContent=formatMoney(total)}
  function apply(){ensureControls();const controls=document.querySelector('.pire-expense-periods');if(!controls)return;controls.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));const label=periodLabel();controls.querySelector('[data-period]').textContent=label;let total=0,visible=0;rows().forEach(item=>{const show=inPeriod(item.date);item.row.hidden=!show;if(show){visible++;total+=Math.abs(item.amount)}});updateHeading(label);updateTotal(total);let empty=document.querySelector('.pire-expense-empty');if(!empty){empty=document.createElement('div');empty.className='pire-expense-empty';empty.textContent='Bu dönemde gider kaydı bulunmuyor.';findCard()?.appendChild(empty)}empty.hidden=visible>0}
  let queued=false;function scan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(expensePage()){ensureControls();apply()}})}
  scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();