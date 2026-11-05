// Velocity-driven knockback, elastic pond walls, then a damped spring home.
(function(root){
 function advance(shock,time,bounds){
  const collisions=[];const until=Math.min(time,shock.returnAt);
  while(shock.simulatedAt<until-.001){
   const dt=Math.min(1/120,(until-shock.simulatedAt)/1000),age=(shock.simulatedAt-shock.impactAt)/1000;
   const spring=age<1.8?0:age<4.5?5:age<7?12:26;
   const drag=age<1.8?.35:age<4.5?2.8:age<7?5.4:10;
   shock.vx+=(-spring*(shock.x-shock.homeX)-drag*shock.vx)*dt;
   shock.vy+=(-spring*(shock.y-shock.homeY)-drag*shock.vy)*dt;
   shock.x+=shock.vx*dt;shock.y+=shock.vy*dt;
   const bounce=(wall)=>{shock.bounces++;shock.lastBounceAt=shock.simulatedAt;shock.lastWall=wall;shock.spin+=(wall==='left'||wall==='bottom'?1:-1)*110;collisions.push({wall,x:shock.x,y:shock.y});};
   if(shock.x<bounds.left){shock.x=bounds.left+(bounds.left-shock.x);shock.vx=Math.abs(shock.vx)*.84;bounce('left');}
   if(shock.x>bounds.right){shock.x=bounds.right-(shock.x-bounds.right);shock.vx=-Math.abs(shock.vx)*.84;bounce('right');}
   if(shock.y<bounds.top){shock.y=bounds.top+(bounds.top-shock.y);shock.vy=Math.abs(shock.vy)*.84;bounce('top');}
   if(shock.y>bounds.bottom){shock.y=bounds.bottom-(shock.y-bounds.bottom);shock.vy=-Math.abs(shock.vy)*.84;bounce('bottom');}
   shock.x=Math.max(bounds.left,Math.min(bounds.right,shock.x));shock.y=Math.max(bounds.top,Math.min(bounds.bottom,shock.y));
   shock.spin+=(-18*shock.angle-3*shock.spin)*dt;shock.angle+=shock.spin*dt;
   shock.angle=Math.max(-34,Math.min(34,shock.angle));
   shock.simulatedAt+=dt*1000;
  }
  if(time>=shock.returnAt){shock.x=Math.max(bounds.left,Math.min(bounds.right,shock.homeX));shock.y=Math.max(bounds.top,Math.min(bounds.bottom,shock.homeY));shock.angle=0;shock.done=true;}
  return collisions;
 }
 const api={advance};if(typeof module==='object'&&module.exports)module.exports=api;else root.PondBombPhysics=api;
})(globalThis);
