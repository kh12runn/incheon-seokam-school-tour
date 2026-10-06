import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-boarding-v3-')),errors=[];
try{
 const page=await browser.newPage({viewport:{width:900,height:650},hasTouch:true,isMobile:true,deviceScaleFactor:.65});page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8080')+'/?test=1');
 await page.waitForFunction(()=>schoolTour?.getState().ready);
 await page.locator('#시작').click();await page.locator('#운전선택').click();await page.locator('[data-parking=rear]').click();await page.waitForFunction(()=>!document.getElementById('캐릭터확인').disabled);await page.locator('#캐릭터확인').click();
 await page.locator('#차량탑승').waitFor({state:'visible'});
 await page.evaluate(()=>{
  window.transitionSamples=[];const record=()=>{const d=schoolTour.getDrivingState();if(['entering','exiting'].includes(d.phase))transitionSamples.push({phase:d.phase,blend:d.seatBlend,door:d.door,heading:schoolTour.getState().character.heading});requestAnimationFrame(record);};record();
 });
 await page.locator('#차량탑승').click();await page.waitForFunction(()=>schoolTour.getDrivingState().phase==='driving');
 assert((await page.evaluate(()=>schoolTour.getState().character)).seated);await page.screenshot({path:path.join(output,'seated.png')});
 // Measure actual movement as well as the displayed speed. Keep the short
 // test inside the parking aisle so no curb or wall changes its result.
 const initial=await page.evaluate(()=>{const d=schoolTour.getDrivingState();return d.cars.find(c=>c.id===d.carId).position;});
 await page.keyboard.down('KeyW');try{await page.waitForFunction(p=>{const d=schoolTour.getDrivingState(),c=d.cars.find(c=>c.id===d.carId);return Math.hypot(c.position.x-p.x,c.position.y-p.y)>1.1&&d.speed>13;},initial);}finally{await page.keyboard.up('KeyW');}
 await page.waitForFunction(()=>Math.abs(schoolTour.getDrivingState().speed)<.1);
 await page.locator('#차량탑승').click();await page.waitForFunction(()=>schoolTour.getDrivingState().phase==='walking');
 assert(!(await page.evaluate(()=>schoolTour.getState().character)).seated);await page.screenshot({path:path.join(output,'exit.png')});
 const samples=await page.evaluate(()=>transitionSamples);
 for(const phase of ['entering','exiting']){const list=samples.filter(s=>s.phase===phase);assert(list.some(s=>s.blend>.1&&s.blend<.9),'Intermediate sitting pose '+phase);for(const s of list)if(s.blend>.02&&s.blend<.98)assert(s.door>.99,'Door open while body crosses');}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,smoothBoarding:true,drivesAtRequestedSpeed:true,safeExit:true,transitionSamples:samples.length,errors,output}));
}finally{await browser.close();}
