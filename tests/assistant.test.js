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
    if(String(url).match(/\/rest\/v1\/pire_ai_[a-z_]+/))return new Response("[]",{status:200});
    if(String(url)==="https://api.openai.com/v1/responses"){
      capture?.(JSON.parse(options.body));
      return new Response(JSON.stringify({output:[{content:[{type:"output_text",text:"Genel Bakış bölümündeki Bugünkü Dersler alanını açın."}]}]}),{status:200});
    }
    throw new Error(`Unexpected URL: ${url}`);
  };
}

function mockOpenAIError(code="invalid_request_error"){
  global.fetch=async(url,options={})=>{
    if(String(url).endsWith("/auth/v1/user"))return new Response(JSON.stringify({id:"user-1",is_anonymous:false}),{status:200});
    if(String(url).includes("/rest/v1/pire_profiles"))return new Response(JSON.stringify([{role:"Yönetici",roles:["Yönetici"],status:"Aktif"}]),{status:200});
    if(String(url)==="https://api.openai.com/v1/responses")return new Response(JSON.stringify({error:{type:code}}),{status:400});
    throw new Error(`Unexpected URL: ${url}`);
  };
}

function mockGroq({capture,content="Kurumda 9 kayıtlı öğrenci bulunuyor; bunların 6'sı aktif.",role="Yönetici",tables={}}={}){
  global.fetch=async(url,options={})=>{
    if(String(url).endsWith("/auth/v1/user"))return new Response(JSON.stringify({id:"user-1",is_anonymous:false}),{status:200});
    if(String(url).includes("/rest/v1/pire_profiles"))return new Response(JSON.stringify([{role,roles:[role],status:"Aktif"}]),{status:200});
    const tableMatch=String(url).match(/\/rest\/v1\/(pire_ai_[a-z_]+)/);
    if(tableMatch)return new Response(JSON.stringify(tables[tableMatch[1]]||[]),{status:200});
    if(String(url)==="https://api.groq.com/openai/v1/chat/completions"){
      capture?.(JSON.parse(options.body));
      return new Response(JSON.stringify({choices:[{message:{content}}]}),{status:200});
    }
    throw new Error(`Unexpected URL: ${url}`);
  };
}

async function run(name,fn){try{handler._test.rateBuckets.clear();await fn();console.log(`✓ ${name}`)}catch(error){console.error(`✗ ${name}`,error);throw error}}

