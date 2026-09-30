import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {runtimeFiles} from '../../관리도구/배포최적화.mjs';
const base=process.env.SCHOOL_TEST_URL??'https://school-tour-production.up.railway.app';
assert.equal((await fetch(base+'/healthz')).status,200);
const files=runtimeFiles(),releaseRoot=process.env.SCHOOL_RELEASE_ROOT;assert(releaseRoot,'Set SCHOOL_RELEASE_ROOT to the exact committed archive uploaded to Railway');let next=0;
// git archive applies configured line endings; compare the uploaded artifact,
// not a mixed-line-ending working tree or the normalized git object bytes.
await Promise.all(Array.from({length:4},async()=>{while(next<files.length){const file=files[next++],response=await fetch(base+'/'+encodeURI(file));assert.equal(response.status,200,file);let local=fs.readFileSync(path.join(releaseRoot,file));if(file.endsWith('.json'))local=Buffer.from(JSON.stringify(JSON.parse(local)));assert.deepEqual(Buffer.from(await response.arrayBuffer()),local,file+' deployed byte match');}}));
for(const file of ['/관리도구/관리자/API.mjs','/school-assets/catalog.json'])assert.equal((await fetch(base+encodeURI(file))).status,403);
assert.equal((await fetch(base+'/api/admin/structure')).status,401);
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:700},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:150000});
 assert.equal(await page.evaluate(()=>typeof schoolTour.test),'undefined');
 await page.locator('#시작').click();await page.locator('#캐릭터확인').click();
 for(const [room,x,z] of [['1F_INDIVIDUAL_4',99.1,0],['1F_INDIVIDUAL_5',99.1,0],['1F_NURSE',61.1,0],['2F_STAFF',47.55,3.4]]){
  await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption(room);await page.locator('#방이동').click();
  const state=await page.evaluate(()=>schoolTour.getState());assert.equal(state.position.x,x);assert.equal(state.position.z,z);
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,base,publicFilesMatch:files.length,individualRoomTeleports:2,nurseTeleport:true,staffTeleport:true,mobileViewport:true,privatePathsBlocked:true,noPublicTestHook:true,pageErrors:errors}));
}finally{await browser.close();}
