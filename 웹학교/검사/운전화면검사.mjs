import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import('/tmp/school-browser/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/tmp/school-browser/browsers/chromium-1243/chrome-linux64/chrome',args:['--enable-unsafe-swiftshader']});
const output=new URL('../../output/driving/',import.meta.url);await fs.mkdir(output,{recursive:true});
const report={checks:[],errors:[]};
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:700}:{width:1100,height:760},isMobile:mobile,hasTouch:true,deviceScaleFactor:.5});
  const page=await context.newPage();page.setDefaultTimeout(180000);page.on('pageerror',e=>report.errors.push(e.message));
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>setTimeout(()=>raf(cb),200);});
  await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready);
  await page.locator('#시작').click({force:true});await page.waitForFunction(()=>!document.getElementById('캐릭터확인').disabled);await page.locator('#캐릭터확인').click({force:true});await page.locator('#캐릭터창').waitFor({state:'hidden'});
  const name=mobile?'mobile':'desktop';console.log(name,'ready');
  await page.screenshot({path:new URL(`spawn-${name}.png`,output).pathname});
  await page.evaluate(()=>{schoolTour.test.setPosition({x:-18.15,y:-47.66,z:-.6});schoolTour.test.setYaw(0);});
  await page.locator('#차량탑승').waitFor({state:'visible'});await page.screenshot({path:new URL(`nearby-${name}.png`,output).pathname});
  assert(await page.locator('#차량탑승 img').evaluate(i=>i.complete&&i.naturalWidth>0),'Car icon loaded');
  await page.locator('#차량탑승').click({force:true});console.log(name,'boarding',await page.evaluate(()=>({drive:schoolTour.getDrivingState().phase,state:schoolTour.getState()})));await page.waitForFunction(()=>['entering','driving'].includes(schoolTour.getDrivingState().phase));
  await page.screenshot({path:new URL(`entering-${name}.png`,output).pathname});
  await page.waitForFunction(()=>schoolTour.getDrivingState().phase==='driving');
  assert((await page.evaluate(()=>schoolTour.getState().character)).seated);
  await page.screenshot({path:new URL(`seated-${name}.png`,output).pathname});console.log(name,'seated');
  const start=await page.evaluate(()=>schoolTour.getDrivingState());
  await page.keyboard.down('KeyW');try{await page.waitForFunction(()=>Math.abs(schoolTour.getDrivingState().speed)>2);}finally{await page.keyboard.up('KeyW');}
  await page.keyboard.down('KeyD');await page.keyboard.down('KeyW');
  try{await page.waitForFunction(yaw=>Math.abs(schoolTour.getDrivingState().yaw-yaw)>.08,start.yaw);}finally{await page.keyboard.up('KeyD');await page.keyboard.up('KeyW');}
  const moved=await page.evaluate(()=>schoolTour.getDrivingState());assert(Math.abs(moved.yaw-start.yaw)>.08);
  await page.screenshot({path:new URL(`driving-${name}.png`,output).pathname});
  await page.keyboard.down('Space');try{await page.waitForFunction(()=>Math.abs(schoolTour.getDrivingState().speed)<.2);}finally{await page.keyboard.up('Space');}
  await page.locator('#차량탑승').click({force:true});await page.waitForFunction(()=>schoolTour.getDrivingState().phase==='walking');
  await page.screenshot({path:new URL(`exit-${name}.png`,output).pathname});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const png=await page.locator('canvas').first().screenshot();
  const colors=await page.evaluate(async data=>{const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();const c=document.createElement('canvas');c.width=128;c.height=96;const ctx=c.getContext('2d');ctx.drawImage(im,0,0,128,96);const p=ctx.getImageData(0,0,128,96).data,s=new Set();for(let i=0;i<p.length;i+=16)s.add(p.slice(i,i+3).join(','));return s.size;},png.toString('base64'));
  assert(colors>80);report.checks.push({mobile,boarding:true,seated:true,acceleration:true,steering:true,braking:true,exit:true,colors,overflow:false});console.log(name,'passed');await context.close();
 }
 assert.deepEqual(report.errors,[]);report.ok=true;
}finally{await browser.close();await fs.writeFile(new URL('checks.json',output),JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
