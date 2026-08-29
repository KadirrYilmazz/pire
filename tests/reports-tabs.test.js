const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','pire-reports-tabs.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'..','pire-reports-tabs.css'),'utf8');

test('reports are divided into five persistent information tabs',()=>{
  for(const id of ['summary','branches','finance','teachers','operations']){
    assert.match(source,new RegExp(`id:'${id}'`));
  }
  assert.match(source,/pire-reports-active-tab/);
  assert.match(source,/localStorage\.setItem\(STORAGE_KEY,value\)/);
});

test('report tabs are placed beside the page title while filters remain shared',()=>{
  assert.match(source,/findHeading\(page\)/);
  assert.match(source,/heading\.classList\.add\('pire-report-heading'\)/);
  assert.match(source,/titleBlock\.after\(nav\)/);
  assert.doesNotMatch(source,/reports-head[^\n]*hidden/);
  assert.match(style,/header\.pire-report-heading > \.pire-report-tabs/);
});

test('React-managed report nodes are not moved and are restored before React events',()=>{
  assert.doesNotMatch(source,/appendChild\((metrics|comparison|grid|branches|finance|teachers|operations|bottom)\)/);
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
