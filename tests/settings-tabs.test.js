const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','pire-settings-tabs.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'..','pire-settings-tabs.css'),'utf8');

test('settings are divided into six persistent information tabs',()=>{
  for(const id of ['institution','schedule','rooms','lessons','makeups','notifications']){
    assert.match(source,new RegExp(`id:'${id}'`));
  }
  assert.match(source,/pire-settings-active-tab/);
  assert.match(source,/localStorage\.setItem\(STORAGE_KEY,value\)/);
});

test('six existing settings sections are mapped without moving them',()=>{
  assert.match(source,/settings-grid > section/);
  assert.match(source,/TABS\[index\]\?\.id/);
  assert.doesNotMatch(source,/appendChild\(section\)|append\(section\)/);
});

test('shared save actions, feedback and update footer remain visible',()=>{
  assert.match(source,/createTabs\(page,hero\)/);
  assert.match(source,/hero\.after\(nav\)/);
  assert.doesNotMatch(source,/pireSettingsSection[^\n]*(settings-hero|settings-feedback|footer)/);
});

test('controlled inputs restore React structure before every change',()=>{
  assert.match(source,/\['pointerdown','input','change','submit'\]/);
  assert.match(source,/section\.hidden=false/);
  assert.match(style,/\[data-pire-settings-section\]\[hidden\]\{display:none!important\}/);
});
