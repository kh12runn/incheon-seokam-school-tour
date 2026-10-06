import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-parking-ui-')),errors=[],checks=[];
try{
 for(const mobile of (process.env.TEST_MOBILE_ONLY?[true]:[false,true])){
  const context=await browser.newContext({viewport:mobile?{width:390,height:750}:{width:1100,height:760},hasTouch:true,isMobile:mobile,deviceScaleFactor:.5});
  const page=await context.newPage();page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));
  // Software WebGL needs a reduced refresh rate on CI, not reduced scene detail.
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>setTimeout(()=>raf(cb),120);});
  await page.goto((process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8080')+'/?test=1');
  await page.waitForFunction(()=>window.schoolTour?.getState().ready);
  console.log({stage:'ready',mobile});
  const before=await page.evaluate(()=>schoolTour.getState().position);
  assert.equal(await page.locator('#주차장바로가기').count(),0,'No separate car invitation button');
  const chooseDriving=async()=>{await page.locator('#시작').click();await page.locator('#운전선택').click();};
  await page.locator('#시작').click();await page.locator('#탐험방법닫기').click();
  await page.locator('#시작').click();await page.keyboard.press('Escape');assert(!await page.locator('#탐험방법선택').evaluate(d=>d.open));
  await chooseDriving();await page.locator('#탐험방법뒤로').click();assert(await page.locator('#탐험방법선택').evaluate(d=>d.open));
  await page.locator('#걸어서선택').click();await page.locator('#캐릭터닫기').click();
  await chooseDriving();await page.locator('#주차장닫기').click();
  assert.deepEqual(await page.evaluate(()=>schoolTour.getState().position),before);
  await chooseDriving();await page.keyboard.press('Escape');assert(!await page.locator('#주차장선택').evaluate(d=>d.open));
  await chooseDriving();await page.locator('[data-parking=rear]').click();
  await page.locator('#캐릭터닫기').click();assert.deepEqual(await page.evaluate(()=>schoolTour.getState().position),before);
  for(const [key,prefix] of [['rear','rear'],['front','field']]){
   if(key==='front'){await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#전체').click();}
   await chooseDriving();
   await page.screenshot({path:path.join(output,`${mobile?'mobile':'desktop'}-${key}-menu.png`)});
   await page.locator(`[data-parking=${key}]`).click();
   if(key==='rear'){await page.waitForFunction(()=>!document.getElementById('캐릭터확인').disabled);await page.locator('#캐릭터확인').click();}
   await page.waitForFunction(()=>schoolTour.getState().mode==='walk'&&document.body.dataset.playing==='true');
   const s=await page.evaluate(()=>({state:schoolTour.getState(),drive:schoolTour.getDrivingState()})),car=s.drive.cars.find(c=>c.id===prefix+'-lamborghini');
   assert(Math.hypot(s.state.position.x-car.position.x,s.state.position.y-car.position.y)<2);
   await page.locator('#차량탑승').waitFor({state:'visible'});
   await page.screenshot({path:path.join(output,`${mobile?'mobile':'desktop'}-${key}-car.png`)});
   await page.locator('#차량탑승').click();await page.waitForFunction(()=>schoolTour.getDrivingState().phase==='driving');
   assert.equal(await page.evaluate(()=>schoolTour.getDrivingState().carId),prefix+'-lamborghini');
   assert((await page.evaluate(()=>schoolTour.getState().character)).seated);
   await page.screenshot({path:path.join(output,`${mobile?'mobile':'desktop'}-${key}-seated.png`)});
   await page.keyboard.down('Space');
   await page.evaluate(()=>new Promise(resolve=>{let frames=0;function settle(){if(++frames>=25)resolve();else requestAnimationFrame(settle);}requestAnimationFrame(settle);}));
   await page.keyboard.up('Space');
   await page.locator('#차량탑승').click();
   console.log({stage:'exit-request',mobile,lot:key,state:await page.evaluate(()=>{const s=schoolTour.getDrivingState();return {phase:s.phase,speed:s.speed,error:s.error};})});
   await page.waitForFunction(()=>schoolTour.getDrivingState().phase==='walking');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   checks.push({mobile,lot:key,teleport:true,boarding:true,exit:true});console.log(checks.at(-1));
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,checks,errors,output}));
}finally{await browser.close();}
