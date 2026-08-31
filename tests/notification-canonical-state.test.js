const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const scope=fs.readFileSync(path.join(__dirname,'..','pire-notification-scope.js'),'utf8');
const canonical=fs.readFileSync(path.join(__dirname,'..','lib','canonical-notifications.js'),'utf8');

test('notification scope no longer stores operational read state in localStorage',()=>{
  assert.doesNotMatch(scope,/pire-notification-role-reads-v1/);
  assert.doesNotMatch(scope,/pire-local-admin-session-v1/);
  assert.doesNotMatch(scope,/localStorage\.setItem\(/);
});

test('canonical notification handler persists preferences and read state per profile',()=>{
  assert.match(canonical,/pire_notification_preferences/);
  assert.match(canonical,/pire_notification_reads/);
  assert.match(canonical,/pire_announcement_reads/);
  assert.match(canonical,/profile_id:identity\.id/);
});
