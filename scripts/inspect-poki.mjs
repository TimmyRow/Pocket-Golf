import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {courseView} from '../src/render.js';
import {levels} from '../src/levels.js';

await mkdir('qa',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto('https://inspector.poki.dev/',{waitUntil:'networkidle'});
  // Inspector's folder picker is normally opened through the browser's native dialog.
  const picker=page.locator('input[type=file]');
  await picker.evaluate(e=>{e.webkitdirectory=true;e.multiple=true;});
  await picker.setInputFiles(resolve('poki-dist'));
  const game=page.frameLocator('iframe').first();
  await game.locator('#primary:enabled').click({timeout:60000});
  await page.waitForTimeout(300);
  const box=await game.locator('canvas').boundingBox(),v=courseView(levels[0],Math.floor(box.width),Math.floor(box.height));
  const x=box.x+v.x+264*v.scale,y=box.y+v.y+469*v.scale,decay=Math.exp(-1.55/120),pull=(288*(1-decay)*120/decay+13)/4.4;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+pull*v.scale,{steps:8});await page.mouse.up();
  await game.locator('#next').waitFor();
  await game.locator('#next').click();
  await game.locator('#roomNo').filter({hasText:'02'}).waitFor({timeout:60000});
  await game.locator('#pause').click();
  for(const title of ['Event Log','Warnings']){
    const summary=page.locator('summary').filter({hasText:title});
    if(await summary.isVisible())await summary.click();
  }
  await page.waitForTimeout(1000);
  const report={url:page.url(),observations:await page.locator('body').innerText()};
  await writeFile('qa/poki-inspector.json',JSON.stringify(report,null,2));
  await page.screenshot({path:'qa/poki-inspector.png',fullPage:true});
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
