import {predict, pullVector} from './physics.js';
import {themes} from './themes.js';

export function courseView(level,width,height) {
  const left=Math.min(...level.tiles.map(t=>t.x))-16,top=Math.min(...level.tiles.map(t=>t.y))-24;
  const right=Math.max(...level.tiles.map(t=>t.x+t.w))+16,bottom=Math.max(...level.tiles.map(t=>t.y+t.h))+32;
  const scale=Math.min((width-40)/(right-left),(height-40)/(bottom-top));
  return {width,height,scale,x:(width-(right-left)*scale)/2-left*scale,y:(height-(bottom-top)*scale)/2-top*scale};
}

export function drawWater(g,width,height,theme,time,reduced){
  g.clear();g.fillStyle(theme.water);g.fillRect(0,0,width,height);
  const drift=reduced?0:Math.sin(time*.00035)*5;
  g.lineStyle(1,theme.ripple,.18);
  for(let row=0,y=25;y<height;y+=52,row++)for(let x=-20+(row%2)*47;x<width;x+=94){
    g.beginPath();
    for(let i=0;i<=40;i+=4){const yy=y+Math.sin(i*.12+row)*2;if(i===0)g.moveTo(x+i+drift,yy);else g.lineTo(x+i+drift,yy);}
    g.strokePath();
  }
  // Shore plants stay at the edges, outside the course camera's playfield.
  for(const [x,y,flip] of [[12,height*.24,1],[width-12,height*.74,-1]]){
    g.fillStyle(theme.ripple,.18);g.fillEllipse(x,y+15,50,14);
    g.lineStyle(3,theme.leaf,.55);
    g.lineBetween(x,y+14,x+flip*8,y-15);g.lineBetween(x,y+14,x+flip*20,y-4);
    g.lineBetween(x,y+14,x-flip*6,y-9);
    g.fillStyle(theme.leaf,.7);g.fillEllipse(x+flip*13,y-9,13,7);
    g.fillEllipse(x-flip*5,y-4,10,7);
    g.fillStyle(theme.flag,.8);g.fillEllipse(x+flip*8,y-17,6,10);
  }
}

export function drawTerrain(g,level){
  const t=themes[level.themeIndex];g.clear();
  // Layered bases follow the collision footprint exactly; only the shadow extends.
  for(const tile of level.tiles){
    g.fillStyle(0x173e42,.12);g.fillRect(tile.x+10,tile.y+22,tile.w,tile.h);
    g.fillStyle(t.edge);g.fillRect(tile.x-3,tile.y+12,tile.w+6,tile.h+7);
    g.fillStyle(t.railSide);g.fillRect(tile.x-4,tile.y+5,tile.w+8,tile.h+8);
  }
  for(const tile of level.tiles){
    g.fillStyle(t.grass);g.fillRect(tile.x,tile.y,tile.w,tile.h);
    for(let row=0;row<3;row++){
      if((Math.floor(tile.y/24)+row)%2===0){g.fillStyle(t.stripe);g.fillRect(tile.x,tile.y+row*24,tile.w,24);}
    }
    for(let i=0;i<9;i++){
      const x=tile.x+8+(i*23+tile.y)%56,y=tile.y+8+(i*31+tile.x)%56;
      g.lineStyle(1,0xffffff,.11);g.lineBetween(x,y,x+2,y-2);
      g.lineStyle(1,t.edge,.09);g.lineBetween(x+3,y,x+4,y-3);
    }
  }
  for(const w of level.walls){
    g.fillStyle(t.edge,.2);g.fillRect(w.x+3,w.y+5,w.w,w.h+6);
    g.fillStyle(t.railSide);g.fillRect(w.x,w.y,w.w,w.h+7);
    g.fillStyle(t.rail);g.fillRect(w.x,w.y-4,w.w,w.h);
    g.lineStyle(1,0xffffff,.65);g.lineBetween(w.x,w.y-4,w.x+w.w,w.y-4);
    g.lineStyle(1,t.railSide,.6);
    if(w.w>w.h)g.lineBetween(w.x+w.w/2,w.y-4,w.x+w.w/2,w.y+4);
    else g.lineBetween(w.x,w.y+w.h/2,w.x+w.w,w.y+w.h/2);
  }
  for(const h of level.hazards){
    g.fillStyle(t.edge,.35);g.fillCircle(h.x+1,h.y+2,h.r+3);
    g.fillStyle(0x267992);g.fillCircle(h.x,h.y,h.r);
    g.fillStyle(0x389db2);g.fillEllipse(h.x,h.y+3,h.r*1.65,h.r*1.4);
    g.lineStyle(2,0xb7ebdd,.8);g.strokeCircle(h.x,h.y,h.r);
    g.lineStyle(1.5,0xd2f5ec,.55);
    g.lineBetween(h.x-h.r*.5,h.y-5,h.x+h.r*.15,h.y-5);
    g.lineBetween(h.x-h.r*.05,h.y+6,h.x+h.r*.5,h.y+6);
  }
  for(const b of level.bumpers){
    g.fillStyle(t.edge,.3);g.fillCircle(b.x+3,b.y+7,b.r+2);
    g.fillStyle(0xac733a);g.fillCircle(b.x,b.y+3,b.r);
    g.fillStyle(t.bumper);g.fillCircle(b.x,b.y,b.r);
    g.lineStyle(3,0xffefc0);g.strokeCircle(b.x,b.y,b.r-4);
    g.fillStyle(0xffffff,.35);g.fillEllipse(b.x-3,b.y-b.r*.4,b.r,.22*b.r);
  }
  const [tx,ty]=level.start,[gx,gy]=level.goal;
  g.lineStyle(1,0xffffff,.28);g.strokeCircle(tx,ty,16);
  g.fillStyle(t.rail);g.fillRoundedRect(tx-16,ty+17,32,3,1);
  g.fillStyle(t.edge,.32);g.fillEllipse(gx+3,gy+4,40,34);
  g.fillStyle(0x142e30);g.fillCircle(gx,gy,16);
  g.lineStyle(2,t.rail);g.strokeCircle(gx,gy,17);
  g.lineStyle(2,0x061e26,.5);g.beginPath();g.arc(gx,gy,12,Math.PI,Math.PI*2);g.strokePath();
}

