const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createApp}=require('../server');
test('fresh production server serves the pond, saves speech and restores resting positions',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pop-pond-')),file=path.join(dir,'data.json');let server;
 const start=async()=>{server=createApp(file);await new Promise(r=>server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+server.address().port;};
 const stop=()=>new Promise(r=>server.close(r));
 try{let base=await start();assert.equal((await fetch(base)).status,200);assert.deepEqual((await(await fetch(base+'/api/tank')).json()).posts,[]);
 const send=async(url,body)=>{const r=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.ok(r.ok);return r.json();};
 const p=await send('/api/posts',{author:'Test',text:'Hello',drawing:'data:image/png;base64,'+'a'.repeat(100),rest:{x:.5,y:0}});
 await send('/api/posts/'+p.id+'/message',{text:'A new thought'});await stop();base=await start();const data=await(await fetch(base+'/api/tank')).json();assert.equal(data.posts[0].text,'A new thought');assert.deepEqual(data.posts[0].rest,{x:.5,y:0});
 }finally{if(server?.listening)await stop();fs.rmSync(dir,{recursive:true,force:true});}
});

