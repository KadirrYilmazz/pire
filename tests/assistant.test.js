"use strict";

const assert=require("node:assert/strict");
const handler=require("../api/assistant");

process.env.NODE_ENV="production";
process.env.SUPABASE_URL="https://example.supabase.co";
process.env.SUPABASE_ANON_KEY="publishable-test-key";
process.env.OPENAI_API_KEY="server-only-test-key";
process.env.ALLOWED_ORIGINS="https://pire-v0-kurtarilmis-fix.vercel.app";

function request({token,body={},origin="https://pire-v0-kurtarilmis-fix.vercel.app",ip="127.0.0.1"}={}){
  return {method:"POST",headers:{origin,"x-forwarded-for":ip,...(token?{authorization:`Bearer ${token}`}:{})},body,socket:{remoteAddress:ip}};
}

function response(){
  return {statusCode:200,headers:{},body:null,setHeader(key,value){this.headers[key]=value},status(code){this.statusCode=code;return this},json(value){this.body=value;return this}};
}

function mockFetch({validToken="valid",role="Yönetici",status="Aktif",capture}={}){
  global.fetch=async(url,options={})=>{
    if(String(url).endsWith("/auth/v1/user"))return options.headers.Authorization===`Bearer ${validToken}`?new Response(JSON.stringify({id:"user-1",is_anonymous:false}),{status:200}):new Response("{}",{status:401});
    if(String(url).includes("/rest/v1/pire_profiles"))return new Response(JSON.stringify([{role,roles:[role],status}]),{status:200});
    if(String(url)==="https://api.openai.com/v1/responses"){
      capture?.(JSON.parse(options.body));
      return new Response(JSON.stringify({output:[{content:[{type:"output_text",text:"Genel Bakış bölümündeki Bugünkü Dersler alanını açın."}]}]}),{status:200});
    }
    throw new Error(`Unexpected URL: ${url}`);
  };
}

async function run(name,fn){try{handler._test.rateBuckets.clear();await fn();console.log(`✓ ${name}`)}catch(error){console.error(`✗ ${name}`);throw error}}

(async()=>{
  await run("oturum olmadan 401",async()=>{mockFetch();const res=response();await handler(request({body:{question:"Ders oluştur"}}),res);assert.equal(res.statusCode,401)});
  await run("sahte token ile 401",async()=>{mockFetch();const res=response();await handler(request({token:"fake",body:{question:"Ders oluştur"}}),res);assert.equal(res.statusCode,401)});
  await run("geçerli Supabase oturumuyla AI yanıtı",async()=>{mockFetch();const res=response();await handler(request({token:"valid",body:{question:"Programı nasıl incelerim?"}}),res);assert.equal(res.statusCode,200);assert.match(res.body.answer,/Genel Bakış/)});
  await run("istemci rolü yetki yükseltemez",async()=>{let sent;mockFetch({role:"Eğitmen",capture:value=>{sent=value}});const res=response();await handler(request({token:"valid",body:{question:"Programı nasıl incelerim?",role:"Yönetici"}}),res);assert.equal(res.statusCode,200);assert.match(sent.instructions,/doğrulanmış rolü: Eğitmen/);assert.doesNotMatch(sent.input,/Yönetici/)});
  await run("yetkisiz finans isteği 403",async()=>{mockFetch({role:"Öğrenci"});const res=response();await handler(request({token:"valid",body:{question:"Kurumun toplam cirosu nedir?"}}),res);assert.equal(res.statusCode,403)});
  await run("kişisel veri modele gönderilmez",async()=>{let called=false;mockFetch({capture:()=>{called=true}});const res=response();await handler(request({token:"valid",body:{question:"Öğrenci Ahmet Yılmaz için 0532 123 45 67 numarasını kontrol et",context:{studentPhone:"05321234567"}}}),res);assert.equal(res.statusCode,400);assert.equal(called,false)});
  await run("istemci bağlamı allowlist dışında kalır",async()=>{let sent;mockFetch({capture:value=>{sent=JSON.stringify(value)}});const res=response();await handler(request({token:"valid",body:{question:"Programı nasıl açarım?",context:{studentName:"Ahmet Yılmaz",phone:"05321234567"}}}),res);assert.equal(res.statusCode,200);assert.doesNotMatch(sent,/Ahmet|05321234567/)});
  await run("rate limit aşımı 429",async()=>{mockFetch();let last;for(let index=0;index<13;index+=1){last=response();await handler(request({token:"valid",body:{question:"Programı nasıl açarım?"},ip:"10.0.0.1"}),last)}assert.equal(last.statusCode,429)});
})().catch(()=>process.exitCode=1);
