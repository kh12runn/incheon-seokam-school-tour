// Full-game regression: real answer clicks/keys, no canvas click to resume.
export async function verifyDialogueLook(page,{denyLock=false}={}){
 const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1100,height:800});await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:180000});
 if(denyLock)await page.evaluate(()=>{HTMLCanvasElement.prototype.requestPointerLock=()=>Promise.reject(new DOMException('Regression: denied pointer lock','NotAllowedError'));});
 await page.locator('#퀴즈시작').click();await page.locator('#캐릭터확인').click({timeout:180000});await page.waitForFunction(()=>schoolTour.getMissionState().active);
 for(let tries=0;await page.evaluate(()=>schoolTour.test.missionDebug().type==='drive');tries++){
  if(tries>12)throw Error('Could not draw a quiz task');await page.keyboard.press('Escape');await page.locator('#전체').click();await page.locator('#퀴즈시작').click();await page.waitForFunction(()=>schoolTour.getMissionState().active);
 }
 async function look(label){
  await page.waitForFunction(deny=>{const s=schoolTour.getState();return !s.menuOpen&&!s.dragMode&&(deny?s.freeLook:s.locked);},denyLock,{timeout:10000});
  // Mouse motion alone, never a click or held button.
  await page.mouse.move(740,620);const before=await page.evaluate(()=>schoolTour.getState().yaw);await page.mouse.move(790,630,{steps:4});
  const after=await page.evaluate(()=>schoolTour.getState());if(Math.abs(before-after.yaw)<.01)throw Error(label+': automatic look stopped');
  checks.push({label,locked:after.locked,freeLook:after.freeLook});
 }
 async function visit(id,index){
  await page.evaluate(index=>schoolTour.test.setPosition(schoolTour.test.missionDebug().routes[index].at(-1)),index);
  await page.waitForFunction(id=>id.startsWith('office-')?schoolTour.getPrincipalState().modelStatus==='ready':schoolTour.getClassTeacherStates().find(n=>n.id===id)?.modelStatus==='ready',id,{timeout:240000});
  await page.evaluate(async id=>{
   const npc=id.startsWith('office-')?schoolTour.getPrincipalState():schoolTour.getClassTeacherStates().find(n=>n.id===id),w=schoolTour.test.world,{principalCanGreet}=await import('/웹학교/교장선생님인사.mjs');let place;
   for(let r=1.5;r>=.8&&!place;r-=.2)for(let a=0;a<Math.PI*2;a+=.25){const p={x:npc.position.x+Math.cos(a)*r,y:npc.position.y+Math.sin(a)*r,z:npc.position.z};if(w.candidate(p.x,p.y,p.z)&&principalCanGreet(p,npc.position,{colliders:w.colliders})){place=p;break;}}
   if(!place)throw Error('No teacher approach');schoolTour.test.setPosition(place);schoolTour.test.setYaw(Math.atan2(place.x-npc.position.x,npc.position.y-place.y));
  },id);await page.waitForFunction(()=>schoolTour.getMissionState().nearTeacher);
 }
 await look('미션 시작');const d=await page.evaluate(()=>schoolTour.test.missionDebug());
 if(d.type==='relay'){await visit(d.contact.id,0);await page.keyboard.press('r');await look('말 걸기 후');}
 else{await page.evaluate(()=>schoolTour.test.setPosition(schoolTour.test.missionDebug().item));await page.waitForFunction(()=>schoolTour.getMissionState().phase==='teacher'||!!schoolTour.getMissionState().action);if(d.type==='delivery')await page.keyboard.press('r');}
 async function question(){await visit(d.teacher.id,1);if(d.type!=='search')await page.keyboard.press('r');await page.locator('#탐험퀴즈말풍선').waitFor({state:'visible'});await page.waitForFunction(()=>!schoolTour.getState().locked);}
 await question();
 const wrong=(d.correct+1)%4;await page.locator(`[data-choice="${wrong}"]`).click();await page.waitForFunction(i=>document.querySelector(`[data-choice="${i}"]`).disabled,wrong);
 if(await page.evaluate(()=>schoolTour.getState().locked))throw Error('Wrong answer stole selection pointer');
 await page.keyboard.press('Escape');await page.locator('#게임메뉴').waitFor({state:'visible'});await page.locator('#메뉴닫기').click();await page.locator('#탐험퀴즈말풍선').waitFor({state:'visible'});
 if(await page.evaluate(()=>schoolTour.getState().locked))throw Error('Menu close locked unanswered choices');
 await page.evaluate(()=>schoolTour.test.setPosition(schoolTour.test.world.spawn));await page.locator('#탐험퀴즈말풍선').waitFor({state:'hidden'});await look('대화에서 멀어진 후');
 await question();
 // Capture the orientation at the actual answer event, after pointer positioning.
 await page.evaluate(()=>document.addEventListener('click',e=>{if(e.target.closest('[data-choice]'))window.answerLook=schoolTour.getState();},{capture:true,once:true}));
 await page.locator(`[data-choice="${d.correct}"]`).click();await page.waitForFunction(()=>schoolTour.getMissionState().stamps===1);await page.locator('#탐험퀴즈말풍선').waitFor({state:'hidden'});
 const orientation=await page.evaluate(()=>({before:window.answerLook,after:schoolTour.getState()}));
 if(Math.abs(orientation.before.yaw-orientation.after.yaw)>1e-6||Math.abs(orientation.before.pitch-orientation.after.pitch)>1e-6)throw Error('Answer reset camera orientation');
 await look('정답 클릭 후');
 for(const close of ['Escape','X']){await page.keyboard.press('Escape');await page.locator('#게임메뉴').waitFor({state:'visible'});if(close==='Escape')await page.keyboard.press('Escape');else await page.locator('#메뉴닫기').click();await look('완료 후 메뉴 '+close);}
 await page.keyboard.press('Escape');await page.locator('#전체').click();if(await page.evaluate(()=>schoolTour.getState().mode!=='overview'))throw Error('Overview changed');
 if(errors.length)throw Error(errors.join(';'));return {ok:true,denyLock,type:d.type,wrongRetry:true,choicesAfterMenu:true,orientationPreserved:true,checks,errors};
}
