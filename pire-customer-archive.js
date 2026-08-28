/* Pİ-RE müşteri işi durum ve arşiv yönetimi */
(()=>{
  const VIEW_KEY='pire-customer-archive-view-v1';
  const terminal=new Set(['Tamamlandı','İptal Edildi']);
  const crm=()=>window.PIRE_SAFE_CUSTOMER_CRM;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const digits=v=>String(v||'').replace(/\D/g,'');
  const phoneKey=v=>digits(v).replace(/^90/,'').slice(-10);

  function viewState(){
    try{return JSON.parse(sessionStorage.getItem(VIEW_KEY)||'{}')}catch(_){return{}}
  }
  function setView(type,value){const state=viewState();state[type]=value;sessionStorage.setItem(VIEW_KEY,JSON.stringify(state))}

  function customerIdFromDetail(detail){
    const text=detail.querySelector('header small')?.textContent||'';
    return text.split('·').pop()?.trim()||'';
  }

  function saveRecord(id,patch){
    const api=crm(),all=api?.read?.()||[],index=all.findIndex(x=>String(x.id)===String(id));
    if(index<0)return null;all[index]={...all[index],...patch,updatedAt:new Date().toISOString()};api.write(all);return all[index];
  }

  function reopen(record){
    document.querySelector('#safe-customer-detail-overlay')?.remove();
    crm()?.openCustomerPanel(record.type==='Stüdyo'?'studio':'organization');
  }

  function enhanceDetail(detail){
    if(detail.dataset.pireArchiveReady)return;
    const id=customerIdFromDetail(detail),record=crm()?.read?.().find(x=>String(x.id)===String(id));if(!record)return;
    detail.dataset.pireArchiveReady='1';
    const grid=detail.querySelector('.safe-customer-detail-grid');if(!grid)return;
    const section=document.createElement('section');section.className='pire-customer-close-panel';
    const today=new Date().toISOString().slice(0,10);
    section.innerHTML=`
      <header><div><small>İŞ DURUMU</small><h3>${record.archivedAt?'Arşivlenmiş iş':'İşi güncelle ve kapat'}</h3></div><span>${esc(record.id)}</span></header>
      <div class="pire-customer-close-grid">
        <label><span>Durum</span><select data-status>
          ${['Yeni Talep','Görüşülüyor','Teklif Verildi','Onaylandı','Tamamlandı','İptal Edildi'].map(x=>'<option '+(x===record.status?'selected':'')+'>'+x+'</option>').join('')}
        </select></label>
        <label><span>Gerçekleşen ücret</span><input data-amount type="number" min="0" step="100" value="${esc(record.actualAmount||'')}" placeholder="₺"></label>
        <label><span>Kapanış tarihi</span><input data-date type="date" value="${esc(record.closedAt||'')}"></label>
        <label class="wide"><span>Sonuç / kapanış notu</span><textarea data-result rows="3" placeholder="Yapılan iş, teslim veya iptal nedeni">${esc(record.resultNote||'')}</textarea></label>
      </div>
      <div class="pire-customer-close-actions"></div>`;
    grid.after(section);
    const actions=section.querySelector('.pire-customer-close-actions');
    if(record.archivedAt){
      section.querySelectorAll('input,select,textarea').forEach(x=>x.disabled=true);
      actions.innerHTML='<button type="button" data-restore>Arşivden geri çıkar</button><button type="button" class="danger" data-delete>Kalıcı olarak sil</button>';
      actions.querySelector('[data-restore]').onclick=()=>{const updated=saveRecord(id,{archivedAt:null});if(updated)reopen(updated)};
      actions.querySelector('[data-delete]').onclick=()=>{
        if(!confirm(record.name+' müşterisine ait işi kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.'))return;
        const api=crm(),all=api.read().filter(x=>String(x.id)!==String(id));api.write(all);document.querySelector('#safe-customer-detail-overlay')?.remove();api.openCustomerPanel(record.type==='Stüdyo'?'studio':'organization');
      };
    }else{
      actions.innerHTML='<button type="button" data-save>Değişiklikleri kaydet</button><button type="button" class="archive" data-archive>İşi arşivle ve kapat</button>';
      const values=()=>{const status=section.querySelector('[data-status]').value;return{status,actualAmount:section.querySelector('[data-amount]').value,closedAt:section.querySelector('[data-date]').value||(terminal.has(status)?today:''),resultNote:section.querySelector('[data-result]').value.trim()}};
      actions.querySelector('[data-save]').onclick=()=>{const updated=saveRecord(id,values());if(updated){alert('Müşteri işi güncellendi.');reopen(updated)}};
      actions.querySelector('[data-archive]').onclick=()=>{
        const patch=values();if(!terminal.has(patch.status)){alert('Arşivlemek için işi önce Tamamlandı veya İptal Edildi durumuna getirin.');section.querySelector('[data-status]').focus();return}
        if(!patch.closedAt){alert('Kapanış tarihini seçin.');return}
        if(!confirm('Bu işi arşivleyip aktif müşteri listesinden kaldırmak istiyor musunuz?'))return;
        const updated=saveRecord(id,{...patch,archivedAt:new Date().toISOString()});if(updated){setView(updated.type,'active');reopen(updated)}
      };
    }
  }

  function identifyCards(panel,records){
    panel.querySelectorAll('.safe-customer-card').forEach(card=>{
      if(card.dataset.customerId)return;
      const name=card.querySelector('header b')?.textContent?.trim(),phone=phoneKey(card.querySelector('header small')?.textContent),project=card.querySelector(':scope > strong')?.textContent?.trim();
      let matches=records.filter(x=>x.name===name&&phoneKey(x.phone)===phone);
      if(matches.length!==1)matches=records.filter(x=>x.name===name&&String(x.project||'').trim()===String(project||'').trim());
      if(matches.length===1)card.dataset.customerId=matches[0].id;
    });
  }

  function enhancePanel(panel){
    const api=crm(),type=panel.querySelector('.safe-customer-head h2')?.textContent?.trim();if(!api||!type)return;
    const records=api.read().filter(x=>x.type===type);identifyCards(panel,records);
    let tabs=panel.querySelector('.pire-customer-tabs');
    if(!tabs){
      tabs=document.createElement('nav');tabs.className='pire-customer-tabs';
      tabs.innerHTML='<button type="button" data-view="active">Aktif İşler <b></b></button><button type="button" data-view="archive">Arşiv <b></b></button>';
      panel.querySelector('.safe-customer-head').after(tabs);
      tabs.onclick=e=>{const button=e.target.closest('button[data-view]');if(!button)return;setView(type,button.dataset.view);applyPanel(panel)};
    }
    applyPanel(panel);
  }

  function applyPanel(panel){
    const api=crm(),type=panel.querySelector('.safe-customer-head h2')?.textContent?.trim();if(!api||!type)return;
    const records=api.read().filter(x=>x.type===type),view=viewState()[type]||'active';
    const map=new Map(records.map(x=>[String(x.id),x]));let visible=0;
    panel.querySelectorAll('.safe-customer-card').forEach(card=>{
      const record=map.get(String(card.dataset.customerId||''));
      const show=record?(view==='archive'?!!record.archivedAt:!record.archivedAt):view==='active';
      card.hidden=!show;if(show)visible++;
    });
    const active=records.filter(x=>!x.archivedAt).length,archived=records.filter(x=>x.archivedAt).length,tabs=panel.querySelector('.pire-customer-tabs');
    tabs?.querySelectorAll('button').forEach(button=>{
      const selected=button.dataset.view===view,number=String(button.dataset.view==='active'?active:archived),badge=button.querySelector('b');
      button.classList.toggle('active',selected);
      if(button.getAttribute('aria-current')!==(selected?'page':'false'))button.setAttribute('aria-current',selected?'page':'false');
      if(badge&&badge.textContent!==number)badge.textContent=number;
    });
    let empty=panel.querySelector('.pire-customer-archive-empty');
    if(!empty){empty=document.createElement('div');empty.className='safe-customer-empty pire-customer-archive-empty';panel.querySelector('.safe-customer-grid')?.appendChild(empty)}
    const emptyText=view==='archive'?'Arşivlenmiş müşteri işi bulunmuyor.':'Aktif müşteri işi bulunmuyor.';
    if(empty.textContent!==emptyText)empty.textContent=emptyText;
    empty.hidden=visible!==0;
  }

  function scan(){
    document.querySelectorAll('#safe-customer-panel').forEach(enhancePanel);
    document.querySelectorAll('.safe-customer-detail').forEach(enhanceDetail);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pire-safe-customers-change',()=>setTimeout(scan,0));
})();
