/* Fix130 — Yönetici finans merkezi. Yalnız Ödeme Takibi çalışma alanında görünür. */
(()=>{
  'use strict';
  if(window.__PIRE_ADMIN_FINANCE_CENTER__)return;
  const money=n=>`${Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:2})} ₺`;
  const data=()=>{try{return window.__PIRE_RECOVERED_BACKEND__?.exportData?.()||{}}catch(_){return {}}};
  const monthKey=()=>new Date().toISOString().slice(0,7);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let queued=false;

  function addStyle(){
    if(document.querySelector('style[data-pire-admin-finance-center]'))return;
    const s=document.createElement('style');s.dataset.pireAdminFinanceCenter='1';s.textContent=`
      .pire-admin-finance-center{margin:0 0 18px;padding:18px;border:1px solid rgba(212,180,92,.18);border-radius:18px;background:linear-gradient(180deg,rgba(212,180,92,.06),rgba(255,255,255,.025));box-shadow:0 16px 45px rgba(0,0,0,.12)}
      .pire-admin-finance-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px}.pire-admin-finance-head small{display:block;font-size:10px;font-weight:800;letter-spacing:.12em;opacity:.58}.pire-admin-finance-head h2{margin:3px 0 0;font-size:20px}.pire-admin-finance-head button{border:1px solid rgba(212,180,92,.28);background:rgba(212,180,92,.08);color:inherit;border-radius:10px;padding:8px 11px;font-weight:750;cursor:pointer}
      .pire-admin-finance-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.pire-admin-finance-kpi{padding:13px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.035)}.pire-admin-finance-kpi span{display:block;font-size:10px;opacity:.62;margin-bottom:7px}.pire-admin-finance-kpi strong{display:block;font-size:19px;line-height:1.1}.pire-admin-finance-kpi em{display:block;font-style:normal;font-size:10px;opacity:.55;margin-top:5px}
      .pire-admin-finance-bottom{display:grid;grid-template-columns:1.25fr .75fr;gap:12px;margin-top:12px}.pire-admin-finance-panel{border:1px solid rgba(255,255,255,.075);border-radius:13px;background:rgba(255,255,255,.025);padding:12px}.pire-admin-finance-panel h3{font-size:12px;margin:0 0 9px}.pire-admin-finance-list{display:grid;gap:6px}.pire-admin-finance-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.035)}.pire-admin-finance-row b{font-size:11px}.pire-admin-finance-row small{display:block;font-size:9px;opacity:.56;margin-top:2px}.pire-admin-finance-row strong{font-size:11px}.pire-admin-finance-empty{font-size:11px;opacity:.58;padding:8px 2px}.pire-admin-finance-actions{display:grid;gap:7px}.pire-admin-finance-actions button{border:1px solid rgba(212,180,92,.2);background:rgba(212,180,92,.055);color:inherit;border-radius:10px;padding:10px;text-align:left;font-weight:750;cursor:pointer}.pire-admin-finance-actions button:hover{background:rgba(212,180,92,.12)}
      html[data-theme="light"] .pire-admin-finance-center{background:linear-gradient(180deg,rgba(170,130,35,.08),rgba(255,255,255,.72));border-color:rgba(90,70,25,.16)}html[data-theme="light"] .pire-admin-finance-kpi,html[data-theme="light"] .pire-admin-finance-panel,html[data-theme="light"] .pire-admin-finance-row{background:rgba(70,55,25,.035);border-color:rgba(70,55,25,.09)}
      @media(max-width:980px){.pire-admin-finance-kpis{grid-template-columns:repeat(2,1fr)}.pire-admin-finance-bottom{grid-template-columns:1fr}}@media(max-width:560px){.pire-admin-finance-kpis{grid-template-columns:1fr}.pire-admin-finance-head{align-items:flex-start;flex-direction:column}}
    `;document.head.appendChild(s);
  }

  function stats(){
    const db=data(),ledgers=Array.isArray(db.finance?.ledgers)?db.finance.ledgers:[],tx=Array.isArray(db.finance?.transactions)?db.finance.transactions:[],packages=Array.isArray(db.packages?.packages)?db.packages.packages:[];
    const month=monthKey();
    const collected=tx.filter(x=>String(x.paymentDate||'').startsWith(month)).reduce((a,x)=>a+Number(x.amount||0),0);
    const debtors=ledgers.filter(x=>Number(x.balance||0)>0).sort((a,b)=>Number(b.balance||0)-Number(a.balance||0));
    const outstanding=debtors.reduce((a,x)=>a+Number(x.balance||0),0);
    const criticalPackages=packages.filter(x=>String(x.status||'').toLocaleLowerCase('tr-TR')==='aktif'&&Number(x.remainingLessons||0)<=2);
    return {ledgers,tx,packages,collected,debtors,outstanding,criticalPackages};
  }

  function clickTab(id){document.querySelector(`.pire-payment-tabs [data-tab="${id}"]`)?.click()}
  function render(){
    const root=document.querySelector('.payments-workspace');
    if(!root){document.querySelector('.pire-admin-finance-center')?.remove();return}
    addStyle();
    let box=root.querySelector(':scope > .pire-admin-finance-center');if(!box){box=document.createElement('section');box.className='pire-admin-finance-center';root.prepend(box)}
    const s=stats(),top=s.debtors.slice(0,5),ratio=s.ledgers.length?Math.round(((s.ledgers.length-s.debtors.length)/s.ledgers.length)*100):100;
    box.innerHTML=`
      <div class="pire-admin-finance-head"><div><small>YÖNETİCİ FİNANS ÖZETİ</small><h2>Finans Kontrol Merkezi</h2></div><button type="button" data-finance-refresh>Verileri yenile</button></div>
      <div class="pire-admin-finance-kpis">
        <article class="pire-admin-finance-kpi"><span>BU AY TAHSİLAT</span><strong>${money(s.collected)}</strong><em>Gerçekleşen işlemler</em></article>
        <article class="pire-admin-finance-kpi"><span>BEKLEYEN TOPLAM</span><strong>${money(s.outstanding)}</strong><em>${s.debtors.length} öğrencide açık bakiye</em></article>
        <article class="pire-admin-finance-kpi"><span>TAHSİLAT DURUMU</span><strong>%${ratio}</strong><em>Borcu kapanmış öğrenci oranı</em></article>
        <article class="pire-admin-finance-kpi"><span>KRİTİK PAKET</span><strong>${s.criticalPackages.length}</strong><em>2 veya daha az ders kalan</em></article>
      </div>
      <div class="pire-admin-finance-bottom">
        <section class="pire-admin-finance-panel"><h3>Öncelikli tahsilatlar</h3><div class="pire-admin-finance-list">${top.length?top.map(x=>`<div class="pire-admin-finance-row"><div><b>${esc(x.student||'Öğrenci')}</b><small>${Number(x.paid||0)>0?`${money(x.paid)} tahsil edildi`:'Henüz tahsilat yok'}</small></div><strong>${money(x.balance)}</strong></div>`).join(''):'<div class="pire-admin-finance-empty">Açık bakiye bulunmuyor.</div>'}</div></section>
        <section class="pire-admin-finance-panel"><h3>Hızlı işlemler</h3><div class="pire-admin-finance-actions"><button type="button" data-open="open">Açık alacakları gör →</button><button type="button" data-open="collections">Tahsilat geçmişini gör →</button><button type="button" data-open="relations">Ders / paket ilişkisini gör →</button></div></section>
      </div>`;
    box.querySelector('[data-finance-refresh]').onclick=async()=>{const b=window.__PIRE_RECOVERED_BACKEND__;if(b?.refresh)await b.refresh();render()};
    box.querySelectorAll('[data-open]').forEach(btn=>btn.onclick=()=>clickTab(btn.dataset.open));
  }

  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})}
  window.addEventListener('pire:canonical-legacy-mirror-ready',queue);
  window.addEventListener('pire:canonical-response',e=>{if(e.detail?.ok&&e.detail?.method!=='GET')setTimeout(queue,450)});
  if(document.body){queue();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true})}else document.addEventListener('DOMContentLoaded',queue,{once:true});
  window.__PIRE_ADMIN_FINANCE_CENTER__={enabled:true,render};
})();
