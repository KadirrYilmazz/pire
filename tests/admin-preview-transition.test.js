const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','pire-dashboard-calendar.js'),'utf8');

test('admin preview restores moved React actions before changing panel',()=>{
  assert.match(source,/previewStart=event\.target\.closest\?\.\('\.admin-preview-actions \.start'\)/);
  assert.match(source,/lessonCalendarCard\|\|previewStart\)restoreNewActions\(\)/);
  assert.match(source,/document\.addEventListener\('click',[\s\S]*?,true\);/);
});
