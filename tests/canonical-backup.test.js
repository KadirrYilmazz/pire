'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const { _test }=require('../lib/canonical-backup');

test('canonical v2 backup validates required tables',()=>{
  const tables=Object.fromEntries(_test.TABLES.map(name=>[name,[]]));
  const result=_test.validateCandidate({version:2,schema:'pire-canonical-v2',data:{tables}});
  assert.equal(result.valid,true);
  assert.equal(result.format,'pire-canonical-v2');
});

test('legacy v1 backup remains validation compatible',()=>{
  const result=_test.validateCandidate({version:1,data:{students:{students:[]},catalog:{teachers:[],courses:[]},lessons:{lessons:[]},packages:{packages:[]},finance:{transactions:[]}}});
  assert.equal(result.valid,true);
  assert.equal(result.format,'pire-legacy-v1');
});

test('canonical backup rejects missing core tables',()=>{
  const result=_test.validateCandidate({version:2,data:{tables:{pire_students:[]}}});
  assert.equal(result.valid,false);
  assert.ok(result.missing.includes('pire_lessons'));
});
