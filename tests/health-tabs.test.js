const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','pire-health-tabs.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'..','pire-health-tabs.css'),'utf8');

test('system health is divided into three persistent information tabs',()=>{
  for(const id of ['summary','checks','flows'])assert.match(source,new RegExp(`id:'${id}'`));
  assert.match(source,/pire-health-active-tab/);
  assert.match(source,/localStorage\.setItem\(STORAGE_KEY,value\)/);
});

test('every health information group receives one tab',()=>{
  for(const selector of ['health-overview','health-check-list','e2e-center']){
    assert.match(source,new RegExp(selector));
  }
});

test('shared health actions, errors and last-check footer remain visible',()=>{
  assert.match(source,/createTabs\(page,hero\)/);
  assert.match(source,/hero\.after\(nav\)/);
  assert.doesNotMatch(source,/mark\([^\n]*(health-hero|health-run-error|health-footer)/);
});

test('React-managed health nodes are restored before checks run',()=>{
  assert.match(source,/element\.hidden=false/);
  assert.match(source,/document\.addEventListener\(type,restoreBeforeReact,true\)/);
  assert.match(style,/\[data-pire-health-section\]\[hidden\]\{display:none!important\}/);
});
