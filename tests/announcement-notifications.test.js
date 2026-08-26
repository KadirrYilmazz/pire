const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const bundle=fs.readFileSync(path.join(__dirname,'..','assets','page-C14w5Jqo.js'),'utf8');
const helperSource=html.slice(html.indexOf('function notificationRecipient'),html.indexOf('function recomputeFinance'));

function createHelpers(db){
  return new Function('db','Headers',`${helperSource};return {visibleAnnouncements,announcementNotifications};`)(db,Headers);
}

test('duyurular bildirim listesine eklenir',()=>{
  assert.match(html,/\.\.\.announcementNotifications\(init\)/);
  assert.match(html,/key:'announcement:'\+item\.id,type:'Duyuru'/);
  assert.match(html,/unread:notifications\.filter\(item=>!item\.read\)\.length/);
});

test('duyuru hedefi rol ve kullanıcıya göre süzülür',()=>{
  assert.match(html,/item\.targetType==='role'\)return item\.targetValue===recipient\.role/);
  assert.match(html,/item\.targetType==='user'\)return Boolean\(recipient\.accountId\)/);
  assert.match(html,/item\.status!=='Yayında'/);
  assert.match(html,/starts>now/);
  assert.match(html,/ends<now/);
  const now=Date.now(),db={announcements:{announcements:[
    {id:1,status:'Yayında',targetType:'role',targetValue:'Eğitmen',startsAt:new Date(now-1000).toISOString(),endsAt:new Date(now+60000).toISOString()},
    {id:2,status:'Yayında',targetType:'role',targetValue:'Veli',startsAt:new Date(now-1000).toISOString(),endsAt:new Date(now+60000).toISOString()},
    {id:3,status:'Yayında',targetType:'user',targetValue:'user-7',startsAt:new Date(now-1000).toISOString(),endsAt:new Date(now+60000).toISOString()},
    {id:4,status:'Yayında',targetType:'all',startsAt:new Date(now+60000).toISOString(),endsAt:new Date(now+120000).toISOString()}
  ]}};
  const {visibleAnnouncements}=createHelpers(db);
  const teacher={headers:{'X-Pire-Role':encodeURIComponent('Eğitmen'),'X-Pire-Account':'user-7'}};
  assert.deepEqual(visibleAnnouncements(teacher).map(item=>item.id),[1,3]);
  assert.deepEqual(visibleAnnouncements({headers:{'X-Pire-Role':encodeURIComponent('Veli'),'X-Pire-Account':'user-8'}}).map(item=>item.id),[2]);
});

test('duyuru okundu durumu kullanıcıya özel saklanır',()=>{
  assert.match(html,/db\.announcementReads\[recipient\.key\]/);
  assert.match(html,/startsWith\('announcement:'\)/);
  assert.match(html,/visibleAnnouncements\(init\)/);
  const now=Date.now(),announcement={id:11,title:'Ders saati',message:'Saat 18.00',status:'Yayında',targetType:'all',startsAt:new Date(now-1000).toISOString(),endsAt:new Date(now+60000).toISOString()};
  const db={announcements:{announcements:[announcement]},announcementReads:{'user-1':['11']}};
  const {announcementNotifications}=createHelpers(db);
  assert.equal(announcementNotifications({headers:{'X-Pire-Role':encodeURIComponent('Öğrenci'),'X-Pire-Account':'user-1'}})[0].read,true);
  assert.equal(announcementNotifications({headers:{'X-Pire-Role':encodeURIComponent('Öğrenci'),'X-Pire-Account':'user-2'}})[0].read,false);
});

test('Supabase hesabı bildirim isteğine kullanıcı kimliğini ekler',()=>{
  assert.match(bundle,/n\.session\?\.user\?\.id&&r\.set\(`X-Pire-Account`,n\.session\.user\.id\)/);
  assert.match(bundle,/r\.set\(`X-Pire-Role`,encodeURIComponent\(i\)\)/);
  assert.match(html,/requestInit\.headers\.set\('X-Pire-Account',localAccount\.id\)/);
  assert.match(html,/requestInit\.headers\.set\('X-Pire-Role',encodeURIComponent\(activeRole\)\)/);
});
