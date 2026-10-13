const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','pire-reports-tabs.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'..','pire-reports-tabs.css'),'utf8');

test('reports are divided into six persistent information tabs',()=>{
  for(const id of ['overview','summary','branches','finance','teachers','operations']){
    assert.match(source,new RegExp(`id:'${id}'`));
  }
  assert.match(source,/pire-reports-active-tab/);
  assert.match(source,/localStorage\.setItem\(STORAGE_KEY,value\)/);
});

test('report tabs are placed beside the page title',()=>{
  assert.match(source,/findHeading\(page\)/);
  assert.match(source,/heading\.classList\.add\('pire-report-heading'\)/);
  assert.match(source,/titleBlock\.after\(nav\)/);
  assert.match(source,/\{id:'overview',label:'Genel Durum'\}/);
  assert.match(source,/setHidden\(head,active!==\'overview\',\'overview\'\)/);
  assert.match(style,/header\.pire-report-heading > \.pire-report-tabs/);
});

test('title tabs are removed before leaving reports',()=>{
  assert.match(source,/if\(!page\)\{/);
  assert.match(source,/document\.querySelectorAll\('\.pire-report-tabs'\)/);
  assert.match(source,/classList\.remove\('pire-report-heading'\)/);
});

test('hidden report groups and single-column report layout are enforced',()=>{
  assert.match(style,/\[data-pire-report-section\]\[hidden\]\{display:none!important\}/);
  assert.match(style,/grid-template-columns:minmax\(0,1fr\)!important/);
});

test('institution overview card is isolated in its own report tab',()=>{
  assert.match(source,/const head=page\.querySelector\(':scope > \.reports-head'\)/);
  assert.match(source,/setHidden\(head,active!=='overview','overview'\)/);
  assert.match(source,/\?value:'overview'/);
  assert.match(style,/data-pire-report-tab="overview"\] > \.reports-head/);
});

const {fixture}=require('./ui/dom-fixture.cjs');
const reportHtml=`<main class="content"><header><div>Reports</div><div class="top-actions"></div></header><section class="reports-page"><div class="reports-head"></div><div class="report-metrics"></div><div class="report-comparison-note"></div><div class="report-grid"><div class="report-chart-panel"></div><div class="report-finance-panel"></div></div><div class="report-table-panel"></div><div class="report-operations-grid"><form><input></form></div><div class="report-bottom-cards"></div></section></main>`;
const sections={overview:['reports-head'],summary:['report-metrics','report-comparison-note'],branches:['report-grid','report-chart-panel'],finance:['report-grid','report-finance-panel'],teachers:['report-table-panel'],operations:['report-operations-grid','report-bottom-cards']};
test('all six tabs display their own sections and preserve original DOM parents',t=>{
  const ui=fixture(reportHtml,'pire-reports-tabs.js');t.after(()=>ui.close());
  const nodes=Object.values(sections).flat().filter((value,index,all)=>all.indexOf(value)===index).map(name=>ui.document.querySelector('.'+name));
  const parents=nodes.map(node=>node.parentElement);
  for(const [tab,visible] of Object.entries(sections)){
    ui.document.querySelector(`[data-report-tab="${tab}"]`).click();
    nodes.forEach((node,index)=>{assert.equal(node.hidden,!visible.includes(node.className));assert.equal(node.parentElement,parents[index])});
    assert.equal(ui.document.querySelector('.reports-page').dataset.pireReportTab,tab);
    assert.equal(ui.window.localStorage.getItem('pire-reports-active-tab'),tab);
    assert.equal(ui.document.querySelectorAll('[aria-selected="true"]').length,1);
  }
});
test('keyboard navigation wraps, focuses and restores persisted selection',t=>{
  const ui=fixture(reportHtml,'pire-reports-tabs.js',{'pire-reports-active-tab':'finance'});t.after(()=>ui.close());
  assert.equal(ui.document.querySelector('.reports-page').dataset.pireReportTab,'finance');
  for(const [from,key,to] of [['finance','End','operations'],['operations','ArrowRight','overview'],['overview','ArrowLeft','operations'],['operations','Home','overview']]){
    ui.document.querySelector(`[data-report-tab="${from}"]`).dispatchEvent(new ui.window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
    assert.equal(ui.document.activeElement.dataset.reportTab,to);
    assert.equal(ui.document.querySelector('.reports-page').dataset.pireReportTab,to);
  }
});
test('invalid saved selection falls back and input events do not restore hidden sections',t=>{
  const ui=fixture(reportHtml,'pire-reports-tabs.js',{'pire-reports-active-tab':'obsolete'});t.after(()=>ui.close());
  assert.equal(ui.document.querySelector('.reports-page').dataset.pireReportTab,'overview');
  ui.document.querySelector('[data-report-tab="operations"]').click();
  const form=ui.document.querySelector('form'),input=form.querySelector('input'),parent=form.parentElement;
  for(const type of ['pointerdown','input','change','submit']){
    let handled=false;const target=type==='submit'?form:input;
    target.addEventListener(type,event=>{event.preventDefault();handled=true;assert.equal(form.parentElement,parent);assert.equal(ui.document.querySelector('.reports-head').hidden,true)},{once:true});
    target.dispatchEvent(new ui.window.Event(type,{bubbles:true,cancelable:true}));assert.equal(handled,true);
  }
});
test('leaving reports removes injected tabs without moving application content',t=>{
  const ui=fixture(reportHtml,'pire-reports-tabs.js');t.after(()=>ui.close());
  ui.document.querySelector('.reports-page').remove();ui.mutate();
  assert.equal(ui.document.querySelector('.pire-report-tabs'),null);
  assert.equal(ui.document.querySelector('header').classList.contains('pire-report-heading'),false);
  assert.ok(ui.document.querySelector('header > .top-actions'));
});
