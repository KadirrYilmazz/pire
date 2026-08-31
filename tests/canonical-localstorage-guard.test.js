'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const guard=fs.readFileSync(path.join(__dirname,'..','pire-canonical-localstorage-guard.js'),'utf8');
const loader=fs.readFileSync(path.join(__dirname,'..','pire-login-notification.js'),'utf8');

test('legacy operational localStorage key is explicitly guarded',()=>{
  assert.match(guard,/pire-recovered-backend-v1/);
  assert.match(guard,/canonical_source_of_truth/);
  assert.match(guard,/sourceOfTruth:'supabase-canonical'/);
  assert.match(guard,/mode:'read-only-legacy-snapshot'/);
});

test('setItem removeItem and clear cannot mutate legacy operational snapshot while canonical is active',()=>{
  assert.match(guard,/Storage\.prototype\.setItem/);
  assert.match(guard,/Storage\.prototype\.removeItem/);
  assert.match(guard,/Storage\.prototype\.clear/);
  assert.match(guard,/localOperationalFallback===false/);
});

test('guard loads only after canonical bridge',()=>{
  const bridge=loader.indexOf("load('/pire-canonical-read-bridge.js?v=4'");
  const guardLoad=loader.indexOf("load('/pire-canonical-localstorage-guard.js?v=1'");
  assert.ok(bridge>=0);
  assert.ok(guardLoad>bridge);
});
