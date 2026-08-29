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

test('account tabs are placed beside the page title while shared content remains visible',()=>{
  assert.match(source,/findHeading\(page\)/);
  assert.match(source,/heading\.classList\.add\('pire-account-heading'\)/);
  assert.match(source,/titleBlock\.after\(nav\)/);
  assert.doesNotMatch(source,/mark\([^\n]*(account-hero|account-feedback)/);
  assert.match(style,/header\.pire-account-heading > \.pire-account-tabs/);
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
  assert.match(source,/classList\.remove\('pire-account-heading'\)/);
});

test('security history is compacted to five records with pagination',()=>{
  assert.match(source,/AUDIT_PAGE_SIZE=5/);
  assert.match(source,/Math\.ceil\(entries\.length\/AUDIT_PAGE_SIZE\)/);
  assert.match(source,/previous\.textContent='← Önceki'/);
  assert.match(source,/next\.textContent='Sonraki →'/);
  assert.match(style,/\.pire-audit-pager/);
  assert.match(style,/article\[hidden\]\{display:none!important\}/);
});

test('audit pager is removed and entries restored before React actions',()=>{
  assert.match(source,/account-audit > \.pire-audit-pager/);
  assert.match(source,/entry\.hidden=false/);
  assert.match(source,/delete entry\.dataset\.pireAuditEntry/);
});
