import Phaser from 'phaser';
import './style.css';
import {levels} from './levels.js';
import {createState,shoot,step,pullVector} from './physics.js';
import {drawCourse,courseView} from './render.js';
import {initPlatform,loadingFinished,gameplay,commercial} from './platform.js';

const $=id=>document.getElementById(id);
const SAVE_KEY='pocket-putt-golf-v1';
let saved={};
try {
  const data=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
  if(data&&typeof data==='object'&&!Array.isArray(data))
    for(let i=0;i<levels.length;i++) if(Number.isSafeInteger(data[i])&&data[i]>0) saved[i]=data[i];
} catch {}
let index=0,state=createState(levels[0]),mode='title',aim=null,particles=[],accumulator=0;
let audio=null,sound=false,ad=false,ready=false,hasPlayed=false,interrupted=false;
let playerCount=1,player=0,firstScore=null,matchScores={};
let view={x:0,y:0,scale:1,width:600,height:650};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

function tone(f=440,d=.08) {
  if(!sound||ad)return;
  try {
    audio??=new AudioContext(); audio.resume();
    const o=audio.createOscillator(),g=audio.createGain();
    o.frequency.setValueAtTime(f,audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(f*.65,audio.currentTime+d);
    g.gain.setValueAtTime(.07,audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);
    o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);
  } catch {}
}
function burst() {
  if(reduced)return;
  for(let i=0;i<36;i++){
    const a=i*Math.PI/18;
    particles.push({x:state.x,y:state.y,vx:Math.cos(a)*(50+Math.random()*100),vy:Math.sin(a)*(50+Math.random()*100),life:1,color:i%2?0xffd15d:0xffffff});
  }
}
function hud() {
  const l=levels[index];
  $('roomNo').textContent=String(index+1).padStart(2,'0');
  $('roomName').textContent=l.name;
  $('shots').textContent=state.shots;
  $('par').textContent=l.par;
  $('bestLabel').textContent=playerCount===2?'PLAYER':'BEST';
  $('best').textContent=playerCount===2?player+1:saved[index]??'—';
  $('turn').textContent=playerCount===2?'Player '+(player+1):'Solo';
  const totals=Object.values(matchScores).reduce((s,v)=>[s[0]+v[0],s[1]+v[1]],[0,0]);
  $('progress').textContent=playerCount===2?'P1 '+totals[0]+' · P2 '+totals[1]:Object.keys(saved).length+' / 18 completed';
  const power=aim?Math.min(100,Math.round(Math.hypot(aim.start.x-aim.end.x,aim.start.y-aim.end.y)/190*100)):0;
  $('power').value=power;
  $('hint').textContent=aim?'Power '+power+'%':state.moving?'Rolling…':state.won?'In the cup':state.fallen?'Back at your last lie':'Your putt';
}
function show(html,nextMode) {
  audio?.suspend().catch(()=>{});mode=nextMode;aim=null;gameplay(false);
  $('overlay').innerHTML='<div class="card">'+html+'</div>';
  $('overlay').classList.remove('hidden');
  hud();
}
function hide() {
  if(ad||!ready)return;
  if(document.hidden){pauseScreen();return;}
  hasPlayed=true;mode='play';$('overlay').classList.add('hidden');
  $('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');
  gameplay(true);if(sound)audio?.resume().catch(()=>{});hud();
}
async function enterGame(reset) {
  if(ad||!ready)return;
  aim=null;gameplay(false);ad=true;interrupted=false;audio?.suspend().catch(()=>{});
  document.querySelectorAll('button').forEach(b=>b.disabled=true);
  try {if(hasPlayed)await commercial();if(reset)reset();}
  finally {ad=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}
  if(document.hidden||interrupted){pauseScreen();return;}
  hide();
}
async function loadRoom(n) {
  if(!Number.isInteger(n)||n<0||n>=levels.length)return;
  await enterGame(()=>{
    index=n;state=createState(levels[n]);player=0;firstScore=null;
    aim=null;particles=[];accumulator=0;delete matchScores[n];
  });
}
function resume(){return enterGame();}
function pause(){if(ad){interrupted=true;return;}if(mode==='play')pauseScreen();}
function pauseScreen(){
  show('<span class="eyebrow">PAUSED</span><h2>Take your time.</h2><button id="resume" class="primary">Resume</button><button id="room-menu" class="secondary">Choose a hole</button><button id="new-game" class="secondary">New game</button>','pause');
  $('resume').onclick=resume;$('room-menu').onclick=roomMenu;$('new-game').onclick=title;
  $('pause').textContent='▶';$('pause').setAttribute('aria-label','Resume game');
}
function title(){
  show('<span class="eyebrow">MINI GOLF</span><h2>Pocket Putt</h2><div class="player-options" role="group" aria-label="Number of players"><button id="solo" aria-pressed="'+(playerCount===1)+'">Solo</button><button id="duo" aria-pressed="'+(playerCount===2)+'">2 players</button></div><p class="mode-label">'+(playerCount===2?'Pass & play · Same device':'18 holes · Personal bests')+'</p><button id="primary" class="primary">Tee off</button>','title');
  const select=n=>{playerCount=n;title();};
  $('solo').onclick=()=>select(1);$('duo').onclick=()=>select(2);
  $('primary').onclick=()=>{matchScores={};loadRoom(0);};
  document.querySelectorAll('button').forEach(b=>b.disabled=!ready);
}
function roomMenu(){
  if(ad||!ready)return;
  const previous=mode;
  show('<span class="eyebrow">THE COURSE</span><h2>Choose a hole.</h2><div class="room-grid">'+levels.map((l,i)=>'<button data-room="'+i+'" class="'+(saved[i]?'done ':'')+(i===index?'current':'')+'" aria-label="Hole '+(i+1)+': '+l.name+(saved[i]?', best '+saved[i]+' strokes':'')+'">'+String(i+1).padStart(2,'0')+'</button>').join('')+'</div><button id="back" class="secondary">Back</button>','rooms');
  document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>loadRoom(Number(b.dataset.room)));
  $('back').onclick=()=>previous==='title'?title():state.won?resultScreen():resume();
}
function scoreName(){
  const d=state.shots-levels[index].par;
  return state.shots===1?'Hole in one!':d<=-2?'Eagle!':d===-1?'Birdie!':d===0?'Par.':d===1?'Bogey.':'In the cup.';
}
function finish(){
  if(playerCount===1){
    if(!saved[index]||state.shots<saved[index])saved[index]=state.shots;
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(saved));}catch{}
  } else if(player===0) firstScore=state.shots;
  else matchScores[index]=[firstScore,state.shots];
  burst();tone(900,.24);hud();resultScreen();
}
function resultScreen(){
  if(playerCount===2&&player===0){
    show('<span class="eyebrow">PLAYER 1 · '+state.shots+' STROKES</span><h2>Player 2, you’re up.</h2><button id="handoff" class="primary">Player 2: tee off</button>','handoff');
    $('handoff').onclick=()=>enterGame(()=>{player=1;state=createState(levels[index]);accumulator=0;particles=[];});
    return;
  }
  const last=index===levels.length-1;
  const outcome=playerCount===1?scoreName():firstScore===state.shots?'A tie!':firstScore<state.shots?'Player 1 wins!':'Player 2 wins!';
  const summary=playerCount===1?state.shots+' strokes · Par '+levels[index].par+' · Best '+saved[index]:'Player 1: '+firstScore+' · Player 2: '+state.shots;
  show('<span class="eyebrow">HOLE '+(index+1)+' COMPLETE</span><h2>'+outcome+'</h2><p class="result-summary">'+summary+'</p><button id="next" class="primary">'+(last?'Scorecard':'Next hole')+'</button><button id="again" class="secondary">↻ Replay hole</button>','win');
  $('next').onclick=()=>last?roomMenu():loadRoom(index+1);
  $('again').onclick=()=>loadRoom(index);
}
$('retry').onclick=()=>{if(mode==='play'||mode==='pause')loadRoom(index);};
$('rooms').onclick=roomMenu;
$('pause').onclick=()=>mode==='pause'?resume():pause();
$('sound').onclick=()=>{
  if(ad)return;sound=!sound;$('sound').textContent=sound?'♪':'♫';
  $('sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');
  $('sound').setAttribute('aria-pressed',String(sound));
  if(sound)tone(660);else audio?.suspend().catch(()=>{});
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('blur',()=>pause());
window.addEventListener('keydown',e=>{
  if(ad)return;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)||(e.key===' '&&mode==='play'))e.preventDefault();
  if(e.key==='Escape'){if(aim){aim=null;hud();}else if(mode==='pause')resume();else pause();}
  if(e.key.toLowerCase()==='r'&&mode==='play')loadRoom(index);
});
window.addEventListener('wheel',e=>{
  if(ad)return;
  const card=e.target.closest?.('.card');
  const canScroll=card&&(e.deltaY<0?card.scrollTop>0:card.scrollTop+card.clientHeight<card.scrollHeight);
  if(!canScroll)e.preventDefault();
},{passive:false});
class Course extends Phaser.Scene {
  create(){
    this.g=this.add.graphics();ready=true;
    const canvas=this.game.canvas;
    const point=e=>{const r=canvas.getBoundingClientRect();return {x:((e.clientX-r.left)*view.width/r.width-view.x)/view.scale,y:((e.clientY-r.top)*view.height/r.height-view.y)/view.scale};};
    const cancel=()=>{aim=null;hud();};
    canvas.addEventListener('pointerdown',e=>{
      if(mode!=='play'||state.moving||ad||aim||e.button!==0)return;
      const p=point(e);
      if(Math.hypot(p.x-state.x,p.y-state.y)>55)return;
      e.preventDefault();canvas.setPointerCapture(e.pointerId);
      aim={id:e.pointerId,start:p,end:p};hud();
    });
    canvas.addEventListener('pointermove',e=>{if(aim?.id===e.pointerId){aim.end=point(e);hud();}});
    canvas.addEventListener('pointerup',e=>{
      if(aim?.id!==e.pointerId)return;
      const {dx,dy}=pullVector(aim.start,point(e));aim=null;
      if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
      if(mode==='play'&&!ad&&shoot(state,dx,dy))tone(260);
      hud();
    });
    canvas.addEventListener('pointercancel',cancel);
    canvas.addEventListener('lostpointercapture',cancel);
    window.addEventListener('resize',cancel);
    // CSS grid can resize the parent before Phaser's periodic scale check runs.
    const resize=new ResizeObserver(()=>{
      const r=canvas.parentElement.getBoundingClientRect();
      if(r.width>0&&r.height>0){
        cancel();this.scale.resize(Math.floor(r.width),Math.floor(r.height));
        view=courseView(levels[index],this.scale.width,this.scale.height);
        this.g.setPosition(view.x,view.y).setScale(view.scale);
      }
    });
    resize.observe(canvas.parentElement);
    this.events.once('shutdown',()=>resize.disconnect());
    canvas.setAttribute('aria-label','Mini golf course. Drag backward from the ball and release to putt. Pull farther for more power.');
    canvas.setAttribute('role','img');
    loadingFinished();title();
  }
  update(time,delta){
    const dt=Math.min(delta/1000,.05);
    if(mode==='play'&&!ad){
      accumulator+=dt;
      while(accumulator>=1/120){
        const events=step(state,levels[index]);accumulator-=1/120;
        for(const e of events){
          if(e==='bounce'||e==='bumper')tone(190,.035);
          if(e==='fall')tone(100,.18);
          if(e==='win'){finish();break;}
          if(e==='rest'||e==='fall')hud();
        }
        if(mode!=='play')break;
      }
    }
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
    particles=particles.filter(p=>p.life>0);
    view=courseView(levels[index],this.scale.width,this.scale.height);
    this.g.setPosition(view.x,view.y).setScale(view.scale);
    drawCourse(this.g,levels[index],state,aim,particles,time,reduced,player);
  }
}
title();
initPlatform().then(()=>new Phaser.Game({
  type:Phaser.AUTO,parent:'canvas',width:600,height:650,backgroundColor:'#93c8dc',banner:false,
  scale:{mode:Phaser.Scale.RESIZE},
  scene:Course,render:{antialias:true},audio:{noAudio:true}
}));
// Web automation is excluded entirely from the Poki distribution.
if(import.meta.env.VITE_POKI!=='true'){
const context=document.modelContext;
if(context?.registerTool)try{
  context.registerTool({name:'get_bankshot_room',description:'Read golf hole, strokes, player, and ball state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},
    execute:()=>({room:index+1,name:levels[index].name,shots:state.shots,mode,moving:state.moving,puck:{x:state.x,y:state.y},adPending:ad,aiming:!!aim,player:player+1,players:playerCount,firstScore,matchScores,view})});
  context.registerTool({name:'start_bankshot_room',description:'Start a mini golf hole from 1 to 18.',inputSchema:{type:'object',properties:{room:{type:'integer',minimum:1,maximum:18}},required:['room'],additionalProperties:false},
    execute:async input=>{if(!Number.isInteger(input.room)||input.room<1||input.room>18)throw new Error('Choose a hole from 1 to 18.');if(ad)throw new Error('Wait for the transition.');await loadRoom(input.room-1);return {room:index+1,mode};}});
}catch{}
}
