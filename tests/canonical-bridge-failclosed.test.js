"use strict";

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','pire-canonical-read-bridge.js'),'utf8');

test('operational canonical routes do not fall back to local backend',()=>{
  assert.match(source,/mode:'canonical-fail-closed'/);
  assert.match(source,/localOperationalFallback:false/);
  assert.match(source,/Yerel veri kaynağına geri dönülmedi/);
  assert.doesNotMatch(source,/if\(isWrite\)return response;[\s\S]*return previousFetch\(input,init\)/);
});

test('missing session is rejected for canonical routes',()=>{
  assert.match(source,/missing_session/);
  assert.match(source,/return jsonResponse\(401/);
});

test('critical operational routes are canonicalized',()=>{
  for(const route of ['/api/students','/api/catalog','/api/lessons','/api/packages','/api/finance','/api/expenses','/api/attendance','/api/makeups','/api/settings','/api/announcements','/api/security-audit','/api/earnings']){
    assert.ok(source.includes(`'${route}'`),`${route} bridge listesinde olmalı`);
  }
});
