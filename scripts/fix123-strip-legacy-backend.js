'use strict';

const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'index.html');
let html=fs.readFileSync(file,'utf8');

const backendStart='</main><script>\n(function(){\nconst SEED=';
const backendEnd='</script><script id="pire-header-safety-fix">';
const startIndex=html.indexOf(backendStart);
if(startIndex<0)throw new Error('Fix123 legacy backend başlangıç işareti bulunamadı.');
const endIndex=html.indexOf(backendEnd,startIndex);
if(endIndex<0)throw new Error('Fix123 legacy backend bitiş işareti bulunamadı.');
html=html.slice(0,startIndex)+'</main><script id="pire-header-safety-fix">'+html.slice(endIndex+backendEnd.length);

const customerStart='<script id="pire-safe-customer-crm">';
const customerEnd='<script id="pire-fix17b-remove-customer-discover">';
const customerStartIndex=html.indexOf(customerStart);
const customerEndIndex=html.indexOf(customerEnd,customerStartIndex);
if(customerStartIndex<0||customerEndIndex<0)throw new Error('Fix123 legacy müşteri CRM işaretleri bulunamadı.');
html=html.slice(0,customerStartIndex)+'<script src="/pire-canonical-customers.js?v=1" defer data-pire-canonical-customers="true"></script>\n'+html.slice(customerEndIndex);

const forbidden=['const SEED=','async function localApi(','pire-recovered-backend-v1\';\nlet db','window.fetch=function(input,init)','pire-customers-safe-v1'];
for(const marker of forbidden){if(html.includes(marker))throw new Error('Legacy işareti temizlenemedi: '+marker)}
if(!html.includes('id="pire-header-safety-fix"'))throw new Error('Temizlik sonrası UI patch zinciri korunamadı.');
if(!html.includes('id="pire-student-edit-fix"'))throw new Error('Temizlik sonrası öğrenci düzenleme uyumluluğu korunamadı.');
if(!html.includes('data-pire-canonical-customers="true"'))throw new Error('Canonical müşteri CRM loader eklenemedi.');

fs.writeFileSync(file,html,'utf8');
console.log('Fix123 legacy backend ve local müşteri CRM deploy çıktısından çıkarıldı.');
