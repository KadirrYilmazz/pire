const assert=require('node:assert/strict');
const handler=require('../api/login-notification');

function req({token='',origin='https://pire.test'}={}){return {method:'POST',headers:{host:'pire.test',origin,...(token?{authorization:`Bearer ${token}`}:{})},socket:{remoteAddress:'127.0.0.1'}}}
function res(){return {statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v},end(value){this.body=JSON.parse(value)}}}
async function run(name,fn){try{await fn();console.log(`✓ ${name}`)}catch(error){console.error(`✗ ${name}`);throw error}}
function baseEnv(){process.env.SUPABASE_URL='https://supabase.test';process.env.SUPABASE_PUBLISHABLE_KEY='publishable';process.env.ALLOWED_ORIGIN='https://pire.test';delete process.env.WHATSAPP_ACCESS_TOKEN;delete process.env.WHATSAPP_PHONE_NUMBER_ID}
function mockFetch({role='Yönetici',status='Aktif',phone='05326706353',lastLoginAt=null,metaOk=true}={}){
  const calls=[];
  global.fetch=async(url,init={})=>{
    calls.push({url:String(url),init});
    if(String(url).endsWith('/auth/v1/user'))return new Response(metaOk?JSON.stringify({id:'user-1'}):'{}',{status:metaOk?200:401});
    if(String(url).includes('/rest/v1/pire_profiles')&&(!init.method||init.method==='GET'))return new Response(JSON.stringify([{id:'user-1',role,roles:[role],status,phone,last_login_at:lastLoginAt}]),{status:200});
    if(String(url).includes('/rest/v1/pire_profiles')&&init.method==='PATCH')return new Response(null,{status:204});
    if(String(url).includes('graph.facebook.com'))return new Response(JSON.stringify({messages:[{id:'wamid.test'}]}),{status:200});
    return new Response('{}',{status:404});
  };
  return calls;
}

(async()=>{
  baseEnv();
  await run('oturum olmadan bildirim reddedilir',async()=>{const out=res();await handler(req(),out);assert.equal(out.statusCode,401)});
  await run('sahte token reddedilir',async()=>{mockFetch({metaOk:false});const out=res();await handler(req({token:'fake'}),out);assert.equal(out.statusCode,401)});
  await run('yönetici olmayan hesap WhatsApp gönderemez',async()=>{mockFetch({role:'Veli'});const out=res();await handler(req({token:'valid-parent'}),out);assert.equal(out.statusCode,403)});
  await run('telefon istemciden değil doğrulanmış profilden alınır',async()=>{baseEnv();process.env.WHATSAPP_ACCESS_TOKEN='secret';process.env.WHATSAPP_PHONE_NUMBER_ID='sender-1';const calls=mockFetch();const out=res();await handler(req({token:'valid-admin'}),out);assert.equal(out.statusCode,200);const graph=calls.find(call=>call.url.includes('graph.facebook.com'));assert(graph);assert.equal(JSON.parse(graph.init.body).to,'905326706353')});
  await run('aynı oturumun yakın tekrarı ikinci mesajı göndermez',async()=>{baseEnv();process.env.WHATSAPP_ACCESS_TOKEN='secret';process.env.WHATSAPP_PHONE_NUMBER_ID='sender-1';const calls=mockFetch({lastLoginAt:new Date().toISOString()});const out=res();await handler(req({token:'valid-admin-2'}),out);assert.equal(out.statusCode,200);assert.equal(out.body.duplicate,true);assert.equal(calls.some(call=>call.url.includes('graph.facebook.com')),false)});
  await run('WhatsApp yapılandırması yoksa güvenli hata döner',async()=>{baseEnv();mockFetch();const out=res();await handler(req({token:'valid-admin-3'}),out);assert.equal(out.statusCode,503);assert.equal(out.body.code,'whatsapp_not_configured')});
  await run('Türkiye telefonları uluslararası biçime çevrilir',async()=>{assert.equal(handler._test.normalizeTurkishPhone('0 (532) 670 63 53'),'905326706353');assert.equal(handler._test.normalizeTurkishPhone('123'),'')});
})().catch(()=>process.exitCode=1);
