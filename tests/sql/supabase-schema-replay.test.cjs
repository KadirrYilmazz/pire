const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {PGlite}=require(process.env.PIRE_PGLITE_MODULE_PATH||'@electric-sql/pglite');
const {prepare}=require('../../scripts/prepare-supabase-bootstrap');
const root=path.resolve(__dirname,'../..');
const db=new PGlite();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pire-schema-replay-'));
let source;
test.before(async()=>{
  source=prepare(path.join(temp,'prepared'),'bootstrap-admin@example.invalid');
  // Supabase-managed Auth scaffolding only; no production users or records.
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email text,phone text,raw_app_meta_data jsonb default '{}'::jsonb,raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema public,auth to anon,authenticated,service_role;`);
  for(const file of fs.readdirSync(path.join(source,'migrations')).filter(x=>x.endsWith('.sql')).sort()){
    try{await db.exec(fs.readFileSync(path.join(source,'migrations',file),'utf8'))}
    catch(error){throw new Error(`Migration replay failed: ${file}: ${error.message}`)}
  }
});
test.after(async()=>{await db.close();fs.rmSync(temp,{recursive:true,force:true})});
test('all recorded migrations and profile-gender reconciliation rebuild the live columns',async()=>{
  const columns=(await db.query(`select table_name,column_name,udt_name,is_nullable,column_default,is_identity
    from information_schema.columns where table_schema='public' order by table_name,ordinal_position`)).rows;
  assert.deepEqual(columns,require('./live-schema-columns.json'));
});
for(const group of ['constraints','policies','indexes','triggers'])test(`replayed ${group} match live metadata`,async()=>{
  const actual=(await db.query(fs.readFileSync(path.join(__dirname,'schema-metadata-query.sql'),'utf8'))).rows[0].schema_metadata;
  const expected=require('./live-schema-metadata.json');
  // PostgreSQL 18 catalogs NOT NULL as constraints; production PG17 reports
  // it through information_schema instead. Nullability is checked above.
  actual.constraints=actual.constraints.filter(x=>x.type!=='n');
  expected.constraints=expected.constraints.filter(x=>x.type!=='n');
  {
    const same=(a,b)=>JSON.stringify(Object.entries(a).sort())===JSON.stringify(Object.entries(b).sort());
    const missing=expected[group].filter(x=>!actual[group].some(y=>same(x,y)));
    const extra=actual[group].filter(x=>!expected[group].some(y=>same(x,y)));
    assert.equal(missing.length+extra.length,0,`${group}: missing=${JSON.stringify(missing)} extra=${JSON.stringify(extra)}`);
  }
});
test('replayed function bodies and security settings match live definitions',async()=>{
  const actual=(await db.query(fs.readFileSync(path.join(__dirname,'schema-functions-query.sql'),'utf8'))).rows;
  const expected=require('./live-schema-functions.json');
  const normalize=fn=>({...fn,source:fn.source.replace(/bootstrap-admin@example\.invalid/g,'__PIRE_BOOTSTRAP_ADMIN_EMAIL__').trim()});
  assert.equal(actual.length,expected.length);
  for(const fn of expected){
    const rebuilt=actual.find(x=>x.schema===fn.schema&&x.name===fn.name&&x.arguments===fn.arguments);
    assert.ok(rebuilt,fn.schema+'.'+fn.name);
    assert.deepEqual(normalize(rebuilt),normalize(fn),fn.schema+'.'+fn.name);
  }
});
test('profile-gender migration can be repeated without changing existing values',async()=>{
  await db.query(`insert into auth.users(id,email) values($1::uuid,$2)`,['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bootstrap-admin@example.invalid']);
  await db.exec(`update public.pire_profiles set gender='Erkek'`);
  const pending=fs.readdirSync(path.join(source,'migrations')).find(x=>x.includes('fix143_schema_reconciliation'));
  await db.exec(fs.readFileSync(path.join(source,'migrations',pending),'utf8'));
  assert.equal((await db.query('select gender from public.pire_profiles')).rows[0].gender,'Erkek');
  await assert.rejects(db.query("update public.pire_profiles set gender='invalid'"),/gender_check/);
});
