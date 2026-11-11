async page=>{
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push(r.url());});
 await page.setViewportSize({width:1100,height:800});await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:300000});
 await page.screenshot({path:'output/mission12-start.png'});await page.locator('#퀴즈시작').click();await page.locator('#캐릭터확인').click({timeout:180000});await page.waitForFunction(()=>schoolTour.getMissionState().active,null,{timeout:180000});
 if(!await page.locator('#동층이동').isDisabled())throw Error('Teleport must be disabled');
 await page.keyboard.press('Escape');await page.locator('#게임메뉴').waitFor({state:'visible'});const paused=await page.evaluate(()=>schoolTour.getMissionState().remaining);await page.waitForTimeout(600);if(Math.abs(paused-await page.evaluate(()=>schoolTour.getMissionState().remaining))>.01)throw Error('Timer did not pause');await page.locator('#메뉴닫기').click();
 async function visit(id,routeIndex){
  await page.evaluate(index=>{const r=schoolTour.test.missionDebug().routes[index];schoolTour.test.setPosition(r.at(-1));},routeIndex);
  await page.waitForFunction(id=>id.startsWith('office-')?schoolTour.getPrincipalState().modelStatus==='ready':schoolTour.getClassTeacherStates().find(n=>n.id===id)?.modelStatus==='ready',id,{timeout:240000});
  await page.evaluate(async id=>{
   const npc=id.startsWith('office-')?schoolTour.getPrincipalState():schoolTour.getClassTeacherStates().find(n=>n.id===id),w=schoolTour.test.world,{principalCanGreet}=await import('/웹학교/교장선생님인사.mjs');let place;
   for(let r=1.5;r>=.8&&!place;r-=.2)for(let a=0;a<Math.PI*2;a+=.25){const p={x:npc.position.x+Math.cos(a)*r,y:npc.position.y+Math.sin(a)*r,z:npc.position.z};if(w.candidate(p.x,p.y,p.z)&&principalCanGreet(p,npc.position,{colliders:w.colliders})){place=p;break;}}
   if(!place)throw Error('No teacher interaction point');schoolTour.test.setPosition(place);schoolTour.test.setYaw(Math.atan2(place.x-npc.position.x,npc.position.y-place.y));
  },id);
  await page.waitForFunction(()=>schoolTour.getMissionState().nearTeacher,null,{timeout:20000});
 }
 const rounds=[];let answered=0;
 for(let n=1;n<=12;n++){
  await page.waitForFunction(n=>schoolTour.getMissionState().round===n&&schoolTour.getMissionState().phase!=='reward',n,{timeout:30000});const d=await page.evaluate(()=>schoolTour.test.missionDebug());
  if(d.type==='search'||d.type==='delivery'||d.type==='drive'){
   await page.evaluate(()=>schoolTour.test.setPosition(schoolTour.test.missionDebug().item));
   if(d.type==='search')await page.waitForFunction(()=>schoolTour.getMissionState().phase==='teacher');
   else {await page.waitForFunction(()=>!!schoolTour.getMissionState().action);await page.screenshot({path:`output/mission12-${d.type}.png`});await page.keyboard.press('r');await page.waitForFunction(()=>!!schoolTour.getMissionState().cargo);}
  }
  if(d.type==='relay'){await visit(d.contact.id,0);await page.keyboard.press('r');await page.waitForFunction(()=>schoolTour.getMissionState().phase==='teacher');await page.screenshot({path:'output/mission12-relay.png'});}
  if(d.type==='drive'){
   await page.evaluate(async ()=>{const c=schoolTour.test.missionDebug().course,{CAR_DIMENSIONS}=await import('/웹학교/주차장.mjs'),lx=-CAR_DIMENSIONS.sports.width/2-.62,ly=.35,p={x:c.launch.x+Math.cos(c.launch.yaw)*lx-Math.sin(c.launch.yaw)*ly,y:c.launch.y+Math.sin(c.launch.yaw)*lx+Math.cos(c.launch.yaw)*ly,z:c.launch.z};schoolTour.test.setPosition(p);});
   await page.keyboard.press('f');await page.waitForFunction(()=>schoolTour.getDrivingState().phase==='driving',null,{timeout:20000});
   await page.screenshot({path:'output/mission12-driving.png'});
   for(const target of [...d.course.checkpoints,d.course.park]){
    const axis=d.course.id==='rear'?'x':'y',pos=await page.evaluate(id=>schoolTour.getDrivingState().cars.find(c=>c.id===id).position,d.course.carId),key=target[axis]>pos[axis]?'w':'s';
    await page.keyboard.down(key);try{await page.waitForFunction(({target,id})=>{const p=schoolTour.getDrivingState().cars.find(c=>c.id===id).position;return Math.hypot(p.x-target.x,p.y-target.y)<1.9;},{target,id:d.course.carId},{timeout:40000,polling:50});}finally{await page.keyboard.up(key);}
   }
   await page.waitForFunction(()=>schoolTour.getMissionState().phase==='unload',null,{timeout:15000});await page.keyboard.press('f');await page.waitForFunction(()=>schoolTour.getDrivingState().phase==='walking',null,{timeout:15000});
   await page.evaluate(()=>schoolTour.test.setPosition(schoolTour.test.missionDebug().course.drop));await page.waitForFunction(()=>!!schoolTour.getMissionState().action);await page.keyboard.press('r');
  }else{
   await visit(d.teacher.id,1);if(d.type!=='search')await page.keyboard.press('r');await page.locator('#탐험퀴즈말풍선').waitFor({state:'visible',timeout:20000});
   if(answered++===0){const wrong=(d.correct+1)%4;await page.locator(`[data-choice="${wrong}"]`).click();await page.waitForFunction(i=>document.querySelector(`[data-choice="${i}"]`).disabled,wrong);await page.screenshot({path:'output/mission12-quiz.png'});}
   await page.keyboard.press('Digit'+(d.correct+1));
  }
  await page.waitForFunction(n=>schoolTour.getMissionState().stamps===n,n);rounds.push({round:n,type:d.type,limit:d.limit});
 }
 await page.locator('#미션결과').waitFor({state:'visible',timeout:20000});await page.screenshot({path:'output/mission12-complete.png'});await page.locator('#미션다시').click();await page.waitForFunction(()=>schoolTour.getMissionState().active&&schoolTour.getMissionState().stamps===0);
 await page.keyboard.press('Escape');await page.locator('#게임메뉴').waitFor({state:'visible'});await page.locator('#전체').click();if(await page.evaluate(()=>schoolTour.getMissionState().active))throw Error('Mission not stopped');
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.waitForFunction(()=>schoolTour.getState().mode==='walk');await page.keyboard.press('Escape');await page.locator('#게임메뉴').waitFor({state:'visible'});if(await page.locator('#동층이동').isDisabled())throw Error('Free mode not restored');
 if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));return {ok:true,rounds,actualKeyboardDriving:true,dialogueAndDelivery:true,pause:true,retry:true,freeMode:true,errors,failed};
}
