const test=require('node:test'),assert=require('node:assert/strict');
const{advance}=require('../public/bomb-physics');
const bounds={left:.1,right:.9,top:.2,bottom:.8};
function shock(extra={}){return{homeX:.5,homeY:.5,x:.5,y:.5,vx:3.1,vy:2.3,angle:0,spin:180,bounces:0,lastBounceAt:0,lastWall:null,simulatedAt:0,impactAt:0,returnAt:8500,...extra};}
test('edge impacts reverse velocity and lose some energy',()=>{const s=shock({x:.89,vx:2,vy:0});const hits=advance(s,20,bounds);assert.ok(hits.some(h=>h.wall==='right'));assert.ok(s.vx<0&&Math.abs(s.vx)<2);assert.ok(s.x<=bounds.right);});
test('a strong blast produces repeated rebounds without leaving the pond',()=>{const s=shock();for(let time=16;time<=3000;time+=16){advance(s,time,bounds);assert.ok(s.x>=bounds.left&&s.x<=bounds.right);assert.ok(s.y>=bounds.top&&s.y<=bounds.bottom);assert.ok(Number.isFinite(s.vx+s.vy+s.angle));assert.ok(Math.abs(s.angle)<=34);}assert.ok(s.bounces>=4,'Expected several genuine wall rebounds, got '+s.bounces);});
test('the spring restores the recorded home and clears the tilt',()=>{const s=shock();advance(s,8500,bounds);assert.equal(s.done,true);assert.equal(s.x,s.homeX);assert.equal(s.y,s.homeY);assert.equal(s.angle,0);});
test('an updated viewport keeps the final position inside its new bounds',()=>{const s=shock({homeX:.05,homeY:.95});advance(s,9000,bounds);assert.equal(s.x,bounds.left);assert.equal(s.y,bounds.bottom);});
