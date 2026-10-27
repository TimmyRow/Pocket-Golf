import {chromium} from 'playwright';
import {mkdir,copyFile} from 'node:fs/promises';

await mkdir('release',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1031,height:580},recordVideo:{dir:'qa/video',size:{width:1031,height:580}}});
  await context.addInitScript(()=>{
    window.gameTools={};
    Object.defineProperty(document,'modelContext',{value:{registerTool(t){gameTools[t.name]=t;}}});
  });
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:5188/');
  await page.locator('#primary:enabled').click();
  await page.waitForTimeout(600);
  const state=await page.evaluate(()=>gameTools.get_bankshot_room.execute({}));
  const box=await page.locator('canvas').boundingBox(),v=state.view;
  const x=box.x+v.x+state.puck.x*v.scale,y=box.y+v.y+state.puck.y*v.scale;
  const decay=Math.exp(-1.55/120),pull=(288*(1-decay)*120/decay+13)/4.4;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x,y+pull*v.scale,{steps:35});await page.waitForTimeout(500);await page.mouse.up();
  await page.locator('#next').waitFor();await page.waitForTimeout(800);
  await page.locator('#next').click();await page.waitForTimeout(1200);
  await page.evaluate(()=>gameTools.start_bankshot_room.execute({room:10}));
  await page.waitForTimeout(300);
  await page.screenshot({path:'release/Pocket-Putt-gameplay.png'});
  await page.waitForTimeout(1500);
  const video=page.video();await context.close();
  await copyFile(await video.path(),'release/Pocket-Putt-gameplay.webm');

  const art=await browser.newPage({viewport:{width:800,height:800}});
  await art.addInitScript(()=>{
    window.gameTools={};Object.defineProperty(document,'modelContext',{value:{registerTool(t){gameTools[t.name]=t;}}});
  });
  await art.goto('http://127.0.0.1:5188/');await art.locator('#primary:enabled').click();
  await art.evaluate(()=>gameTools.start_bankshot_room.execute({room:10}));
  // Capture the game's real renderer, without HUD text, as a square thumbnail.
  await art.addStyleTag({content:'header,.hud,footer{display:none!important}#app{width:100%;height:100dvh;max-height:none;display:block}#board{width:100%;height:100%}'});
  await art.setViewportSize({width:801,height:801});
  await art.setViewportSize({width:800,height:800});
  await art.waitForFunction(()=>{const c=document.querySelector('canvas');return c.width===800&&c.height===800;});
  await art.locator('canvas').screenshot({path:'release/Pocket-Putt-thumbnail.png'});
}finally{await browser.close();}
console.log('Submission media saved in release/');
