import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:760},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8086';await page.goto(base+'/healthz');
 await page.evaluate(async()=>{
  const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{staffRoomDetails}=await import('/웹학교/교무실사진표현.mjs'),{meetingRoomDetails}=await import('/웹학교/운영위원회회의실표현.mjs'),{createPrincipalOffice}=await import('/웹학교/교장실표현.mjs'),{officeConnectingDoor}=await import('/웹학교/교장실연결문표현.mjs'),{teacherChairDetails,classroomWindowSigns}=await import('/웹학교/교사자리와창팻말표현.mjs'),{finishMaterial}=await import('/웹학교/현실재질.mjs');
  const {nurseRoomDetails}=await import('/웹학교/보건실사진표현.mjs');
  const {individualLearningDetails}=await import('/웹학교/개별학습실사진표현.mjs');
  const world=buildWorld(await(await fetch('/웹학교/학교구조.json')).json());document.body.replaceChildren();document.body.style.margin='0';const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,760);renderer.toneMapping=THREE.ACESFilmicToneMapping;document.body.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#bdd4dd');scene.add(new THREE.HemisphereLight(0xfff7e9,0xb0bcb0,2.2));const light=new THREE.DirectionalLight(0xfff6e7,1.7);light.position.set(20,70,30);scene.add(light);const camera=new THREE.PerspectiveCamera(77,1100/760,.025,100);let content;
  window.showReview=(kind)=>{
   if(content)scene.remove(content);content=new THREE.Group();scene.add(content);
   const ids=kind.startsWith('individual4')?['1F_INDIVIDUAL_4']:kind.startsWith('individual5')?['1F_INDIVIDUAL_5']:kind.startsWith('nurse')?['1F_NURSE']:kind.startsWith('staff')?['2F_STAFF']:kind.startsWith('door')?['2F_PRINCIPAL','2F_OPERATIONS_MEETING']:['4F_6-4'];
   const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(.5,14,10);
   for(const b of world.boxes.filter(b=>!b.renderInDetails&&(ids.includes(b.spaceId)||ids.some(id=>b.name.includes('Window_'+id))))){const a=b.bounds,m=new THREE.Mesh(b.shape==='sphere'?sphere:cube,finishMaterial(b));m.position.set((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2);m.scale.set(a[3]-a[0],a[5]-a[2],a[4]-a[1]);content.add(m);}
   if(ids.includes('2F_STAFF'))content.add(staffRoomDetails(world.specialInteriors.find(r=>r.roomId==='2F_STAFF')));
   if(ids.includes('1F_NURSE'))content.add(nurseRoomDetails(world.specialInteriors.find(r=>r.roomId==='1F_NURSE')));
   if(kind.startsWith('individual'))content.add(individualLearningDetails(world.specialInteriors.find(r=>r.roomId===ids[0])));
   if(kind.startsWith('door')){content.add(createPrincipalOffice());content.add(meetingRoomDetails(world.specialInteriors.find(r=>r.roomId==='2F_OPERATIONS_MEETING')));const door=officeConnectingDoor(world.officeDoor);content.add(door);if(kind!=='door-closed')for(let i=0;i<90;i++)world.officeDoor.update(1/60,{x:38.1,y:-5.72,z:3.4});door.userData.update();}
   if(ids.includes('4F_6-4')){content.add(teacherChairDetails(world.teacherChairs.filter(p=>p.roomId==='4F_6-4')));content.add(classroomWindowSigns({...world.data,rooms:world.data.rooms.filter(r=>r.id==='4F_6-4')}));}
   const poses={
    'staff-entry':[[47.55,5.1,1.1],[52,4.8,3.6]],'staff-pantry':[[53.8,5.1,3.5],[43.2,4.9,3.6]],
    'staff-end-desks':[[55.65,5.45,3.5],[54.5,4.25,2.4]],
    'nurse-waiting':[[61.3,1.7,2.2],[63.6,1.4,.7]],
    'nurse-entry':[[61.1,1.7,1.0],[62.8,1.35,3.3]],'nurse-treatment':[[62.7,1.7,3.45],[63.8,1.3,6.3]],'nurse-beds':[[60.4,1.65,4.30],[60.2,1.1,6.1]],
    'individual4-front':[[98.7,1.72,52.3],[95.8,1.45,46.4]],'individual4-back':[[94,1.72,47.2],[96,1.45,54.7]],
    'individual5-front':[[98.7,1.72,38.8],[95.8,1.45,33.4]],'individual5-back':[[94.1,1.72,34.2],[96.2,1.45,39.6]],
    'door-closed':[[38.3,5.04,5.72],[36.5,4.9,5.72]],'door-open-meeting':[[38.3,5.04,5.72],[36,4.9,5.72]],'door-open-principal':[[35.7,5.04,5.72],[38.8,4.9,5.72]],
    'teacher-chair':[[30.68,11.6,3.25],[30.565,10.80,4.63]],'window-sign':[[35,12.0,10],[35,11.92,7.145]],
   };const [eye,target]=poses[kind];camera.position.set(...eye);camera.lookAt(...target);renderer.render(scene,camera);
  };
 });
 const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-staff-door-preview-'));
 const views=['individual4-front','individual4-back','individual5-front','individual5-back','nurse-entry','nurse-waiting','nurse-treatment','nurse-beds','staff-entry','staff-pantry','staff-end-desks','door-closed','door-open-meeting','door-open-principal','teacher-chair','window-sign'];
 for(const view of views){await page.evaluate(v=>showReview(v),view);await page.screenshot({path:path.join(output,view+'.png')});}
 console.log(JSON.stringify({stage:'rendered',output}));
 await page.setViewportSize({width:390,height:700});await page.goto(base+'/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:120000});await page.locator('#시작').click();await page.locator('#캐릭터확인').click();
 await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption('2F_STAFF');await page.locator('#방이동').click();
 assert.equal((await page.evaluate(()=>schoolTour.getState())).position.x,47.55);
 await page.evaluate(()=>schoolTour.test.setPosition({x:38.15,y:-5.72,z:3.4}));await page.waitForFunction(()=>schoolTour.test.world.officeDoor.angle>1.55,null,{timeout:30000});
 const crossing=await page.evaluate(()=>{for(let i=0;i<42;i++)schoolTour.test.step(-.05,0);return schoolTour.getState().position;});assert(Math.abs(crossing.x-36.05)<.03);
 await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption('1F_NURSE');await page.locator('#방이동').click();
 const nurseState=await page.evaluate(()=>schoolTour.getState());assert.equal(nurseState.position.x,61.1);assert.equal(nurseState.position.z,0);
 await page.screenshot({path:path.join(output,'nurse-mobile-game.png')});
 for(const id of ['1F_INDIVIDUAL_4','1F_INDIVIDUAL_5']){
  await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption(id);await page.locator('#방이동').click();
  const state=await page.evaluate(()=>schoolTour.getState());assert.equal(state.position.x,99.1);assert.equal(state.position.z,0);
  await page.screenshot({path:path.join(output,id+'-mobile.png')});
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,actualWebGL:true,staffTeleport:true,nurseTeleport:true,individualRoomTeleports:2,liveDoorAnimation:true,doorCrossing:true,views:views.length,output}));
}finally{await browser.close();}
