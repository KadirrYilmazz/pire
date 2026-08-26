const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const css=fs.readFileSync(path.join(__dirname,'..','pire-new-trigger-refine.css'),'utf8');
const loader=fs.readFileSync(path.join(__dirname,'..','pire-language.js'),'utf8');

test('new action matches navigation scale without losing emphasis',()=>{
  assert.match(css,/height:40px!important/);
  assert.match(css,/min-width:0!important/);
  assert.match(css,/padding:0 14px!important/);
  assert.match(css,/background:linear-gradient/);
  assert.match(css,/box-shadow/);
  assert.match(css,/:focus-visible/);
});

test('new action refinement is loaded by the safe bootstrap',()=>{
  assert.match(loader,/loadNewTriggerStyle/);
  assert.match(loader,/pire-new-trigger-refine\.css/);
});
