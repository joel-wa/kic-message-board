const fs=require('node:fs'),path=require('node:path');
function storageError(){const e=Error('The pond could not be saved. Please try again.');e.statusCode=503;return e;}
function createPostgresStore({connectionString,pondId='community',pool}={}){
 if(!pool){const u=new URL(connectionString);if(!['postgres:','postgresql:'].includes(u.protocol))throw Error('Set a PostgreSQL database URL.');for(const key of ['sslmode','sslrootcert','sslcert','sslkey'])u.searchParams.delete(key);const{Pool}=require('pg');pool=new Pool({connectionString:u.toString(),max:3,connectionTimeoutMillis:10000,idleTimeoutMillis:30000,query_timeout:15000,ssl:{rejectUnauthorized:true,ca:fs.readFileSync(path.join(__dirname,'certs/supabase-root-2021.crt'),'utf8')}});pool.on('error',()=>console.error('Database connection interrupted.'));}
 let revision;
 return{
  async load(){try{const r=await pool.query('select data, revision from public.pop_pond_state where id=$1',[pondId]);if(!r.rows.length){revision=null;return null;}revision=String(r.rows[0].revision);return structuredClone(r.rows[0].data);}catch{throw storageError();}},
  async save(state){try{const payload=JSON.stringify({posts:state.posts,warmth:state.warmth||0});const r=revision===null?await pool.query('insert into public.pop_pond_state(id,data) values($1,$2::jsonb) on conflict do nothing returning revision',[pondId,payload]):await pool.query('update public.pop_pond_state set data=$2::jsonb, revision=revision+1, updated_at=now() where id=$1 and revision=$3::bigint returning revision',[pondId,payload,revision]);if(!r.rows.length){const e=storageError();e.statusCode=409;e.message='The pond changed in another server. Please refresh and try again.';throw e;}revision=String(r.rows[0].revision);}catch(e){if(e.statusCode)throw e;throw storageError();}},
  async close(){await pool.end();}
 };
}
function configuredStore(env=process.env){const url=env.SUPABASE_DATABASE_URL||env.DATABASE_URL;if(url)return createPostgresStore({connectionString:url,pondId:env.POND_ID||'community'});if(env.RENDER==='true'||env.NODE_ENV==='production')throw Error('Set SUPABASE_DATABASE_URL. Production must use durable storage.');return null;}
module.exports={createPostgresStore,configuredStore,storageError};
