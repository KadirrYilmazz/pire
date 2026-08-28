const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','pire-accounts-tabs.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'..','pire-accounts-tabs.css'),'utf8');

test('users workspace is divided into five persistent information tabs',()=>{
  for(const id of ['accounts','permissions','announcements','backup','security']){
    assert.match(source,new RegExp(`id:'${id}'`));
  }
  assert.match(source,/pire-accounts-active-tab/);
  assert.match(source,/localStorage\.setItem\(STORAGE_KEY,value\)/);
});

test('shared hero and feedback messages are never hidden',()=>{
  assert.match(source,/createTabs\(page,hero\)/);
  assert.match(source,/hero\.after\(nav\)/);
  assert.doesNotMatch(source,/mark\([^\n]*(account-hero|account-feedback)/);
});

test('all existing user information groups receive one tab',()=>{
  for(const selector of ['account-stats','account-list','access-control','announcement-center','account-backup','account-audit']){
    assert.match(source,new RegExp(selector));
  }
});

test('React-managed account nodes are restored before account actions',()=>{
  assert.match(source,/element\.hidden=false/);
  assert.match(source,/document\.addEventListener\(type,restoreBeforeReact,true\)/);
  assert.match(style,/\[data-pire-account-section\]\[hidden\]\{display:none!important\}/);
});
