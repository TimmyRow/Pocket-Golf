import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {courseView} from '../src/render.js';
import {levels} from '../src/levels.js';

const root=resolve('poki-dist'),report=[];
await mkdir('qa',{recursive:true});
const html=await readFile(resolve(root,'index.html'),'utf8');
assert.match(html,/https:\/\/game-cdn.poki.com\/scripts\/v2\/poki-sdk.js/);
for(const file of await readdir(resolve(root,'assets'))){
  assert.ok(!file.endsWith('.map'),'Source maps must not ship');
  if(file.endsWith('.js')){
    const code=await readFile(resolve(root,'assets',file),'utf8');
    assert.ok(!code.includes('get_bankshot_room'),'Automation hooks must not ship');
    assert.ok(!code.includes('start_bankshot_room'),'Automation controls must not ship');
  }
}
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://local').pathname);
    if(path==='/frame.html'){
      res.setHeader('content-type','text/html');
      return res.end('<body style="margin:0;height:3000px"><div style="height:100px"></div><iframe title="Golf" src="/" style="border:0;width:640px;height:360px"></iframe></body>');
    }
    const file=resolve(root,'.'+(path==='/'?'/index.html':path));
    if(!file.startsWith(root+sep)){res.writeHead(403);return res.end();}
    res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)]||'application/octet-stream');
    res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
async function setup(engine=chromium,viewport={width:640,height:360},options={}){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport,hasTouch:true});
  await context.addInitScript(({blockedStorage})=>{
    window.testTools={};Object.defineProperty(document,'modelContext',{value:{registerTool(t){testTools[t.name]=t;}}});
    if(blockedStorage){Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')};}
  },options);
  const page=await context.newPage();page.errors=[];page.external=[];
  page.on('pageerror',e=>page.errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(origin)&&r.url()!=='https://game-cdn.poki.com/scripts/v2/poki-sdk.js')page.external.push(r.url());});
  await page.route('**/poki-sdk.js',route=>options.blockSDK?route.abort():route.fulfill({contentType:'text/javascript',body:`
    window.sdkEvents=[];window.holdAd=false;
    window.PokiSDK={init(){sdkEvents.push('init');return Promise.resolve()},gameLoadingFinished(){sdkEvents.push('loaded')},gameplayStart(){sdkEvents.push('start')},gameplayStop(){sdkEvents.push('stop')},commercialBreak(){sdkEvents.push('ad');return new Promise(resolve=>{window.finishAd=resolve;if(!holdAd)resolve()})}};`}));
  await page.goto(origin+(options.frame?'/frame.html':'/'));
  return {browser,page};
}
async function putt(page){
  const box=await page.locator('canvas').boundingBox(),v=courseView(levels[0],Math.floor(box.width),Math.floor(box.height));
  const x=box.x+v.x+264*v.scale,y=box.y+v.y+469*v.scale,decay=Math.exp(-1.55/120),pull=(288*(1-decay)*120/decay+13)/4.4;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+pull*v.scale,{steps:5});await page.mouse.up();
}
async function check(name,fn){try{await fn();report.push({name,result:'PASS'});console.log('PASS',name);}catch(e){report.push({name,result:'FAIL',error:e.stack});console.log('FAIL',name,e.message);}}
try{
  for(const [w,h,engine] of [[640,360,chromium],[836,470,chromium],[1031,580,chromium],[320,568,webkit],[375,667,webkit],[1024,768,webkit],[1366,1024,chromium]]){
    await check('Poki distribution '+w+'x'+h,async()=>{
      const {browser,page}=await setup(engine,{width:w,height:h});try{
        await page.locator('#primary:enabled').click();await page.waitForTimeout(100);
        assert.deepEqual(await page.evaluate(()=>Object.keys(testTools)),[]);
        const fits=await page.evaluate(()=>{
          const a=document.querySelector('#app').getBoundingClientRect(),c=document.querySelector('canvas').getBoundingClientRect();
          return a.width===innerWidth&&c.right<=innerWidth+1&&c.bottom<=innerHeight+1&&document.body.scrollWidth<=innerWidth+1;
        });assert.ok(fits,'Game must fill viewport without overflow');
        await page.screenshot({path:'qa/poki-'+w+'x'+h+'.png'});
        await putt(page);await page.locator('#next').waitFor();
        assert.equal(await page.locator('#shots').innerText(),'1');
        assert.deepEqual(await page.evaluate(()=>sdkEvents),['init','loaded','start','stop']);
        await page.evaluate(()=>holdAd=true);await page.locator('#next').click();
        await page.waitForFunction(()=>window.finishAd);
        const events=await page.evaluate(()=>[...sdkEvents]);
        await page.keyboard.press('r');await page.keyboard.press('Escape');
        await page.locator('#rooms').dispatchEvent('click');
        assert.deepEqual(await page.evaluate(()=>sdkEvents),events);
        assert.equal(await page.locator('#roomNo').innerText(),'01');
        await page.evaluate(()=>finishAd());await page.waitForFunction(()=>document.querySelector('#roomNo').textContent==='02');
        assert.equal(await page.locator('#shots').innerText(),'0');
        assert.deepEqual(await page.evaluate(()=>sdkEvents),['init','loaded','start','stop','ad','start']);
        assert.deepEqual(page.errors,[]);assert.deepEqual(page.external,[]);
      }finally{await browser.close();}
    });
  }
  await check('Poki ZIP remains playable with blocked SDK and storage',async()=>{
    const {browser,page}=await setup(chromium,{width:390,height:844},{blockSDK:true,blockedStorage:true});
    try{await page.locator('#primary:enabled').click();await putt(page);await page.locator('#next').waitFor();assert.deepEqual(page.errors,[]);}
    finally{await browser.close();}
  });
  await check('Poki iframe does not scroll its parent',async()=>{
    const {browser,page}=await setup(chromium,{width:900,height:800},{frame:true});
    try{
      const frame=page.frameLocator('iframe');await frame.locator('#primary:enabled').click();
      const box=await frame.locator('canvas').boundingBox();
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,500);await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');
      await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>scrollY),0);
      await frame.locator('#pause').click();await page.mouse.wheel(0,500);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>scrollY),0);
      assert.deepEqual(page.errors,[]);
    }finally{await browser.close();}
  });
  await check('Poki two-player handoff is ad-safe',async()=>{
    const {browser,page}=await setup(chromium,{width:390,height:844});try{
      await page.locator('#duo:enabled').click();await page.locator('#primary').click();await putt(page);await page.locator('#handoff').waitFor();
      await page.evaluate(()=>holdAd=true);await page.locator('#handoff').click();await page.waitForFunction(()=>window.finishAd);
      assert.equal(await page.locator('#best').innerText(),'1');assert.equal(await page.locator('#handoff').isDisabled(),true);
      await page.evaluate(()=>finishAd());await page.waitForFunction(()=>document.querySelector('#best').textContent==='2');
      assert.equal(await page.locator('#shots').innerText(),'0');
      assert.deepEqual(await page.evaluate(()=>sdkEvents),['init','loaded','start','stop','ad','start']);assert.deepEqual(page.errors,[]);
    }finally{await browser.close();}
  });
}finally{await new Promise(done=>server.close(done));}
await writeFile('qa/poki-results.json',JSON.stringify(report,null,2));
if(report.some(r=>r.result==='FAIL'))process.exitCode=1;
