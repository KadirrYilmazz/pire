const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const inventory=require('../supabase/source-inventory.json');
const {prepare}=require('../scripts/prepare-supabase-bootstrap');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
test('recorded migration files and versions match the captured live inventory',()=>{
  assert.equal(inventory.migrations.length,34);
  assert.equal(new Set(inventory.migrations.map(x=>x.version)).size,34);
  for(const migration of inventory.migrations){
    const source=fs.readFileSync(path.join(root,'supabase/migrations',migration.file),'utf8');
    assert.equal(hash(source),migration.export_sha256,migration.file);
    assert.ok(migration.file.startsWith(migration.version+'_'));
    assert.doesNotMatch(source,/'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'/);
  }
  const active=fs.readdirSync(path.join(root,'supabase/migrations')).filter(x=>x.endsWith('.sql')).sort();
  const expected=[...inventory.migrations,...inventory.pending_migrations].map(x=>x.file).sort();
  assert.deepEqual(active,expected);
  for(const migration of inventory.pending_migrations){
    const source=fs.readFileSync(path.join(root,'supabase/migrations',migration.file),'utf8');
    assert.equal(hash(source),migration.export_sha256,migration.file);
    assert.equal(migration.status,'prepared_not_applied');
  }
});
test('deployed Edge Function sources and JWT settings are preserved',()=>{
  const config=fs.readFileSync(path.join(root,'supabase/config.toml'),'utf8');
  for(const fn of inventory.edge_functions){
    const source=fs.readFileSync(path.join(root,'supabase/functions',fn.slug,'index.ts'),'utf8');
    assert.equal(hash(source.trim()),fn.normalized_source_sha256,fn.slug);
    assert.ok(config.includes(`[functions.${fn.slug}]\nverify_jwt = ${fn.verify_jwt}`));
  }
});
test('private bootstrap preparation keeps personal identity out of repository sources',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pire-bootstrap-test-'));
  try{
    const output=prepare(path.join(temp,'prepared'),'bootstrap-admin@example.invalid');
    const source=fs.readFileSync(path.join(output,'migrations','20260815143958_create_pire_auth_profiles.sql'),'utf8');
    assert.ok(source.includes('bootstrap-admin@example.invalid'));
    assert.ok(!source.includes('__PIRE_BOOTSTRAP_ADMIN_EMAIL__'));
    assert.throws(()=>prepare(path.join(root,'unsafe-output'),'bootstrap-admin@example.invalid'),/outside the repository/);
    assert.throws(()=>prepare(path.join(temp,'invalid'),"bad'email"),/valid email/);
  }finally{fs.rmSync(temp,{recursive:true,force:true})}
});
