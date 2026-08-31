'use strict';

const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'index.html');
const html=fs.readFileSync(file,'utf8');
const start='</main><script>\n(function(){\nconst SEED=';
const end='</script><script id="pire-header-safety-fix">';
const startIndex=html.indexOf(start);
if(startIndex<0)throw new Error('Fix123 legacy backend başlangıç işareti bulunamadı.');
const endIndex=html.indexOf(end,startIndex);
if(endIndex<0)throw new Error('Fix123 legacy backend bitiş işareti bulunamadı.');

const cleaned=html.slice(0,startIndex)+'</main><script id="pire-header-safety-fix">'+html.slice(endIndex+end.length);

const forbidden=['const SEED=','async function localApi(','pire-recovered-backend-v1\';\nlet db','window.fetch=function(input,init)'];
for(const marker of forbidden){
  if(cleaned.includes(marker))throw new Error('Legacy backend işareti temizlenemedi: '+marker);
}
if(!cleaned.includes('id="pire-header-safety-fix"'))throw new Error('Temizlik sonrası UI patch zinciri korunamadı.');
if(!cleaned.includes('id="pire-student-edit-fix"'))throw new Error('Temizlik sonrası öğrenci düzenleme uyumluluğu korunamadı.');

fs.writeFileSync(file,cleaned,'utf8');
console.log(`Fix123 legacy backend stripped: ${html.length-cleaned.length} bytes removed from deployed index.html`);
