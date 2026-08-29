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

test('React-managed report nodes are not moved and are restored before React events',()=>{
  assert.doesNotMatch(source,/appendChild\((head|metrics|comparison|grid|branches|finance|teachers|operations|bottom)\)/);
  assert.match(source,/element\.hidden=false/);
  assert.match(source,/document\.addEventListener\(type,restoreBeforeReact,true\)/);
  assert.match(source,/\['pointerdown','input','change','submit'\]/);
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
