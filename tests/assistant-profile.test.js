const assert=require('node:assert/strict');
const handler=require('../api/assistant-profile');

function req({token='',method='GET'}={}){return {method,headers:{host:'pire.test',origin:'https://pire.test',...(token?{authorization:`Bearer ${token}`}:{})}}}
function res(){return {statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v},end(value){this.body=JSON.parse(value)}}}
function setup({gender='Erkek',status='Aktif',valid=true}={}){
  process.env.SUPABASE_URL='https://supabase.test';process.env.SUPABASE_PUBLISHABLE_KEY='publishable';process.env.ALLOWED_ORIGIN='https://pire.test';
  global.fetch=async(url)=>{
    if(String(url).endsWith('/auth/v1/user'))return new Response(valid?JSON.stringify({id:'user-1'}):'{}',{status:valid?200:401});
    if(String(url).includes('/rest/v1/pire_profiles'))return new Response(JSON.stringify([{gender,status}]),{status:200});
    return new Response('{}',{status:404});
  };
}

(async()=>{
  setup();let out=res();await handler(req(),out);assert.equal(out.statusCode,401);
  setup({valid:false});out=res();await handler(req({token:'fake'}),out);assert.equal(out.statusCode,401);
  setup({gender:'Kadın'});out=res();await handler(req({token:'valid'}),out);assert.deepEqual(out.body,{gender:'Kadın'});
  setup({gender:'Erkek'});out=res();await handler(req({token:'valid'}),out);assert.deepEqual(out.body,{gender:'Erkek'});
  setup({gender:'uydurma'});out=res();await handler(req({token:'valid'}),out);assert.deepEqual(out.body,{gender:'Belirtilmedi'});
  setup({status:'Pasif'});out=res();await handler(req({token:'valid'}),out);assert.equal(out.statusCode,403);
  console.log('✓ profil hitabı yalnızca doğrulanmış aktif Supabase profilinden alınır');
})().catch(()=>process.exitCode=1);
