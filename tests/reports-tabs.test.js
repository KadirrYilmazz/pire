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

test('report filters and export header remain shared',()=>{
  assert.match(source,/createTabs\(page,head\)/);
  assert.match(source,/head\.after\(nav\)/);
  assert.doesNotMatch(source,/reports-head[^\n]*hidden/);
});

test('React-managed report nodes are not moved and are restored before React events',()=>{
  assert.doesNotMatch(source,/appendChild\((metrics|comparison|grid|branches|finance|teachers|operations|bottom)\)/);
  assert.match(source,/element\.hidden=false/);
  assert.match(source,/document\.addEventListener\(type,restoreBeforeReact,true\)/);
});

test('hidden report groups and single-column report layout are enforced',()=>{
  assert.match(style,/\[data-pire-report-section\]\[hidden\]\{display:none!important\}/);
  assert.match(style,/grid-template-columns:minmax\(0,1fr\)!important/);
});
