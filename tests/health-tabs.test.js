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

test('health tabs are placed beside the page title while shared content remains visible',()=>{
  assert.match(source,/findHeading\(page\)/);
  assert.match(source,/heading\.classList\.add\('pire-health-heading'\)/);
  assert.match(source,/titleBlock\.after\(nav\)/);
  assert.doesNotMatch(source,/mark\([^\n]*(health-hero|health-run-error|health-footer)/);
  assert.match(style,/header\.pire-health-heading > \.pire-health-tabs/);
});

test('React-managed health nodes are restored before checks run',()=>{
  assert.match(source,/element\.hidden=false/);
  assert.match(source,/document\.addEventListener\(type,restoreBeforeReact,true\)/);
  assert.match(style,/\[data-pire-health-section\]\[hidden\]\{display:none!important\}/);
  assert.match(source,/classList\.remove\('pire-health-heading'\)/);
});
