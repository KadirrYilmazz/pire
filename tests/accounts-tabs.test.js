const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','pire-accounts-tabs.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'..','pire-accounts-tabs.css'),'utf8');

test('users workspace is divided into six persistent information tabs',()=>{
  for(const id of ['intro','accounts','permissions','announcements','backup','security']){
    assert.match(source,new RegExp(`id:'${id}'`));
  }
  assert.match(source,/pire-accounts-active-tab/);
  assert.match(source,/localStorage\.setItem\(STORAGE_KEY,value\)/);
});

test('account tabs are placed beside the page title',()=>{
  assert.match(source,/findHeading\(page\)/);
  assert.match(source,/heading\.classList\.add\('pire-account-heading'\)/);
  assert.match(source,/titleBlock\.after\(nav\)/);
  assert.doesNotMatch(source,/mark\([^\n]*account-feedback/);
  assert.match(style,/header\.pire-account-heading > \.pire-account-tabs/);
});

test('user accounts introduction card has its own tab',()=>{
  assert.match(source,/\{id:'intro',label:'Kullanıcı Hesapları'\}/);
  assert.match(source,/mark\(page\.querySelector\(':scope > \.account-hero'\),'intro',active\)/);
  assert.match(style,/data-pire-account-tab="intro"/);
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
  assert.match(source,/AUDIT_PAGE_SIZES=\[5,10,20\]/);
  assert.match(source,/Math\.ceil\(entries\.length\/auditPageSize\)/);
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

test('audit pager is reused so pointer click can complete',()=>{
  assert.match(source,/let pager=audit\?\.querySelector/);
  assert.match(source,/if\(!pager\)\{/);
  assert.match(source,/dataset\.auditPage='previous'/);
  assert.match(source,/dataset\.auditPage='next'/);
  assert.doesNotMatch(source,/audit\?\.querySelector\([^\n]+\)\?\.remove\(\);\n\s*if\(!audit/);
  assert.match(source,/if\(status\.textContent!==pageLabel\)/);
});

test('audit page size can be selected and remembered',()=>{
  assert.match(source,/pire-audit-page-size/);
  assert.match(source,/AUDIT_PAGE_SIZES\.includes\(value\)\?value:5/);
  assert.match(source,/sizeLabel\.textContent='Göster'/);
  assert.match(source,/auditPageSize=Number\(sizeSelect\.value\);auditPage=1/);
  assert.match(source,/saveAuditPageSize\(auditPageSize\)/);
  assert.match(style,/\.pire-audit-pager select/);
});
