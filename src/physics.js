export const R=10,BOUNDS={left:38,right:562,top:38,bottom:612};
export function createState(level){return {x:level.start[0],y:level.start[1],vx:0,vy:0,shots:0,won:false,moving:false,fallen:false,origin:[...level.start],time:0};}
export function shoot(s,dx,dy){if(s.moving||s.won)return false;const n=Math.hypot(dx,dy);if(n<8)return false;const power=Math.min(190,n)*4.4;s.origin=[s.x,s.y];s.vx=dx/n*power;s.vy=dy/n*power;s.shots++;s.moving=true;s.fallen=false;return true;}
function reflect(s,nx,ny,bounce=.87){const dot=s.vx*nx+s.vy*ny;if(dot<0){s.vx-=(1+bounce)*dot*nx;s.vy-=(1+bounce)*dot*ny;return true;}return false;}
export function step(s,l,dt=1/120){const events=[];if(!s.moving||s.won)return events;s.time+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
 if(s.x<BOUNDS.left+R){s.x=BOUNDS.left+R;if(reflect(s,1,0))events.push('bounce');}if(s.x>BOUNDS.right-R){s.x=BOUNDS.right-R;if(reflect(s,-1,0))events.push('bounce');}if(s.y<BOUNDS.top+R){s.y=BOUNDS.top+R;if(reflect(s,0,1))events.push('bounce');}if(s.y>BOUNDS.bottom-R){s.y=BOUNDS.bottom-R;if(reflect(s,0,-1))events.push('bounce');}
 for(const b of l.bumpers){const dx=s.x-b.x,dy=s.y-b.y,n=Math.hypot(dx,dy),rr=R+b.r;if(n<rr){const nx=n?dx/n:1,ny=n?dy/n:0;s.x=b.x+nx*rr;s.y=b.y+ny*rr;if(reflect(s,nx,ny,.87))events.push('bumper');}}
 for(const w of l.walls){const cx=Math.max(w.x,Math.min(w.x+w.w,s.x)),cy=Math.max(w.y,Math.min(w.y+w.h,s.y));const dx=s.x-cx,dy=s.y-cy,n=Math.hypot(dx,dy);if(n<R){if(n>0){s.x+=dx/n*(R-n);s.y+=dy/n*(R-n);if(reflect(s,dx/n,dy/n))events.push('bounce');}else{const edges=[s.x-w.x,w.x+w.w-s.x,s.y-w.y,w.y+w.h-s.y],m=Math.min(...edges),i=edges.indexOf(m);const nx=i===0?-1:i===1?1:0,ny=i===2?-1:i===3?1:0;s.x+=nx*(m+R);s.y+=ny*(m+R);reflect(s,nx,ny);events.push('bounce');}}}
 for(const h of l.hazards)if(Math.hypot(s.x-h.x,s.y-h.y)<h.r-3){s.x=s.origin[0];s.y=s.origin[1];s.vx=s.vy=0;s.moving=false;s.fallen=true;events.push('fall');return events;}
 if(Math.hypot(s.vx,s.vy)<180&&Math.hypot(s.x-l.goal[0],s.y-l.goal[1])<17){s.x=l.goal[0];s.y=l.goal[1];s.vx=s.vy=0;s.moving=false;s.won=true;events.push('win');return events;}
 const drag=Math.exp(-1.55*dt);s.vx*=drag;s.vy*=drag;if(Math.hypot(s.vx,s.vy)<13){s.vx=s.vy=0;s.moving=false;events.push('rest');}return events;
}
export function predict(s,l,dx,dy){const clone={...s,origin:[...s.origin]};shoot(clone,dx,dy);const points=[];for(let i=0;i<180&&clone.moving;i++){step(clone,l);if(i%5===0)points.push([clone.x,clone.y]);}return points;}
export function pullVector(start, end) { return { dx:start.x-end.x, dy:start.y-end.y }; }
