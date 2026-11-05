// Shared, density-aware spacing rules for preview and server-side placement.
(function(root){
 function view(space){return{width:Math.max(160,Math.min(2400,Number(space?.width)||360)),height:Math.max(140,Math.min(1800,Number(space?.height)||380))};}
 function metrics(space,count){const{width,height}=view(space),density=Math.min(1,Math.sqrt(6/Math.max(6,count))),room=Math.min(1,Math.sqrt(width*height/(360*320))),base=width<600?Math.max(72,Math.min(104,width*.24)):140;const w=Math.max(38,base*density*room);return{w,h:Math.round(w*.72)};}
 function spacing(space,count){const{width,height}=view(space),{w,h}=metrics(space,count),aspect=width/height,n=Math.max(3,count);return{x:Math.max(.035,Math.min((w+12)/Math.max(40,width-w-6)*.86,.9*Math.sqrt(aspect/n))),y:Math.max(.035,Math.min((h+18)/Math.max(45,height-h-100)*.75,.9/Math.sqrt(aspect*n)))};}
 function canPlace(posts,rest,exclude,space){const count=posts.length+(exclude?0:1),gap=spacing(space,count);return !posts.some(p=>p.id!==exclude&&p.rest&&Math.hypot((p.rest.x-rest.x)/gap.x,(p.rest.y-rest.y)/gap.y)<1);}
 const api={view,metrics,spacing,canPlace};if(typeof module==='object'&&module.exports)module.exports=api;else root.PondRestLayout=api;
})(globalThis);
