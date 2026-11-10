async page=>{
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push(r.url());});
 await page.setViewportSize({width:1100,height:800});await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:120000});
 await page.locator('#시작').filter({hasText:'자유 탐험'}).waitFor();await page.screenshot({path:'output/mission-start.png'});
 await page.locator('#퀴즈시작').click();await page.locator('#캐릭터확인').click({timeout:120000});await page.waitForFunction(()=>schoolTour.getMissionState().phase==='search',null,{timeout:120000});
 if(!await page.locator('#동층이동').isDisabled())throw Error('Teleport must be disabled');
 if(!/6학년 교실 중/.test(await page.locator('#미션목표').innerText()))throw Error('Grade-level clue missing');
 const initial=await page.evaluate(()=>schoolTour.getMissionState());if(initial.limit<240)throw Error('Time is too short');
 const before=await page.evaluate(()=>schoolTour.getState().position);await page.keyboard.down('w');try{await page.waitForFunction(p=>Math.hypot(schoolTour.getState().position.x-p.x,schoolTour.getState().position.y-p.y)>.2,before,{timeout:5000});}finally{await page.keyboard.up('w');}
 const moved=await page.evaluate(p=>Math.hypot(schoolTour.getState().position.x-p.x,schoolTour.getState().position.y-p.y)>.2,before);if(!moved)throw Error('Keyboard movement failed');
 await page.keyboard.press('Escape');await page.locator('#게임메뉴').waitFor({state:'visible'});const paused=await page.evaluate(()=>schoolTour.getMissionState().remaining);await page.waitForTimeout(700);
 if(Math.abs(paused-await page.evaluate(()=>schoolTour.getMissionState().remaining))>.01)throw Error('Menu timer must pause');await page.locator('#메뉴닫기').click();
 await page.screenshot({path:'output/mission-search.png'});
 const rounds=[];
 for(let round=1;round<=4;round++){
  await page.waitForFunction(n=>schoolTour.getMissionState().round===n&&schoolTour.getMissionState().phase==='search',round);
  await page.evaluate(()=>schoolTour.test.setPosition(schoolTour.test.missionDebug().item));await page.waitForFunction(()=>schoolTour.getMissionState().phase!=='search');
  const teacher=await page.evaluate(()=>schoolTour.getMissionState().teacher);
  await page.evaluate(()=>{const route=schoolTour.test.missionDebug().routes[1];schoolTour.test.setPosition(route[route.length-1]);});
  await page.waitForFunction(id=>id.startsWith('office-')?schoolTour.getPrincipalState().modelStatus==='ready':schoolTour.getClassTeacherStates().find(n=>n.id===id)?.modelStatus==='ready',teacher.id,{timeout:150000});
  await page.evaluate(async id=>{
   const npc=id.startsWith('office-')?schoolTour.getPrincipalState():schoolTour.getClassTeacherStates().find(n=>n.id===id),w=schoolTour.test.world;
   const {principalCanGreet}=await import('/웹학교/교장선생님인사.mjs');let place;
   for(let r=1.5;r>=.8&&!place;r-=.2)for(let a=0;a<Math.PI*2;a+=.25){const p={x:npc.position.x+Math.cos(a)*r,y:npc.position.y+Math.sin(a)*r,z:npc.position.z};if(w.candidate(p.x,p.y,p.z)&&principalCanGreet(p,npc.position,{colliders:w.colliders})){place=p;break;}}
   if(!place)throw Error('No usable teacher interaction point');schoolTour.test.setPosition(place);schoolTour.test.setYaw(Math.atan2(place.x-npc.position.x,npc.position.y-place.y));
  },teacher.id);
  await page.locator('#탐험퀴즈말풍선').waitFor({state:'visible',timeout:20000});const correct=await page.evaluate(()=>schoolTour.test.missionDebug().correct);
  if(round===1){
   await page.locator(`[data-choice="${(correct+1)%4}"]`).click();if(!await page.locator(`[data-choice="${(correct+1)%4}"]`).isDisabled())throw Error('Wrong choice must disable');
   await page.screenshot({path:'output/mission-quiz.png'});
   await page.keyboard.press('Escape');await page.locator('#게임메뉴').waitFor({state:'visible'});await page.locator('#메뉴닫기').click();await page.locator('#탐험퀴즈말풍선').waitFor({state:'visible'});
  }
  await page.keyboard.press('Digit'+(correct+1));await page.waitForFunction(n=>schoolTour.getMissionState().stamps===n,round);
  rounds.push({round,teacher:teacher.label,...await page.evaluate(()=>({limit:schoolTour.getMissionState().limit,remaining:schoolTour.getMissionState().remaining}))});
 }
 await page.locator('#미션결과').waitFor({state:'visible',timeout:10000});await page.screenshot({path:'output/mission-complete.png'});
 await page.locator('#미션다시').click();await page.waitForFunction(()=>schoolTour.getMissionState().phase==='search'&&schoolTour.getMissionState().stamps===0);
 await page.keyboard.press('Escape');await page.locator('#게임메뉴').waitFor({state:'visible'});await page.locator('#전체').click();
 if(await page.evaluate(()=>schoolTour.getMissionState().active))throw Error('Mission did not stop');
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.waitForFunction(()=>schoolTour.getState().mode==='walk');
 await page.keyboard.press('Escape');await page.locator('#게임메뉴').waitFor({state:'visible'});if(await page.locator('#동층이동').isDisabled())throw Error('Free mode teleport not restored');
 if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));return{ok:true,rounds,keyboardMovement:moved,pause:true,quizMouseAndKeyboard:true,retry:true,freeModeRestored:true,errors,failed};
}
