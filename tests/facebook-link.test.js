const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','pire-language.js'),'utf8');

test('Facebook ikonu gerçek Pİ-RE sayfasına güvenli bağlantı verir',()=>{
  assert.match(source,/function linkFacebookIcon\(\)/);
  assert.match(source,/\.pire-social-icon\.facebook-icon:not\(a\)/);
  assert.match(source,/https:\/\/www\.facebook\.com\/profile\.php\?id=61593800193545/);
  assert.match(source,/link\.target='_blank'/);
  assert.match(source,/link\.rel='noopener noreferrer'/);
  assert.match(source,/Pİ-RE Facebook sayfasını aç/);
  assert.match(source,/function sync\(\)\{linkFacebookIcon\(\)/);
});


test('site genelindeki etkileşimli kontroller el imleci kullanır',()=>{
  assert.match(source,/button:not\(:disabled\),a\[href\],select,summary/);
  assert.match(source,/\.role-view-switch,\.role-view-switch select\{cursor:pointer!important\}/);
  assert.match(source,/button:disabled,select:disabled,input:disabled\{cursor:not-allowed!important\}/);
  assert.match(source,/a\.pire-social-icon\.facebook-icon\{cursor:pointer!important/);
});

test('LinkedIn ikonu Pİ-RE profiline güvenli bağlantı verir',()=>{
  assert.match(source,/function addLinkedInIcon\(\)/);
  assert.match(source,/\.pire-social-icon\.linkedin-icon/);
  assert.match(source,/https:\/\/www\.linkedin\.com\/in\/pire-e%C4%9Fitim-at%C3%B6lye-536a7641b\//);
  assert.match(source,/Pİ-RE LinkedIn profilini aç/);
  assert.match(source,/facebook\?facebook\.after\(link\):container\.appendChild\(link\)/);
  assert.match(source,/link\.target='_blank'/);
  assert.match(source,/link\.rel='noopener noreferrer'/);
  assert.match(source,/function sync\(\)\{linkFacebookIcon\(\);addLinkedInIcon\(\)/);
});

test('TikTok ikonu Pİ-RE profiline güvenli bağlantı verir',()=>{
  assert.match(source,/function linkTikTokIcon\(\)/);
  assert.match(source,/\.pire-social-icon\.tiktok-icon:not\(a\)/);
  assert.match(source,/https:\/\/www\.tiktok\.com\/@pire\.egitimatolye/);
  assert.match(source,/Pİ-RE TikTok profilini aç/);
  assert.match(source,/a\.pire-social-icon\.tiktok-icon\{cursor:pointer!important/);
  assert.match(source,/link\.target='_blank'/);
  assert.match(source,/link\.rel='noopener noreferrer'/);
  assert.match(source,/function sync\(\)\{linkFacebookIcon\(\);linkTikTokIcon\(\);addLinkedInIcon\(\)/);
});