export function drawCourse(g,level,state,aim,particles,time,reduced,player,trail=[]){
  const t=themes[level.themeIndex];g.clear();
  const [gx,gy]=level.goal,flutter=reduced?0:Math.sin(time*.0025)*2;
  g.lineStyle(3,0x213e3b,.18);g.lineBetween(gx+2,gy+3,gx+20,gy+9);
  g.lineStyle(3,t.rail);g.lineBetween(gx,gy,gx,gy-43);
  g.fillStyle(t.flag);g.fillTriangle(gx,gy-43,gx+28,gy-34+flutter,gx,gy-24);
  g.fillStyle(0xffffff,.2);g.fillTriangle(gx,gy-43,gx+28,gy-34+flutter,gx+3,gy-35);
  if(!reduced&&state.moving){
    trail.forEach((p,i)=>{g.fillStyle(0xffffff,(i+1)/trail.length*.15);g.fillCircle(p.x,p.y,3+i*.25);});
  }
  if(aim){
    const {dx,dy}=pullVector(aim.start,aim.end),n=Math.hypot(dx,dy);
    predict(state,level,dx,dy).slice(0,22).forEach(([x,y],i)=>{
      g.fillStyle(0x14382d,.18);g.fillCircle(x+1,y+2,3);
      g.fillStyle(0xffffff,.95-i*.03);g.fillCircle(x,y,i<3?3:2);
    });
    if(n>0){
      const length=Math.min(n,190),ex=state.x-dx/n*length,ey=state.y-dy/n*length;
      g.lineStyle(6,0x244641,.4);g.lineBetween(state.x,state.y,ex,ey);
      g.lineStyle(3,n>160?0xffb078:0xffe9a5);g.lineBetween(state.x,state.y,ex,ey);
      g.fillStyle(t.rail);g.fillCircle(ex,ey,5);
      g.lineStyle(5,0x23434b);g.lineBetween(ex-dy/n*12,ey+dx/n*12,ex+dy/n*12,ey-dx/n*12);
      g.lineStyle(2,0xd8e9e7);g.lineBetween(ex-dy/n*10,ey+dx/n*10,ex+dy/n*10,ey-dx/n*10);
    }
  }
  if(!state.won){
    if(!state.moving&&!aim){
      g.lineStyle(1.5,player===1?0xffce91:0xffffff,.65);
      g.strokeCircle(state.x,state.y,20+(reduced?0:Math.sin(time*.0035)*1.5));
    }
    g.fillStyle(0x173f37,.25);g.fillEllipse(state.x+3,state.y+8,25,12);
    g.fillStyle(player===1?0xe7a158:0xbccfc9);g.fillCircle(state.x,state.y,10);
    g.fillStyle(player===1?0xffd7a6:0xf8fffb);g.fillCircle(state.x-1,state.y-2,9);
    g.fillStyle(0xffffff,.9);g.fillEllipse(state.x-3,state.y-5,5,3);
    for(const [x,y] of [[-4,-2],[3,-3],[0,3],[5,2]]){g.fillStyle(0x76948b,.35);g.fillCircle(state.x+x,state.y+y,1);}
  }
  for(const p of particles){g.fillStyle(p.color,Math.min(1,p.life));g.fillRect(p.x,p.y,4,4);}
}