(async()=>{
  await run("oturum olmadan 401",async()=>{mockFetch();const res=response();await handler(request({body:{question:"Ders oluştur"}}),res);assert.equal(res.statusCode,401)});
  await run("sahte token ile 401",async()=>{mockFetch();const res=response();await handler(request({token:"fake",body:{question:"Ders oluştur"}}),res);assert.equal(res.statusCode,401)});
  await run("geçerli Supabase oturumuyla AI yanıtı",async()=>{mockFetch();const res=response();await handler(request({token:"valid",body:{question:"Programı nasıl incelerim?"}}),res);assert.equal(res.statusCode,200);assert.match(res.body.answer,/Genel Bakış/)});
  await run("İngilizce dil seçimi AI yanıt talimatına güvenli biçimde aktarılır",async()=>{let sent;process.env.GROQ_API_KEY="server-only-groq-test-key";mockGroq({capture:value=>{sent=value},content:"PIRE_INTENT:lesson.view\nOpen My Student Panel and review Upcoming Lessons."});const res=response();await handler(request({token:"valid",body:{question:"Where can I see my lessons?",language:"en"}}),res);delete process.env.GROQ_API_KEY;assert.equal(res.statusCode,200);assert.equal(res.body.answer,"Open My Student Panel and review Upcoming Lessons.");assert.match(sent.messages[0].content,/Reply only in concise, actionable English/);assert.doesNotMatch(sent.messages[0].content,/yanıtı düz Türkçe yaz/)});
  await run("geçersiz dil değeri Türkçeye düşer",async()=>{assert.equal(handler._test.responseLanguage("de"),"tr");assert.equal(handler._test.responseLanguage("en"),"en")});
  await run("İngilizce aylık gider özeti kişisel veri içermeden üretilir",async()=>{const answer=handler._test.monthlyExpenseAnswer({metric:"monthly_expenses",month:"2026-08",total:43200,count:7},"en");assert.match(answer,/7 expense records/);assert.match(answer,/August 2026/);assert.match(answer,/TRY|₺/)});
  await run("istemci rolü yetki yükseltemez",async()=>{let sent;mockFetch({role:"Eğitmen",capture:value=>{sent=value}});const res=response();await handler(request({token:"valid",body:{question:"Programı nasıl incelerim?",role:"Yönetici"}}),res);assert.equal(res.statusCode,200);assert.match(sent.instructions,/doğrulanmış rolü: Eğitmen/);assert.doesNotMatch(sent.input,/Yönetici/)});
  await run("yetkisiz finans isteği 403",async()=>{mockFetch({role:"Öğrenci"});const res=response();await handler(request({token:"valid",body:{question:"Kurumun toplam cirosu nedir?"}}),res);assert.equal(res.statusCode,403)});
  await run("yönetici aylık gider toplamını OpenAI olmadan alır",async()=>{let called=false;mockFetch({capture:()=>{called=true}});const res=response();await handler(request({token:"valid",body:{question:"Bu ay ne kadar harcamışız?",summary:{metric:"monthly_expenses",month:"2026-08",total:43200,count:7}}}),res);assert.equal(res.statusCode,200);assert.match(res.body.answer,/43\.200/);assert.equal(res.body.source,"verified-local-summary");assert.equal(called,false)});
  await run("eğitmen sahte yönetici rolü ve gider özetiyle yetki yükseltemez",async()=>{mockFetch({role:"Eğitmen"});const res=response();await handler(request({token:"valid",body:{question:"Bu ay toplam harcamamız ne kadar?",role:"Yönetici",summary:{metric:"monthly_expenses",month:"2026-08",total:43200,count:7}}}),res);assert.equal(res.statusCode,403)});
  await run("kişisel veri modele gönderilmez",async()=>{let called=false;mockFetch({capture:()=>{called=true}});const res=response();await handler(request({token:"valid",body:{question:"Öğrenci Ahmet Yılmaz için 0532 123 45 67 numarasını kontrol et",context:{studentPhone:"05321234567"}}}),res);assert.equal(res.statusCode,400);assert.equal(called,false)});
  await run("istemci bağlamı allowlist dışında kalır",async()=>{let sent;mockFetch({capture:value=>{sent=JSON.stringify(value)}});const res=response();await handler(request({token:"valid",body:{question:"Programı nasıl açarım?",context:{studentName:"Ahmet Yılmaz",phone:"05321234567"}}}),res);assert.equal(res.statusCode,200);assert.doesNotMatch(sent,/Ahmet|05321234567/)});
  await run("yönetici toplu kurum özetiyle genel soruya yanıt alır",async()=>{let sent;mockFetch({capture:value=>{sent=value}});const res=response();await handler(request({token:"valid",body:{question:"Kurumda kaç öğrenci var?",summary:{metric:"institution_overview",generatedDate:"2026-08-23",students:{total:9,active:6},finance:{totalPaid:3950},institution:{name:"Pİ-RE Eğitim Atölye"},studentNames:["GİZLİ KİŞİ"]}}}),res);assert.equal(res.statusCode,200);assert.match(sent.input,/"students":\{"total":9/);assert.doesNotMatch(sent.input,/GİZLİ KİŞİ|studentNames/)});
  await run("eğitmenin gönderdiği kurum özeti modele aktarılmaz",async()=>{let sent;mockFetch({role:"Eğitmen",capture:value=>{sent=JSON.stringify(value)}});const res=response();await handler(request({token:"valid",body:{question:"Programı nasıl açarım?",summary:{metric:"institution_overview",students:{total:999},finance:{totalPaid:999999}}}}),res);assert.equal(res.statusCode,200);assert.doesNotMatch(sent,/999/)});
  await run("OpenAI hata kodu güvenli biçimde istemciye döner",async()=>{mockOpenAIError();const res=response();await handler(request({token:"valid",body:{question:"Kurumda kaç öğrenci var?"}}),res);assert.equal(res.statusCode,502);assert.equal(res.body.serviceCode,"invalid_request_error");assert.doesNotMatch(JSON.stringify(res.body),/server-only-test-key|Kişisel/)});
  await run("Groq ücretsiz modeli kurum özetinden yanıt üretir",async()=>{let sent;process.env.GROQ_API_KEY="server-only-groq-test-key";mockGroq({capture:value=>{sent=value}});const res=response();await handler(request({token:"valid",body:{question:"Kurumda kaç öğrenci var?",summary:{metric:"institution_overview",generatedDate:"2026-08-23",students:{total:9,active:6}}}}),res);delete process.env.GROQ_API_KEY;assert.equal(res.statusCode,200);assert.match(res.body.answer,/9 kayıtlı öğrenci/);assert.equal(sent.model,"openai/gpt-oss-20b");assert.match(sent.messages[0].content,/Markdown işaretleri kullanma/);assert.match(sent.messages[0].content,/özellik uydurma/);assert.match(sent.messages[1].content,/"students":\{"total":9/);assert.doesNotMatch(JSON.stringify(sent),/server-only-groq-test-key/)});
  await run("AI farklı söyleyişten alacak niyetini güvenli görev listesinde seçer",async()=>{process.env.GROQ_API_KEY="server-only-groq-test-key";mockGroq({content:JSON.stringify({answer:"Bu ay toplam 21.000 TL tahsil edilecek.",intent:"finance.receivables"})});const res=response();await handler(request({token:"valid",body:{question:"Bu ay ne kadar alacağım var?",summary:{metric:"institution_overview",finance:{totalBalance:21000}}}}),res);delete process.env.GROQ_API_KEY;assert.equal(res.statusCode,200);assert.equal(res.body.task.intent,"finance.receivables");assert.equal(res.body.task.targetModule,"payments")});
  await run("Groq zorunlu JSON olmadan niyet işaretini ayrıştırır",async()=>{let sent;process.env.GROQ_API_KEY="server-only-groq-test-key";mockGroq({role:"Veli",capture:value=>{sent=value},content:"PIRE_INTENT:lesson.view\nBağlı öğrencinin ders özetini panelinizden inceleyebilirsiniz."});const res=response();await handler(request({token:"valid",body:{question:"Çocuğumun kaç dersi var?"}}),res);delete process.env.GROQ_API_KEY;assert.equal(res.statusCode,200);assert.equal(res.body.task.intent,"lesson.view");assert.doesNotMatch(res.body.answer,/PIRE_INTENT/);assert.equal(sent.response_format,undefined)});
  await run("devam sorusu doğrulanmış önceki görevin bağlamını kullanır",async()=>{process.env.GROQ_API_KEY="server-only-groq-test-key";mockGroq({content:JSON.stringify({answer:"Finans bölümündeki Ödeme Takibi ekranını açın.",intent:"general.answer"})});const res=response();await handler(request({token:"valid",body:{question:"Nereden bakabilirim?",previousTask:{intent:"finance.receivables",targetModule:"payments"}}}),res);delete process.env.GROQ_API_KEY;assert.equal(res.statusCode,200);assert.equal(res.body.task.intent,"finance.receivables");assert.equal(res.body.task.allowed,true)});
  await run("istemciden gelen önceki görev rol yükseltemez",async()=>{process.env.GROQ_API_KEY="server-only-groq-test-key";mockGroq({role:"Eğitmen",content:JSON.stringify({answer:"Genel yardım.",intent:"general.answer"})});const res=response();await handler(request({token:"valid",body:{question:"Nereden bakabilirim?",previousTask:{intent:"finance.receivables",targetModule:"payments"}}}),res);delete process.env.GROQ_API_KEY;assert.equal(res.statusCode,200);assert.equal(res.body.task.intent,"general.answer")});
  await run("AI seçimi doğrulanmış rolün yetkisini aşamaz",async()=>{process.env.GROQ_API_KEY="server-only-groq-test-key";mockGroq({role:"Eğitmen",content:JSON.stringify({answer:"Finans ekranını açın.",intent:"finance.receivables"})});const res=response();await handler(request({token:"valid",body:{question:"Kurumdan beklediğimiz tutarı göster"}}),res);delete process.env.GROQ_API_KEY;assert.equal(res.statusCode,403);assert.equal(res.body.task.intent,"finance.receivables");assert.equal(res.body.task.allowed,false)});
  await run("öğrenci ödeme özeti yalnızca RLS ile okunan sunucu verisinden gelir",async()=>{let sent;process.env.GROQ_API_KEY="server-only-groq-test-key";mockGroq({role:"Öğrenci",capture:value=>{sent=JSON.stringify(value)},content:JSON.stringify({answer:"Bu ay 750 TL ödemeniz kaldı.",intent:"self.payment.view"}),tables:{pire_ai_students:[{id:9203,status:"Aktif",monthly_fee:1500,payment_day:12}],pire_ai_payments:[{student_id:9203,billing_month:"2026-08-01",amount_due:1500,amount_paid:750,status:"Kısmi"}]}});const res=response();await handler(request({token:"valid",body:{question:"Bu ay ne kadar ödeme yapmalıyım?",summary:{metric:"institution_overview",finance:{totalBalance:999999},studentName:"GİZLİ"}}}),res);delete process.env.GROQ_API_KEY;assert.equal(res.statusCode,200);assert.equal(res.body.task.intent,"self.payment.view");assert.match(sent,/\\"balance\\":750/);assert.doesNotMatch(sent,/999999|GİZLİ|9203/)});
  await run("görev yöneticisi eğitmen isteğini güvenilir modüle bağlar",async()=>{const task=handler._test.classifyTask("Bana Kadir hocayı bul",{roles:["Yönetici"]});assert.deepEqual(task,{intent:"teacher.find",targetModule:"teachers",needsGuide:true,allowed:true,confidence:0.95})});
  await run("öğrenci ekleme görüntüleme yerine oluşturma görevine bağlanır",async()=>{const task=handler._test.classifyTask("Öğrenci ekleme işlemini göster",{roles:["Yönetici"]});assert.equal(task.intent,"student.create");assert.equal(task.targetModule,"students");assert.equal(task.allowed,true)});
  await run("Türkçe büyük harfli öğrenci isteği oluşturma görevine bağlanır",async()=>{const task=handler._test.classifyTask("ÖĞRENCİ EKLEMEK İSTİYORUM",{roles:["Yönetici"]});assert.equal(task.intent,"student.create");assert.equal(task.targetModule,"students");assert.equal(task.needsGuide,true)});
  await run("alacak sorusu ödeme rehberine bağlanır",async()=>{const task=handler._test.classifyTask("ALACAKLARIMIZA NEREDEN BAKABİLİRİM",{roles:["Yönetici"]});assert.equal(task.intent,"finance.receivables");assert.equal(task.targetModule,"payments");assert.equal(task.allowed,true)});
  await run("kişi adı Groq modeline gönderilmeden maskelenir",async()=>{let sent;process.env.GROQ_API_KEY="server-only-groq-test-key";mockGroq({capture:value=>{sent=JSON.stringify(value)}});const res=response();await handler(request({token:"valid",body:{question:"Bana Kadir hocayı bul"}}),res);delete process.env.GROQ_API_KEY;assert.equal(res.statusCode,200);assert.equal(res.body.task.targetModule,"teachers");assert.doesNotMatch(sent,/Kadir/);assert.match(sent,/\[EĞİTMEN\]/)});
  await run("yetkisiz görev görev yöneticisinde engellenir",async()=>{mockFetch({role:"Öğrenci"});const res=response();await handler(request({token:"valid",body:{question:"Eğitmenleri göster"}}),res);assert.equal(res.statusCode,403);assert.equal(res.body.task.targetModule,"teachers")});
  await run("rate limit aşımı 429",async()=>{mockFetch();let last;for(let index=0;index<13;index+=1){last=response();await handler(request({token:"valid",body:{question:"Programı nasıl açarım?"},ip:"10.0.0.1"}),last)}assert.equal(last.statusCode,429)});
})().catch(()=>process.exitCode=1);
