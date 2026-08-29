/* Pİ-RE gider takibi gün / hafta / ay görünümü */
(()=>{
  const now=new Date();
  const nextMonth=new Date(now.getFullYear(),now.getMonth()+1,1);
  const monthValue=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  const state={mode:'month',date:now,category:'all',compare:false,compareA:monthValue(now),compareB:monthValue(nextMonth)};
  const trMonths=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const pad=n=>String(n).padStart(2,'0');
  const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  const startOfWeek=date=>{const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d};
  const endOfWeek=date=>{const d=startOfWeek(date);d.setDate(d.getDate()+6);return d};
  const parseDate=text=>{const m=String(text).match(/(\d{2})\.(\d{2})\.(\d{4})/);return m?new Date(+m[3],+m[2]-1,+m[1]):null};
  const money=text=>Number(String(text).replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'))||0;
  const formatMoney=value=>'₺'+Math.round(value).toLocaleString('tr-TR');

  function expensePage(){return [...document.querySelectorAll('h1,h2')].some(x=>x.textContent.trim()==='Gider Takibi')}
  function rows(){return [...document.querySelectorAll('tbody tr')].map(row=>({row,date:parseDate(row.cells?.[0]?.textContent),category:row.cells?.[2]?.textContent.trim()||'Kategorisiz',amount:money(row.cells?.[row.cells.length-1]?.textContent)})).filter(x=>x.date)}
  function categoryMatches(item){return state.category==='all'||item.category===state.category}
  function inPeriod(date){
    if(state.mode==='day')return sameDay(date,state.date);
    if(state.mode==='week'){const a=startOfWeek(state.date),b=endOfWeek(state.date);return date>=a&&date<=b}
    return date.getFullYear()===state.date.getFullYear()&&date.getMonth()===state.date.getMonth();
  }
  function periodLabel(){
    if(state.mode==='day')return `${state.date.getDate()} ${trMonths[state.date.getMonth()]} ${state.date.getFullYear()}`;
    if(state.mode==='week'){
      const a=startOfWeek(state.date),b=endOfWeek(state.date);
      return a.getMonth()===b.getMonth()?`${a.getDate()}–${b.getDate()} ${trMonths[b.getMonth()]} ${b.getFullYear()}`:`${a.getDate()} ${trMonths[a.getMonth()]} – ${b.getDate()} ${trMonths[b.getMonth()]} ${b.getFullYear()}`;
    }
    return `${trMonths[state.date.getMonth()]} ${state.date.getFullYear()}`;
  }
  function move(amount){
    const d=new Date(state.date);
    if(state.mode==='day')d.setDate(d.getDate()+amount);
    else if(state.mode==='week')d.setDate(d.getDate()+amount*7);
    else d.setMonth(d.getMonth()+amount);
    state.date=d;apply();
  }
  function findCard(){const table=document.querySelector('tbody')?.closest('table');return table?.parentElement||null}
  function ensureControls(){
    if(!expensePage()||document.querySelector('.pire-expense-periods'))return;
    const card=findCard();if(!card)return;
    const controls=document.createElement('div');controls.className='pire-expense-periods';
    controls.innerHTML=`<div class="pire-expense-control-row"><div class="pire-expense-modes" role="group" aria-label="Gider görünümü"><button type="button" data-mode="day">Gün</button><button type="button" data-mode="week">Hafta</button><button type="button" data-mode="month">Ay</button></div><label class="pire-expense-category"><span>Gider türü</span><select data-category><option value="all">Tüm giderler</option></select></label><button type="button" class="pire-expense-compare-trigger" data-compare>Ayları karşılaştır</button></div><div class="pire-expense-navigation"><button type="button" data-move="-1" aria-label="Önceki dönem">←</button><button type="button" data-today>Bugün</button><strong data-period></strong><button type="button" data-move="1" aria-label="Sonraki dönem">→</button></div>`;
    const table=card.querySelector('table');card.insertBefore(controls,table);
    const comparison=document.createElement('section');comparison.className='pire-expense-comparison';comparison.hidden=true;
    comparison.innerHTML=`<div class="pire-expense-compare-inputs"><label>Birinci ay<input type="month" data-compare-a value="${state.compareA}"></label><span>ile</span><label>İkinci ay<input type="month" data-compare-b value="${state.compareB}"></label></div><div class="pire-expense-compare-results"><article><span data-title-a>Birinci dönem</span><strong data-total-a>₺0</strong></article><article><span data-title-b>İkinci dönem</span><strong data-total-b>₺0</strong></article><article class="difference"><span>Değişim</span><strong data-difference>₺0</strong><small data-percentage>%0</small></article></div>`;
    controls.after(comparison);
    controls.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.dataset.mode){state.mode=button.dataset.mode;apply()}
      else if(button.dataset.move)move(Number(button.dataset.move));
      else if(button.hasAttribute('data-today')){state.date=new Date();apply()}
      else if(button.hasAttribute('data-compare')){state.compare=!state.compare;apply()}
    });
    controls.querySelector('[data-category]').addEventListener('change',event=>{state.category=event.target.value;apply()});
    comparison.addEventListener('change',event=>{if(event.target.matches('[data-compare-a]'))state.compareA=event.target.value;if(event.target.matches('[data-compare-b]'))state.compareB=event.target.value;apply()});
  }
  function fillCategories(items){
    const select=document.querySelector('[data-category]');if(!select)return;
    const categories=[...new Set(items.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));
    const signature=categories.join('|');if(select.dataset.signature===signature)return;
    select.dataset.signature=signature;select.innerHTML='<option value="all">Tüm giderler</option>'+categories.map(x=>`<option value="${x.replace(/"/g,'&quot;')}">${x}</option>`).join('');select.value=categories.includes(state.category)?state.category:'all';
  }
  function monthName(value){const [year,month]=value.split('-').map(Number);return `${trMonths[month-1]} ${year}`}
  function renderComparison(items){
    const panel=document.querySelector('.pire-expense-comparison'),trigger=document.querySelector('[data-compare]');if(!panel)return;
    panel.hidden=!state.compare;trigger?.classList.toggle('active',state.compare);if(!state.compare)return;
    const total=value=>{const [year,month]=value.split('-').map(Number);return items.filter(x=>categoryMatches(x)&&x.date.getFullYear()===year&&x.date.getMonth()===month-1).reduce((sum,x)=>sum+Math.abs(x.amount),0)};
    const a=total(state.compareA),b=total(state.compareB),difference=b-a,percentage=a?difference/a*100:(b?100:0);
    panel.querySelector('[data-title-a]').textContent=monthName(state.compareA);panel.querySelector('[data-title-b]').textContent=monthName(state.compareB);
    panel.querySelector('[data-total-a]').textContent=formatMoney(a);panel.querySelector('[data-total-b]').textContent=formatMoney(b);
    const diff=panel.querySelector('[data-difference]');diff.textContent=(difference>0?'+':difference<0?'−':'')+formatMoney(Math.abs(difference));diff.classList.toggle('increase',difference>0);diff.classList.toggle('decrease',difference<0);
    panel.querySelector('[data-percentage]').textContent=(percentage>0?'+':'')+'%'+Math.abs(percentage).toLocaleString('tr-TR',{maximumFractionDigits:1})+(difference<0?' az':'');
  }
  function updateHeading(label){
    const heading=[...document.querySelectorAll('h2,h3')].find(x=>/giderleri$/i.test(x.textContent.trim()));
    if(heading&&heading.textContent!==label+' giderleri')heading.textContent=label+' giderleri';
  }
  function updateTotal(total){
    const card=findCard();if(!card)return;
    const totalBox=[...card.querySelectorAll('div,span,p')].find(x=>/^Toplam\s*[₺\d]/.test(x.textContent.trim())&&x.children.length<=2);
    const strong=totalBox?.querySelector('strong,b');
    if(strong)strong.textContent=formatMoney(total);
  }
  function apply(){
    ensureControls();const controls=document.querySelector('.pire-expense-periods');if(!controls)return;
    controls.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
    const label=periodLabel();controls.querySelector('[data-period]').textContent=label;
    const items=rows();fillCategories(items);let total=0,visible=0;
    items.forEach(item=>{const show=inPeriod(item.date)&&categoryMatches(item);item.row.hidden=!show;if(show){visible++;total+=Math.abs(item.amount)}});
    updateHeading(label);updateTotal(total);
    renderComparison(items);
    let empty=document.querySelector('.pire-expense-empty');
    if(!empty){empty=document.createElement('div');empty.className='pire-expense-empty';empty.textContent='Bu dönemde gider kaydı bulunmuyor.';findCard()?.appendChild(empty)}
    empty.hidden=visible>0;
  }
  let queued=false;
  function scan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(expensePage()){ensureControls();apply()}})}
  scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
