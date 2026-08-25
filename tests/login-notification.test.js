const assert=require('node:assert/strict');
const handler=require('../api/login-notification');

const LOGIN_AT='2026-08-25T21:00:00.000Z';
function req({token='',origin='https://pire.test'}={}){return {method:'POST',headers:{host:'pire.test',origin,...(token?{authorization:`Bearer ${token}`}:{})},socket:{remoteAddress:'127.0.0.1'}}}
function res(){return {statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v},end(value){this.body=JSON.parse(value)}}}
async function run(name,fn){try{await fn();console.log(`✓ ${name}`)}catch(error){console.error(`✗ ${name}`);throw error}}
function baseEnv(){process.env.SUPABASE_URL='https://supabase.test';process.env.SUPABASE_PUBLISHABLE_KEY='publishable';process.env.ALLOWED_ORIGIN='https://pire.test';delete process.env.WHATSAPP_ACCESS_TOKEN;delete process.env.WHATSAPP_PHONE_NUMBER_ID}
function enableWhatsApp(){process.env.WHATSAPP_ACCESS_TOKEN='secret';process.env.WHATSAPP_PHONE_NUMBER_ID='sender-1'}
function mockFetch({role='Yönetici',status='Aktif',phone='05326706353',lastLoginAt=null,authOk=true,claimWon=true,claimOk=true,metaOk=true}={}){
  const calls=[];
  global.fetch=async(url,init={})=>{
    const call={url:String(url),init};calls.push(call);
    if(call.url.endsWith('/auth/v1/user'))return new Response(authOk?JSON.stringify({id:'user-1',last_sign_in_at:LOGIN_AT}):'{}',{status:authOk?200:401});
    if(call.url.includes('/rest/v1/pire_profiles')&&(!init.method||init.method==='GET'))return new Response(JSON.stringify([{id:'user-1',role,roles:[role],status,phone,last_login_at:lastLoginAt}]),{status:200});
    if(call.url.includes('/rest/v1/pire_profiles')&&init.method==='PATCH')return new Response(claimOk?JSON.stringify(claimWon?[{id:'user-1'}]:[]):'{}',{status:claimOk?200:503});
    if(call.url.includes('graph.facebook.com'))return new Response(metaOk?JSON.stringify({messages:[{id:'wamid.test'}]}):JSON.stringify({error:{code:131000}}),{status:metaOk?200:500});
    return new Response('{}',{status:404});
  };
  return calls;
}

(async()=>{
  baseEnv();
  await run('oturum olmadan bildirim reddedilir',async()=>{const out=res();await handler(req(),out);assert.equal(out.statusCode,401)});
  await run('sahte token reddedilir',async()=>{mockFetch({authOk:false});const out=res();await handler(req({token:'fake'}),out);assert.equal(out.statusCode,401)});
  await run('yönetici olmayan hesap WhatsApp gönderemez',async()=>{mockFetch({role:'Veli'});const out=res();await handler(req({token:'valid-parent'}),out);assert.equal(out.statusCode,403)});
  await run('telefon istemciden değil doğrulanmış profilden alınır',async()=>{baseEnv();enableWhatsApp();const calls=mockFetch();const out=res();await handler(req({token:'valid-admin'}),out);assert.equal(out.statusCode,200);const graph=calls.find(call=>call.url.includes('graph.facebook.com'));assert(graph);assert.equal(JSON.parse(graph.init.body).to,'905326706353')});
  await run('aynı Supabase girişi ikinci mesajı göndermez',async()=>{baseEnv();enableWhatsApp();const calls=mockFetch({lastLoginAt:'2026-08-25T21:00:01.000Z'});const out=res();await handler(req({token:'same-session'}),out);assert.equal(out.statusCode,200);assert.equal(out.body.duplicate,true);assert.equal(calls.some(call=>call.url.includes('graph.facebook.com')),false)});
  await run('eşzamanlı istekte kaydı kazanamayan mesaj göndermez',async()=>{baseEnv();enableWhatsApp();const calls=mockFetch({claimWon:false});const out=res();await handler(req({token:'concurrent'}),out);assert.equal(out.statusCode,200);assert.equal(out.body.duplicate,true);assert.equal(calls.some(call=>call.url.includes('graph.facebook.com')),false)});
  await run('profil kaydı başarısızsa WhatsApp çağrılmaz',async()=>{baseEnv();enableWhatsApp();const calls=mockFetch({claimOk:false});const out=res();await handler(req({token:'claim-failure'}),out);assert.equal(out.statusCode,503);assert.equal(calls.some(call=>call.url.includes('graph.facebook.com')),false)});
  await run('WhatsApp çağrısı yalnızca atomik kayıttan sonra yapılır',async()=>{baseEnv();enableWhatsApp();const calls=mockFetch({metaOk:false});const out=res();await handler(req({token:'meta-failure'}),out);assert.equal(out.statusCode,502);assert.equal(out.body.code,'131000');const patchIndex=calls.findIndex(call=>call.init.method==='PATCH');const graphIndex=calls.findIndex(call=>call.url.includes('graph.facebook.com'));assert(patchIndex>=0&&graphIndex>patchIndex)});
  await run('WhatsApp yapılandırması yoksa profil işaretlenmez',async()=>{baseEnv();const calls=mockFetch();const out=res();await handler(req({token:'not-configured'}),out);assert.equal(out.statusCode,503);assert.equal(out.body.code,'whatsapp_not_configured');assert.equal(calls.some(call=>call.init.method==='PATCH'),false)});
  await run('Türkiye telefonları uluslararası biçime çevrilir',async()=>{assert.equal(handler._test.normalizeTurkishPhone('0 (532) 670 63 53'),'905326706353');assert.equal(handler._test.normalizeTurkishPhone('123'),'')});
})().catch(()=>process.exitCode=1);
