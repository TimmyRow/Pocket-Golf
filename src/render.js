import {predict, pullVector} from './physics.js';

export function courseView(level,width,height) {
  const left=Math.min(...level.tiles.map(t=>t.x))-8,top=Math.min(...level.tiles.map(t=>t.y))-16;
  const right=Math.max(...level.tiles.map(t=>t.x+t.w))+8,bottom=Math.max(...level.tiles.map(t=>t.y+t.h))+20;
  const scale=Math.min((width-40)/(right-left),(height-40)/(bottom-top));
  return {width,height,scale,x:(width-(right-left)*scale)/2-left*scale,y:(height-(bottom-top)*scale)/2-top*scale};
}

export function drawCourse(g, level, state, aim, particles, time, reduced, player) {
  g.clear();
  // Floating course silhouette; rails use the exact collision rectangles.
  for (const tile of level.tiles) {
    g.fillStyle(0x5c91a4,.25); g.fillRect(tile.x+8,tile.y+18,tile.w,tile.h);
    g.fillStyle(0x32754d); g.fillRect(tile.x,tile.y+10,tile.w,tile.h);
  }
  for (const tile of level.tiles) {
    g.fillStyle(0x57ae6a); g.fillRect(tile.x,tile.y,tile.w,tile.h);
    for (let x=0;x<2;x++) for(let y=0;y<2;y++) {
      g.fillStyle((x+y)%2?0x59af6c:0x62b875);
      g.fillRect(tile.x+x*36,tile.y+y*36,36,36);
    }
  }
  for (const w of level.walls) {
    g.fillStyle(0x153d35,.14); g.fillRect(w.x+4,w.y+5,w.w,w.h+5);
    g.fillStyle(0x9db8b8); g.fillRect(w.x,w.y,w.w,w.h+5);
    g.fillStyle(0xf5faf3); g.fillRect(w.x,w.y-4,w.w,w.h);
    g.lineStyle(1,0xffffff,.65); g.lineBetween(w.x,w.y-4,w.x+w.w,w.y-4);
  }
  for (const h of level.hazards) {
    g.fillStyle(0x286d91); g.fillCircle(h.x,h.y,h.r);
    g.lineStyle(3,0x8cd5df); g.strokeCircle(h.x,h.y,h.r-1);
    g.lineStyle(2,0xb3e9ed,.6);
    g.lineBetween(h.x-h.r*.4,h.y-5,h.x+h.r*.3,h.y-5);
    g.lineBetween(h.x-h.r*.15,h.y+5,h.x+h.r*.45,h.y+5);
  }
  for (const b of level.bumpers) {
    g.fillStyle(0x26563c,.25); g.fillCircle(b.x+3,b.y+5,b.r+2);
    g.fillStyle(0xcf9235); g.fillCircle(b.x,b.y,b.r);
    g.fillStyle(0xffd15d); g.fillCircle(b.x,b.y-4,b.r-1);
    g.lineStyle(2,0xfff0ad); g.strokeCircle(b.x,b.y-4,b.r-5);
  }
  const [tx,ty]=level.start,[gx,gy]=level.goal;
  g.lineStyle(2,0xffffff,.4); g.lineBetween(tx-15,ty+15,tx+15,ty+15);
  g.fillStyle(0x143d2b); g.fillCircle(gx,gy,16);
  g.lineStyle(2,0xdaf4ce); g.strokeCircle(gx,gy,17);
  g.lineStyle(3,0xfafffa); g.lineBetween(gx,gy,gx,gy-43);
  g.fillStyle(0xe86459); g.fillTriangle(gx,gy-43,gx+27,gy-34,gx,gy-25);
  if (aim) {
    const {dx,dy}=pullVector(aim.start,aim.end),n=Math.hypot(dx,dy);
    const points=predict(state,level,dx,dy);
    points.slice(0,20).forEach(([x,y],i)=>{
      g.fillStyle(0xffffff,.9-i*.03); g.fillCircle(x,y,i<3?3:2);
    });
    if(n>0) {
      const length=Math.min(n,190),ex=state.x-dx/n*length,ey=state.y-dy/n*length;
      g.lineStyle(5,0x285849,.5); g.lineBetween(state.x,state.y,ex,ey);
      g.lineStyle(3,n>160?0xffab5e:0xffe69c); g.lineBetween(state.x,state.y,ex,ey);
      g.fillStyle(0xfff0b9); g.fillCircle(ex,ey,6);
      g.lineStyle(4,0x46655b); g.lineBetween(ex-dy/n*12,ey+dx/n*12,ex+dy/n*12,ey-dx/n*12);
    }
  }
  if(!state.won) {
    if(!state.moving&&!aim) {
      g.lineStyle(2,player===1?0xffba91:0xffffff,.7);
      g.strokeCircle(state.x,state.y,19+(reduced?0:Math.sin(time*.004)));
    }
    g.fillStyle(0x163b29,.25); g.fillEllipse(state.x+3,state.y+7,24,13);
    g.fillStyle(player===1?0xffc28a:0xdde8e2); g.fillCircle(state.x,state.y,10);
    g.fillStyle(player===1?0xffe5c5:0xffffff); g.fillCircle(state.x-1,state.y-2,9);
    for(const [x,y] of [[-4,-3],[3,-4],[0,3]]){g.fillStyle(0x9bb0a1,.5);g.fillCircle(state.x+x,state.y+y,1);}
  }
  for(const p of particles){g.fillStyle(p.color,Math.min(1,p.life));g.fillRect(p.x,p.y,4,4);}
}
