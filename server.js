const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const restLayout=require('./public/rest-layout');
const bombPhysics=require('./public/bomb-physics');
const{configuredStore}=require('./state-store');
const file = path.join(__dirname, 'data.json');
function initial() { return {posts:[],warmth:0}; }
function validRest(rest){return rest&&Number.isFinite(rest.x)&&Number.isFinite(rest.y)&&rest.x>=0&&rest.x<=1&&rest.y>=0&&rest.y<=1;}
function freeRest(posts,rest,exclude,space){return restLayout.canPlace(posts,rest,exclude,space);}
function findRest(posts,space){for(const y of [.18,.5,.82])for(const x of [.12,.5,.88])if(freeRest(posts,{x,y},null,space))return{x,y};for(let y=.04;y<=.96;y+=.08)for(let x=.04;x<=.96;x+=.08)if(freeRest(posts,{x,y},null,space))return{x,y};return null;}
function createApp(dataFile=file,{store=null,requireDatabase=false}={}){
 if(requireDatabase)store=configuredStore();
 let state; try {state=JSON.parse(fs.readFileSync(dataFile,'utf8'));}catch{state=initial();}
 state.posts.forEach((p,i)=>{if(!validRest(p.rest))p.rest={x:i%3*.38+.12,y:Math.floor(i/3)%3*.32+.18};});
 state.bombs=[];let bombAvailableAt=0;
 let persisted=structuredClone({posts:state.posts,warmth:state.warmth||0}),queue=Promise.resolve();
 let startupError;const ready=store?store.load().then(saved=>{if(saved){state.posts=saved.posts;state.warmth=saved.warmth||0;persisted=structuredClone(saved);}}).catch(e=>{startupError=e;}):Promise.resolve();
 // The server owns knockback in normalized resting-area coordinates.
 const motions=new Map(),impacted=new Set(),walls={left:0,right:1,top:0,bottom:1};
 const advanceAll=time=>{for(const[id,m]of motions){const p=state.posts.find(p=>p.id===id);if(!p||p.respawnAt>time||p.rest.x!==m.homeX||p.rest.y!==m.homeY){motions.delete(id);continue;}bombPhysics.advance(m,time,walls);if(m.done)motions.delete(id);}};
 function advanceWorld(time){
  for(const b of state.bombs){if(b.impactAt>time||impacted.has(b.id))continue;advanceAll(b.impactAt);impacted.add(b.id);
   for(const p of state.posts){if(p.respawnAt>b.impactAt)continue;const prior=motions.get(p.id),x=prior?.x??p.rest.x,y=prior?.y??p.rest.y,dx=x-b.x,dy=y-b.y,d=Math.hypot(dx,dy);if(d>1.15)continue;
    const angle=d<.001?(p.id.charCodeAt(0)%12)*Math.PI/6:Math.atan2(dy,dx),speed=1.9+1.8*Math.max(0,1-d/1.15);
    motions.set(p.id,{id:p.id,bombId:b.id,homeX:p.rest.x,homeY:p.rest.y,x,y,vx:Math.cos(angle)*speed+(prior?.vx||0)*.28,vy:Math.sin(angle)*speed+(prior?.vy||0)*.28,angle:prior?.angle||0,spin:(Math.cos(angle)>0?1:-1)*180,bounces:0,lastBounceAt:0,lastWall:null,simulatedAt:b.impactAt,impactAt:b.impactAt,returnAt:b.returnAt,serverDriven:true});
   }
  }advanceAll(time);
  for(const id of impacted)if(!state.bombs.some(b=>b.id===id))impacted.delete(id);
 }
 const save=async()=>{const durable={posts:state.posts,warmth:state.warmth||0};if(store)await store.save(durable);else fs.writeFileSync(dataFile,JSON.stringify(durable));persisted=structuredClone(durable);};
 const json=(res,code,body)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
 const server=http.createServer(async(req,res)=>{
  let release;
  try {
   if(req.url.startsWith('/api/')){const previous=queue;queue=new Promise(r=>release=r);await previous;await ready;if(startupError)throw startupError;if(store){const saved=await store.load();if(saved){state.posts=saved.posts;state.warmth=saved.warmth||0;persisted=structuredClone(saved);}}}
   const url=new URL(req.url,'http://localhost');
   advanceWorld(Date.now());
   state.food=(state.food||[]).filter(f=>f.expiresAt>Date.now());
   state.bombs=state.bombs.filter(b=>b.returnAt+2000>Date.now());
   if(url.pathname==='/api/tank'&&req.method==='GET')return json(res,200,{...state,motions:[...motions.values()],storage:store?'supabase':'local',serverTime:Date.now()});
   if(url.pathname.startsWith('/api/')&&req.method==='POST'){
    let raw='',bytes=0; for await(const chunk of req){bytes+=chunk.length;if(bytes>250000)return json(res,413,{error:'That drawing is too large. Try a simpler sketch.'});raw+=chunk;}
    let body;try{body=JSON.parse(raw);}catch{return json(res,400,{error:'Please send valid JSON.'});}
    if(!body||typeof body!=='object')return json(res,400,{error:'Missing details.'});
    if(url.pathname==='/api/bombs'){
     if(!Number.isFinite(body.x)||!Number.isFinite(body.y)||body.x<0||body.x>1||body.y<0||body.y>1)return json(res,400,{error:'Drop the bubble bomb inside the pond.'});
     if(Date.now()<bombAvailableAt)return json(res,429,{error:'Give the pond a moment to settle.'});
     const bomb={id:randomUUID(),x:body.x,y:body.y,impactAt:Date.now()+1200,returnAt:Date.now()+9700};state.bombs.push(bomb);bombAvailableAt=Date.now()+2500;return json(res,201,bomb);
    }
    if(url.pathname==='/api/food'){
     if(!Number.isFinite(body.x)||!Number.isFinite(body.y)||body.x<0||body.x>1||body.y<0||body.y>1)return json(res,400,{error:'Drop food inside the pond.'});
     if(state.food.length>=8)return json(res,409,{error:'There’s plenty to eat already. Let them finish!'});
     const food={id:randomUUID(),x:body.x,y:body.y,expiresAt:Date.now()+25000};state.food.push(food);return json(res,201,food);
    }
    if(url.pathname==='/api/food/eat'){
     const animal=state.posts.find(p=>p.id===body.animalId);const index=state.food.findIndex(f=>f.id===body.foodId);
     if(!animal||animal.respawnAt>Date.now()||index<0)return json(res,409,{error:'That snack is already gone.'});
     state.food.splice(index,1);return json(res,200,{ok:true});
    }
    if(url.pathname==='/api/posts'){
     const author=typeof body.author==='string'?body.author.trim():''; const text=typeof body.text==='string'?body.text.trim():'';
     if(!author||author.length>32||!text||text.length>240)return json(res,400,{error:'Add a name (up to 32 letters) and a note (up to 240 letters).'});
     const drawing=body.drawing;
     if(drawing!=null&&(typeof drawing!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(drawing)||drawing.length>220000))return json(res,400,{error:'Please redraw your little creature.'});
     if(state.posts.length>=150)return json(res,409,{error:'This prototype tank is full.'});
     if(!drawing)return json(res,400,{error:'Draw an animal before releasing it.'});
     if(body.rest&&!validRest(body.rest))return json(res,400,{error:'Choose a spot inside the pond.'});
     const rest=body.rest||findRest(state.posts,body.space);if(!rest||!freeRest(state.posts,rest,null,body.space))return json(res,409,{error:'That resting spot is too crowded. Try a little more room.'});
     const post={id:randomUUID(),author,text,color:/^#[0-9a-f]{6}$/i.test(body.color)?body.color:'#ff9686',drawing,rest,waves:0,replies:[],hits:0,pops:0,respawnAt:0,createdAt:Date.now()};
     state.posts.push(post);await save();return json(res,201,post);
    }
    const match=url.pathname.match(/^\/api\/posts\/([^/]+)\/(wave|reply|pop|message|appearance|rest)$/);
    if(match){const post=state.posts.find(p=>p.id===match[1]);if(!post)return json(res,404,{error:'This little visitor has drifted away.'});
     if(match[2]==='rest'){
      if(!validRest(body.rest))return json(res,400,{error:'Choose a spot inside the pond.'});
      if(!freeRest(state.posts,body.rest,post.id,body.space))return json(res,409,{error:'That resting spot is too crowded. Returning home.'});post.rest={x:body.rest.x,y:body.rest.y};
     }else if(match[2]==='message'){
      const text=typeof body.text==='string'?body.text.trim():'';if(!text||text.length>240)return json(res,400,{error:'Say something in 240 characters or fewer.'});post.text=text;post.updatedAt=Date.now();
     }else if(match[2]==='appearance'){
      const author=typeof body.author==='string'?body.author.trim():'';if(!author||author.length>32||typeof body.drawing!=='string'||body.drawing.length>220000||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(body.drawing))return json(res,400,{error:'Add your name and a valid animal drawing.'});post.author=author;post.drawing=body.drawing;post.updatedAt=Date.now();
     }else if(match[2]==='pop') {if(post.respawnAt>Date.now())return json(res,409,{error:'Already popped! It will be back soon.'});if(post.respawnAt){post.hits=0;post.respawnAt=0;}post.hits=(post.hits||0)+1;if(post.hits>=3){post.pops=(post.pops||0)+1;post.respawnAt=Date.now()+15000;state.warmth++;}}
     else if(match[2]==='wave'){post.waves++;state.warmth++;}
     else{const author=typeof body.author==='string'?body.author.trim():'';const text=typeof body.text==='string'?body.text.trim():'';if(!author||author.length>32||!text||text.length>240)return json(res,400,{error:'Add your name and a short reply.'});if(post.replies.length>=100)return json(res,409,{error:'This conversation is full.'});post.replies.push({id:randomUUID(),author,text,createdAt:Date.now()});}
     await save();return json(res,200,post);
    }
    return json(res,404,{error:'Not found.'});
   }
   if(req.method!=='GET')return json(res,405,{error:'Method not allowed.'});
   const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
   const root=path.join(__dirname,'public');const target=path.resolve(root,name);if(!target.startsWith(root+path.sep))return json(res,403,{error:'Forbidden'});
   fs.readFile(target,(err,data)=>{if(err)return json(res,404,{error:'Not found'});res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'}[path.extname(target)]||'application/octet-stream'});res.end(data);});
  }catch(err){if(store&&release){state.posts=structuredClone(persisted.posts);state.warmth=persisted.warmth;if(err.statusCode===409){try{const saved=await store.load();if(saved){state.posts=saved.posts;state.warmth=saved.warmth;persisted=structuredClone(saved);}}catch{}}}console.error(err.statusCode?'Pond storage operation failed.':err.message);if(!res.headersSent)json(res,err.statusCode||500,{error:err.statusCode?err.message:'Something went wrong. Please try again.'});}finally{release?.();}
 });
 server.ready=ready.then(()=>{if(startupError)throw startupError;});server.ready.catch(()=>{});server.on('close',()=>{store?.close?.().catch(()=>{});});return server;
}
if(require.main===module){const server=createApp(file,{requireDatabase:true});server.ready.then(()=>server.listen(process.env.PORT||3017,process.env.HOST||(process.env.PORT?'0.0.0.0':'127.0.0.1'),()=>console.log('Pop Pond listening on '+(process.env.PORT||3017)))).catch(()=>{console.error('Database unavailable. Server not started.');process.exitCode=1;});}
module.exports={createApp};
