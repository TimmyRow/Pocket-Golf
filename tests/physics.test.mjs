import {test} from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {levels} from '../src/levels.js';
import {createState,shoot,step,predict,pullVector,R,BOUNDS} from '../src/physics.js';
import {courseView} from '../src/render.js';
test('36 unique holes preserve the original 18 saved-score identities',()=>{
  assert.equal(levels.length,36);
  assert.equal(new Set(levels.map(l=>l.name)).size,36);
  assert.equal(new Set(levels.map(({tiles,start,goal,bumpers,hazards})=>JSON.stringify({tiles,start,goal,bumpers,hazards}))).size,36);
  const originals=levels.slice(0,18).map(({themeIndex,...level})=>level);
  assert.equal(createHash('sha256').update(JSON.stringify(originals)).digest('hex'),'a70be1a833485552b044e4883aaca5e50a9e47f2f162d5c09d69015e7ea04f06');
  assert.deepEqual([0,1,2].map(t=>levels.filter(l=>l.themeIndex===t).length),[12,12,12]);
});
function settle(s,l){for(let i=0;i<1500&&s.moving;i++)step(s,l);assert.equal(s.moving,false);}
test('shots stop, cannot be repeated in motion, and never escape the table',()=>{for(let a=0;a<Math.PI*2;a+=.15){const s=createState(levels[0]);assert.ok(shoot(s,190*Math.cos(a),190*Math.sin(a)));assert.equal(shoot(s,100,0),false);settle(s,levels[0]);assert.ok(s.x>=BOUNDS.left+R&&s.x<=BOUNDS.right-R);assert.ok(s.y>=BOUNDS.top+R&&s.y<=BOUNDS.bottom-R);assert.equal(s.shots,1);}});
test('prediction does not mutate the game',()=>{const s=createState(levels[2]),before=JSON.stringify(s);assert.ok(predict(s,levels[2],100,-100).length);assert.equal(JSON.stringify(s),before);});
test('cup is open from the first stroke and fast putts roll over it',()=>{const l=levels[0],s=createState(l);s.x=l.goal[0];s.y=l.goal[1]+30;shoot(s,0,-20);settle(s,l);assert.equal(s.won,true);const fast=createState(l);fast.x=l.goal[0];fast.y=l.goal[1]+20;shoot(fast,0,-190);step(fast,l);step(fast,l);assert.equal(fast.won,false);});
test('water returns the ball to its previous lie without losing the stroke',()=>{const l=levels[9],s=createState(l);s.x=300;s.y=320;shoot(s,0,-40);settle(s,l);assert.equal(s.fallen,true);assert.equal(s.x,300);assert.equal(s.y,320);assert.equal(s.shots,1);});
function clear(x,y,l){if(!l.tiles.some(t=>x>=t.x&&x<=t.x+t.w&&y>=t.y&&y<=t.y+t.h))return false;for(const w of l.walls){const cx=Math.max(w.x,Math.min(w.x+w.w,x)),cy=Math.max(w.y,Math.min(w.y+w.h,y));if(Math.hypot(x-cx,y-cy)<R+5)return false;}for(const b of [...l.bumpers,...l.hazards])if(Math.hypot(x-b.x,y-b.y)<b.r+R+6)return false;return true;}
function segment(a,b,l){const d=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<=d;t+=3){const f=d?t/d:0;if(!clear(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,l))return false;}return clear(...b,l);}
function route(start,goal,l){const nodes=[start,goal];for(let y=60;y<=590;y+=20)for(let x=60;x<=540;x+=20)if(clear(x,y,l))nodes.push([x,y]);const distances=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),open=new Set(nodes.map((_,i)=>i));distances[0]=0;while(open.size){let n=-1;for(const i of open)if(n<0||distances[i]<distances[n])n=i;if(n<0||!Number.isFinite(distances[n]))break;open.delete(n);if(n===1){const path=[];for(let p=1;p!==0;p=previous[p])path.unshift(nodes[p]);return path;}for(const j of open){const d=Math.hypot(nodes[j][0]-nodes[n][0],nodes[j][1]-nodes[n][1]);if(d>100&&j!==1&&n!==0)continue;if(distances[n]+d<distances[j]&&segment(nodes[n],nodes[j],l)){distances[j]=distances[n]+d;previous[j]=n;}}}throw new Error(l.name+': no route to '+goal);}
test('all 36 golf holes can be completed with actual physics',()=>{for(const l of levels){const s=createState(l);for(const target of [l.goal]){const path=route([s.x,s.y],target,l);for(const point of path){const dx=point[0]-s.x,dy=point[1]-s.y,d=Math.hypot(dx,dy);if(d<5)continue;const drag=Math.exp(-1.55/120),speed=d*(1-drag)*120/drag+13;shoot(s,dx/d*speed/4.4,dy/d*speed/4.4);settle(s,l);assert.equal(s.fallen,false,l.name+' fell');}}assert.equal(s.won,true,l.name+' must be completable');}});
test('pull-back gesture launches opposite the pointer and supports off-center grabs',()=>{assert.deepEqual(pullVector({x:100,y:200},{x:120,y:260}),{dx:-20,dy:-60});});
test('tiny putts do not count and sunk balls cannot be struck again',()=>{const s=createState(levels[0]);assert.equal(shoot(s,0,4),false);assert.equal(s.shots,0);s.won=true;assert.equal(shoot(s,50,20),false);});

test('full-power putts cannot escape any shaped fairway',()=>{
  for(const l of levels) for(let angle=0;angle<Math.PI*2;angle+=.2){
    const s=createState(l);shoot(s,Math.cos(angle)*190,Math.sin(angle)*190);
    for(let i=0;i<1500&&s.moving;i++){
      step(s,l);
      assert.ok(l.tiles.some(t=>s.x>=t.x&&s.x<=t.x+t.w&&s.y>=t.y&&s.y<=t.y+t.h),l.name+' escaped a rail');
    }
    assert.equal(s.moving,false,l.name+' failed to settle');
  }
});
test('every fairway fits the phone, tablet and desktop course view',()=>{
  for(const l of levels)for(const [w,h] of [[390,662],[674,338],[720,568],[720,700]]){
    const v=courseView(l,w,h);
    for(const tile of l.tiles){
      assert.ok(v.x+tile.x*v.scale>=0);
      assert.ok(v.y+(tile.y-12)*v.scale>=0);
      assert.ok(v.x+(tile.x+tile.w)*v.scale<=w);
      assert.ok(v.y+(tile.y+tile.h+16)*v.scale<=h);
    }
  }
});
