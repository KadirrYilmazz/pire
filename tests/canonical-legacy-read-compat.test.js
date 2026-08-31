'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const compat=fs.readFileSync(path.join(__dirname,'..','pire-canonical-legacy-read-compat.js'),'utf8');
const bridge=fs.readFileSync(path.join(__dirname,'..','pire-canonical-read-bridge.js'),'utf8');
const loader=fs.readFileSync(path.join(__dirname,'..','pire-login-notification.js'),'utf8');

test('legacy reads use an in-memory canonical mirror instead of persisted operational localStorage',()=>{
  assert.match(compat,/pire-recovered-backend-v1/);
  assert.match(compat,/Storage\.prototype\.getItem/);
  assert.match(compat,/return mirror\?JSON\.stringify\(mirror\):null/);
  assert.match(compat,/mode:'canonical-memory-mirror'/);
  assert.match(compat,/sourceOfTruth:'supabase-canonical'/);
});

test('canonical mirror covers all legacy operational modules',()=>{
  for(const key of ['students','catalog','lessons','packages','finance','expenses','attendance','makeups','settings','announcements','security-audit','earnings']){
    assert.ok(compat.includes(`${key.includes('-')?`'${key}'`:key}:`),`missing ${key}`);
  }
});

test('successful canonical writes trigger legacy mirror refresh',()=>{
  assert.match(bridge,/pire:canonical-response/);
  assert.match(compat,/detail\.ok && detail\.method && detail\.method!=='GET'/);
  assert.match(compat,/refresh\('canonical-write'\)/);
});

test('loader order is bridge then guard then canonical read compatibility',()=>{
  const bridgePos=loader.indexOf("load('/pire-canonical-read-bridge.js?v=4'");
  const guardPos=loader.indexOf("load('/pire-canonical-localstorage-guard.js?v=1'");
  const compatPos=loader.indexOf("load('/pire-canonical-legacy-read-compat.js?v=1'");
  assert.ok(bridgePos>=0);
  assert.ok(guardPos>bridgePos);
  assert.ok(compatPos>guardPos);
});
