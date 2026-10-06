import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1100,height:760},hasTouch:true,isMobile:true,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8086')+'/healthz');
  const count=await page.evaluate(async()=>{
    const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{meetingRoomDetails}=await import('/웹학교/운영위원회회의실표현.mjs'),{finishMaterial}=await import('/웹학교/현실재질.mjs');
    const world=buildWorld(await(await fetch('/웹학교/학교구조.json')).json()),config=world.specialInteriors[0];
    document.body.replaceChildren();document.body.style.margin='0';const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,760);document.body.append(renderer.domElement);renderer.toneMapping=THREE.ACESFilmicToneMapping;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#bad2df');scene.add(new THREE.HemisphereLight(0xfff8e7,0x9baaa1,2.4));const light=new THREE.DirectionalLight(0xfff5dc,2);light.position.set(39,9,12);scene.add(light);
    const geometry=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(.5,16,10);
    for(const b of world.boxes.filter(b=>b.spaceId===config.roomId||b.name.includes('Window_'+config.roomId))){
      const a=b.bounds,mesh=new THREE.Mesh(b.shape==='sphere'?sphere:geometry,finishMaterial(b));mesh.position.set((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2);mesh.scale.set(a[3]-a[0],a[5]-a[2],a[4]-a[1]);scene.add(mesh);
    }
    scene.add(meetingRoomDetails(config));const camera=new THREE.PerspectiveCamera(80,1100/760,.03,80);
    window.showMeeting=rear=>{camera.position.set(rear?39.15:39.1,5.08,rear?6.58:.7);camera.lookAt(40.1,4.68,rear?.65:6.5);renderer.render(scene,camera);};window.showMeeting(false);return config.boxes.length;
  });
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-meeting-preview-'));
  for(const [name,rear] of [['입구',false],['창가',true]]){await page.evaluate(rear=>window.showMeeting(rear),rear);await page.screenshot({path:path.join(output,name+'.png')});}
  await page.setViewportSize({width:390,height:700});
  await page.goto((process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8086')+'/?test=1');
  await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:60000});
  await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
  await page.evaluate(()=>document.getElementById('메뉴').click());
  await page.locator('#방선택').selectOption('2F_OPERATIONS_MEETING');await page.locator('#방이동').click({noWaitAfter:true});
  await page.waitForFunction(()=>schoolTour.getState().position.z===3.4);
  const state=await page.evaluate(()=>schoolTour.getState());assert.equal(state.position.x,39.1);assert.equal(state.mode,'walk');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,actualWebGL:true,gameRoomTeleport:true,count,output}));
}finally{await browser.close();}
