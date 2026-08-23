"use strict";

const assert=require("node:assert/strict");
const handler=require("../api/assistant-sync");

process.env.NODE_ENV="production";
process.env.SUPABASE_URL="https://example.supabase.co";
process.env.SUPABASE_ANON_KEY="publishable-test-key";
process.env.ALLOWED_ORIGINS="https://pire-v0-kurtarilmis-fix.vercel.app";

function request({token,role,body={}}={}){return {method:"POST",headers:{origin:"https://pire-v0-kurtarilmis-fix.vercel.app",...(token?{authorization:`Bearer ${token}`}:{})},body:{...body,role},socket:{remoteAddress:"127.0.0.1"}}}
function response(){return {statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v},status(code){this.statusCode=code;return this},json(value){this.body=value;return this}}}
function mockFetch({validToken="valid",role="Yönetici",capture=[]}={}){
  global.fetch=async(url,options={})=>{
    if(String(url).endsWith("/auth/v1/user"))return options.headers.Authorization===`Bearer ${validToken}`?new Response(JSON.stringify({id:"user-1",is_anonymous:false}),{status:200}):new Response("{}",{status:401});
    if(String(url).includes("/rest/v1/pire_profiles"))return new Response(JSON.stringify([{role,roles:[role],status:"Aktif"}]),{status:200});
    capture.push({url:String(url),method:options.method||"GET",body:options.body||""});
    if((options.method||"GET")==="GET")return new Response("[]",{status:200});
    return new Response(null,{status:204});
  };
}
const snapshot={students:[{id:1,name:"GİZLİ KİŞİ",phone:"05551112233",status:"Aktif",monthly_fee:1500,payment_day:12}],lessons:[{id:2,course:"Piyano",teacher_ref:"Kişisel olmayan dahili referans",lesson_date:"2026-08-23",start_time:"14:00",duration_minutes:60,status:"Planlandı"}],lesson_students:[{lesson_id:2,student_id:1}],payments:[{id:3,student_id:1,billing_month:"2026-08-01",amount_due:1500,amount_paid:750,status:"Kısmi"}],packages:[],attendance:[]};
async function run(name,fn){handler._test.buckets.clear();try{await fn();console.log(`✓ ${name}`)}catch(error){console.error(`✗ ${name}`,error);throw error}}

(async()=>{
  await run("eşitleme oturumsuz isteği reddeder",async()=>{mockFetch();const res=response();await handler(request({body:{snapshot}}),res);assert.equal(res.statusCode,401)});
  await run("eşitleme sahte tokenı reddeder",async()=>{mockFetch();const res=response();await handler(request({token:"fake",body:{snapshot}}),res);assert.equal(res.statusCode,401)});
  await run("eşitleme yönetici olmayan gerçek oturumu reddeder",async()=>{mockFetch({role:"Veli"});const res=response();await handler(request({token:"valid",role:"Yönetici",body:{snapshot}}),res);assert.equal(res.statusCode,403)});
  await run("istemciden gönderilen sahte rol yetki yükseltemez",async()=>{mockFetch({role:"Öğrenci"});const res=response();await handler(request({token:"valid",role:"Yönetici",body:{snapshot}}),res);assert.equal(res.statusCode,403)});
  await run("geçerli yönetici oturumu allowlist verilerini RLS altında eşitler",async()=>{const capture=[];mockFetch({capture});const res=response();await handler(request({token:"valid",body:{snapshot}}),res);assert.equal(res.statusCode,200);assert.equal(res.body.counts.students,1);const sent=capture.map(item=>item.body).join(" ");assert.doesNotMatch(sent,/GİZLİ|05551112233|Kişisel olmayan|\"name\"|\"phone\"/);assert.match(sent,/monthly_fee/);assert(capture.every(item=>!item.body||!item.body.includes("publishable-test-key")))});
  await run("bozuk ve ilişkisi olmayan satırlar eşitlemeye alınmaz",async()=>{const safe=handler._test.sanitizeSnapshot({students:[{id:1,payment_day:99}],lessons:[{id:2,lesson_date:"bozuk"}],payments:[{id:3,student_id:999,billing_month:"2026-08-01"}],unknown:{tc:"12345678901"}});assert.equal(safe.students[0].payment_day,1);assert.equal(safe.lessons.length,0);assert.equal(safe.payments.length,0);assert.doesNotMatch(JSON.stringify(safe),/12345678901|unknown/)});
  await run("eşitleme hız sınırını uygular",async()=>{mockFetch();let last;for(let i=0;i<13;i++){last=response();await handler(request({token:"valid",body:{snapshot:{}}}),last)}assert.equal(last.statusCode,429)});
})().catch(()=>process.exitCode=1);
