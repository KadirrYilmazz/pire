'use strict';
// Materialize private bootstrap values outside the checked-in migration sources.
const fs=require('node:fs');
const path=require('node:path');
const repo=path.resolve(__dirname,'..');
const placeholder='__PIRE_BOOTSTRAP_ADMIN_EMAIL__';
function prepare(outputRoot,email){
  if(!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email||''))throw new Error('PIRE_BOOTSTRAP_ADMIN_EMAIL must contain a valid email.');
  const output=path.resolve(outputRoot);
  const privateRoot=path.join(repo,'supabase','.temp');
  if((output===repo||output.startsWith(repo+path.sep))&&!(output===privateRoot||output.startsWith(privateRoot+path.sep)))throw new Error('Private output must be outside the repository or inside supabase/.temp.');
  if(fs.existsSync(output))throw new Error('Output directory already exists; choose a new private directory.');
  const target=path.join(output,'supabase');fs.mkdirSync(target,{recursive:true,mode:0o700});
  fs.copyFileSync(path.join(repo,'supabase/config.toml'),path.join(target,'config.toml'));
  fs.cpSync(path.join(repo,'supabase/functions'),path.join(target,'functions'),{recursive:true});
  const migrations=path.join(target,'migrations');fs.mkdirSync(migrations,{mode:0o700});
  for(const file of fs.readdirSync(path.join(repo,'supabase/migrations')).filter(x=>x.endsWith('.sql'))){
    const source=fs.readFileSync(path.join(repo,'supabase/migrations',file),'utf8');
    fs.writeFileSync(path.join(migrations,file),source.split(placeholder).join(email.toLowerCase()),{mode:0o600});
  }
  return target;
}
if(require.main===module){
  try{if(!process.argv[2])throw new Error('Specify a new private output directory.');prepare(process.argv[2],process.env.PIRE_BOOTSTRAP_ADMIN_EMAIL);console.log('Private Supabase source prepared.');}
  catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={prepare};
