import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const url=process.env.QA_URL||'http://127.0.0.1:5188/';
const cases=[
  ['small-iphone',webkit,320,568,true],
  ['small-iphone-landscape',webkit,568,320,true],
  ['iphone-large',webkit,430,932,true],
  ['android',chromium,360,800,true],
  ['android-landscape',chromium,800,360,true],
  ['ipad-split',webkit,507,768,true],
  ['ipad',webkit,768,1024,true],
  ['ipad-landscape',webkit,1024,768,true],
  ['ipad-pro',webkit,1366,1024,true],
  ['laptop-chrome',chromium,1366,768,false],
  ['desktop-firefox',firefox,1440,900,false],
  ['small-firefox',firefox,360,640,false],
  ['desktop-webkit',webkit,1440,900,false],
  ['desktop-zoom',chromium,640,450,false],
];
await fs.mkdir('qa',{recursive:true});
const report=[];
for(const [name,engine,width,height,touch] of cases){
  let browser;
  try{
    browser=await engine.launch({headless:true});
    const context=await browser.newContext({viewport:{width,height},hasTouch:touch,
      ...(engine!==firefox?{isMobile:touch,deviceScaleFactor:touch?2:1}:{}),
      reducedMotion:name==='desktop-zoom'?'reduce':'no-preference'});
    await context.addInitScript(()=>{
      window.testTools={};
      Object.defineProperty(document,'modelContext',{value:{registerTool(t){testTools[t.name]=t;}}});
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    await page.locator('#primary:enabled').waitFor();
    await page.locator('#primary').click();
    const read=()=>page.evaluate(()=>testTools.get_bankshot_room.execute({}));
    const geometry=async()=>{
      const result=await page.evaluate(()=>{
        const board=document.querySelector('#board').getBoundingClientRect();
        const canvas=document.querySelector('canvas').getBoundingClientRect();
        const footer=document.querySelector('footer').getBoundingClientRect();
        const hud=document.querySelector('.hud').getBoundingClientRect();
        const clipped=[...document.querySelectorAll('.hud strong,.hud small,footer button')].some(el=>{
          const r=el.getBoundingClientRect(),parent=el.closest('footer')?footer:hud;
          return r.left<parent.left-1||r.right>parent.right+1||r.top<parent.top-1||r.bottom>parent.bottom+1;
        });
        return {clipped,right:Math.max(board.right,footer.right),bottom:Math.max(board.bottom,footer.bottom),canvasBottom:canvas.bottom,boardBottom:board.bottom,w:innerWidth,h:innerHeight,bodyWidth:document.body.scrollWidth};
      });
      assert.equal(result.clipped,false,JSON.stringify(result));
      assert.ok(result.right<=result.w+1&&result.bottom<=result.h+1,JSON.stringify(result));
      assert.ok(result.canvasBottom<=result.boardBottom+1,JSON.stringify(result));
      assert.ok(result.bodyWidth<=result.w+1,JSON.stringify(result));
    };
    await page.waitForTimeout(120);await geometry();
    const s=await read(),box=await page.locator('canvas').boundingBox(),v=s.view;
    const x=box.x+(v.x+s.puck.x*v.scale)/v.width*box.width,y=box.y+(v.y+s.puck.y*v.scale)/v.height*box.height;
    const distance=469-181,decay=Math.exp(-1.55/120),pull=(distance*(1-decay)*120/decay+13)/4.4;
    const ey=y+pull*v.scale/v.height*box.height;
    if(touch&&engine===chromium){
      const cdp=await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:ey}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
    }else{
      await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,ey,{steps:6});await page.mouse.up();
    }
    await page.waitForFunction(()=>testTools.get_bankshot_room.execute({}).mode==='win');
    assert.equal((await read()).shots,1);
    await page.locator('#next').click();
    await page.waitForTimeout(100);await geometry();
    await page.screenshot({path:'qa/device-'+name+'.png'});
    await page.setViewportSize({width:height,height:width});await page.waitForTimeout(220);await geometry();
    await page.locator('#rooms').click();
    await page.locator('[data-room="17"]').click();
    await page.waitForTimeout(100);await geometry();
    await page.locator('#pause').click();await page.locator('#resume').click();
    assert.equal((await read()).mode,'play');assert.deepEqual(errors,[]);
    report.push({name,result:'PASS',input:touch&&engine===chromium?'touch':'mouse/pointer'});
    console.log('PASS',name);
  }catch(e){report.push({name,result:'FAIL',error:e.stack});console.log('FAIL',name,e.message);}
  finally{await browser?.close();}
}
await fs.writeFile('qa/device-results.json',JSON.stringify(report,null,2));
if(report.some(r=>r.result==='FAIL'))process.exitCode=1;
