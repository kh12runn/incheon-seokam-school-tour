async main=>{
 await main.goto('about:blank');
 const context=await main.context().browser().newContext({viewport:{width:1200,height:800}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>localStorage.setItem('석암-RockOn-기록-v1',JSON.stringify({version:1,stamps:48,bestRound:4,wins:0,awards:[]})));
 try{
  await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:180000});
  await page.locator('#레이싱시작').click();await page.locator('[data-car="field-champion"]').click();
  await page.locator('#레이스출발').click();await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing');
  const first=await page.evaluate(()=>schoolTour.getRacingState().course);
  await page.keyboard.down('KeyW');await page.waitForFunction(()=>schoolTour.getRacingState().speed>5);await page.keyboard.up('KeyW');
  await page.keyboard.press('Escape');await page.locator('#레이스재도전').click();
  // Accelerate wall-clock time only: the test driver supplies ordinary controls
  // and every checkpoint/finish is earned through the unchanged physics step.
  const finish=await page.evaluate(async()=>{
   const {driverInput}=await import('/웹학교/검사/레이싱테스트조작.mjs'),r=schoolTour.test.raceDebug();
   for(let i=0;i<30*300&&r.view().phase!=='finished';i++){
    r.update(1/30,driverInput(r));if(i%600===0)await new Promise(requestAnimationFrame);
   }
   return r.view();
  });
  if(!finish.won||finish.lap!==3)throw Error('First round simulation failed to earn a win');
  await page.locator('#레이스다음').waitFor({state:'visible'});await page.locator('#레이스다음').click();
  await page.waitForFunction(()=>schoolTour.getRacingState().round===2);
  const second=await page.evaluate(()=>schoolTour.getRacingState().course);
  if(first.id===second.id)throw Error('Next round reused the old course');
  const courses=[];
  for(const round of [2,3,4,5]){
   if(round!==2){
    await page.locator('#레이스일시정지').click();await page.locator('#레이스차고이동').click();
    await page.locator('#레이스라운드').selectOption(String(round));
    await page.locator('#레이스출발').click();
   }
   await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing');
   const info=await page.evaluate(()=>({course:schoolTour.getRacingState().course,map:document.querySelector('#레이스트랙지도').dataset.course,label:document.querySelector('#레이스코스길이').textContent,laps:schoolTour.getRacingState().laps}));
   if(info.map!==info.course.id||!info.label.includes(String(Math.round(info.course.length)))||info.laps!==3)throw Error('Course, HUD and minimap disagree: '+JSON.stringify(info));
   await page.screenshot({path:`output/race-course-${round}.png`});courses.push(info);
  }
  if(new Set([first.id,...courses.map(c=>c.course.id)]).size!==5)throw Error('Five distinct round routes are required');
  // Repeated course switches must remain usable and restore the school on exit.
  for(const round of [1,5,2,4]){
   await page.locator('#레이스일시정지').click();await page.locator('#레이스차고이동').click();
   await page.locator('#레이스라운드').selectOption(String(round));await page.locator('#레이스출발').click();
  }
  await page.locator('#레이스종료').click();
  if(await page.evaluate(()=>schoolTour.getState().mode!=='overview'||schoolTour.getRacePassageState().open))throw Error('School was not restored');
  if(errors.length)throw Error(JSON.stringify(errors));
  return {ok:true,actualNextRound:true,first,second,courses,repeatedSwitches:true,schoolRestored:true,errors};
 }finally{await context.close();}
}
