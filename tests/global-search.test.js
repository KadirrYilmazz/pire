const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('pire-global-search.js','utf8');
const data={
  students:{students:[{id:1,name:'Ayşe Işık',course:'Piyano',teacher:'Mert Kaya',phone:'05320000000',status:'Aktif'}],payments:[{id:4,studentId:1,month:'2026-08',amount:1500,status:'Bekliyor'}]},
  catalog:{teachers:[{id:2,name:'Mert Kaya',courses:'["Piyano"]',phone:'05330000000',status:'Aktif'}]},
  lessons:{lessons:[{id:3,course:'Piyano',teacher:'Mert Kaya',studentIds:'[1]',lessonDate:'2026-08-26',startTime:'17:00',room:'Stüdyo'}]},
  makeups:{rights:[{id:5,studentId:1,status:'Bekliyor',reason:'Sağlık',expiresAt:'2026-09-01'}]}
};

function load(labels){
  const buttons=labels.map(textContent=>({textContent}));
  const window={__PIRE_RECOVERED_BACKEND__:{exportData:()=>data}};
  const document={readyState:'loading',querySelectorAll:selector=>selector==='.primary-nav button'?buttons:[],addEventListener(){}};
  vm.runInNewContext(source,{window,document,HTMLInputElement:function(){},Event:function(){},MutationObserver:function(){},requestAnimationFrame(){},setTimeout(){}});
  return window.__PIRE_GLOBAL_SEARCH_TEST__;
}

const all=load(['Öğrenciler','Eğitmenler','Takvim','Ödeme Takibi','Telafiler']);
assert.equal(all.normalize('IŞIK'),'isik');
const results=all.buildResults('Ayşe');
assert.equal(JSON.stringify(results.map(group=>group.key)),JSON.stringify(['students','lessons','payments','makeups']));
assert.equal(results[0].items[0].title,'Ayşe Işık');

const restricted=load(['Takvim']);
assert.equal(JSON.stringify(restricted.buildResults('Ayşe').map(group=>group.key)),JSON.stringify(['lessons']));
assert.equal(restricted.buildResults('eşleşmeyen').length,0);
console.log('✓ genel arama sonuçları veriye ve görünür modül yetkisine göre oluşturulur');
