// Paint-style four-connected flood fill on RGBA pixels, with soft-edge tolerance.
(function(root){
 function fill(image,x,y,color,tolerance=38){
  const{width,height,data}=image;x=Math.floor(x);y=Math.floor(y);
  if(x<0||y<0||x>=width||y>=height||!/^#[0-9a-f]{6}$/i.test(color))return null;
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),seed=(y*width+x)*4;
  if(data[seed]===rgb[0]&&data[seed+1]===rgb[1]&&data[seed+2]===rgb[2]&&data[seed+3]===255)return null;
  const composite=i=>{const a=data[i+3]/255;return[data[i]*a+255*(1-a),data[i+1]*a+255*(1-a),data[i+2]*a+255*(1-a)];},target=composite(seed),visited=new Uint8Array(width*height),queue=new Int32Array(width*height),output=new Uint8ClampedArray(data);let head=0,tail=0,count=0;
  const add=p=>{if(visited[p])return;visited[p]=1;const c=composite(p*4);if(c.some((v,i)=>Math.abs(v-target[i])>tolerance))return;queue[tail++]=p;};add(y*width+x);
  while(head<tail){const p=queue[head++],i=p*4;output[i]=rgb[0];output[i+1]=rgb[1];output[i+2]=rgb[2];output[i+3]=255;count++;const px=p%width;if(px>0)add(p-1);if(px<width-1)add(p+1);if(p>=width)add(p-width);if(p<width*(height-1))add(p+width);}
  return count?{data:output,width,height,count}:null;
 }
 const api={fill};if(typeof module==='object'&&module.exports)module.exports=api;else root.PondFill=api;
})(globalThis);
