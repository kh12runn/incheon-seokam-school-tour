async page=>{
 const results=[];
 await page.goto('about:blank');
 for(const mobile of [false,true]){
  const context=await page.context().browser().newContext({viewport:mobile?{width:390,height:844}:{width:1100,height:800},hasTouch:mobile,isMobile:mobile});
  const p=await context.newPage(),errors=[],failed=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push(r.url());});
  try{
   await p.goto('http://127.0.0.1:8080/?test=1');await p.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:180000});
   // Fix the draw only for this test so the first round carries a real parcel.
   await p.evaluate(()=>{window.originalRandom=Math.random;Math.random=()=>.1;});
   await p.locator('#퀴즈시작').click();await p.locator('#캐릭터확인').click({timeout:180000});
   await p.waitForFunction(()=>schoolTour.getMissionState().active&&schoolTour.getState().mode==='walk',null,{timeout:180000});
   await p.evaluate(()=>{Math.random=window.originalRandom;});
   const type=await p.evaluate(()=>schoolTour.test.missionDebug().type);
   if(type!=='delivery')throw Error('Expected a parcel delivery draw, received '+type);
   await p.evaluate(()=>schoolTour.test.setPosition(schoolTour.test.missionDebug().item));
   await p.waitForFunction(()=>!!schoolTour.getMissionState().action);
   if(mobile)await p.locator('#미션동작').tap();else await p.keyboard.press('r');
   await p.waitForFunction(()=>!!schoolTour.getMissionState().cargo);
   await p.evaluate(()=>schoolTour.test.setPosition({x:78.5,y:1.5,z:0}));
   await p.locator('#승강기호출').waitFor({state:'visible'});
   const original=await p.evaluate(()=>schoolTour.getMissionState());
   const rides=[];
   for(const floor of [4,2,1]){
    if(mobile)await p.locator('#승강기호출').tap();else await p.keyboard.press('KeyE');
    await p.waitForFunction(()=>document.querySelector('#승강기창').open);
    const timer=await p.evaluate(()=>schoolTour.getMissionState().remaining);
    await p.waitForTimeout(400);
    if(Math.abs(timer-await p.evaluate(()=>schoolTour.getMissionState().remaining))>.01)throw Error('Elevator menu consumes mission time');
    if(floor===4)await p.screenshot({path:`output/mission-elevator-${mobile?'mobile':'pc'}.png`});
    await p.locator(`[data-elevator-floor="${floor}"]`).click();
    await p.waitForFunction(f=>Math.abs(schoolTour.getState().position.z-(f-1)*3.4)<.05&&!document.querySelector('#승강기창').open,floor);
    await p.waitForFunction(()=>document.body.dataset.playing==='true');
    const state=await p.evaluate(()=>schoolTour.getMissionState());
    for(const k of ['phase','round','stamps','cargo','clue'])if(JSON.stringify(state[k])!==JSON.stringify(original[k]))throw Error('Elevator changed mission '+k);
    if(!mobile){await p.mouse.move(500,320);const yaw=await p.evaluate(()=>schoolTour.getState().yaw);await p.mouse.move(610,360,{steps:4});if(Math.abs(yaw-await p.evaluate(()=>schoolTour.getState().yaw))<.01)throw Error('Mouse look did not resume');}
    rides.push(floor);
   }
   // Both dismissal paths resume play without requiring the Continue button.
   for(const close of ['escape','button']){
    if(mobile)await p.locator('#승강기호출').tap();else await p.keyboard.press('KeyE');
    await p.waitForFunction(()=>document.querySelector('#승강기창').open);
    if(close==='escape'&&!mobile)await p.keyboard.press('Escape');else await p.locator('#승강기닫기').click();
    await p.waitForFunction(()=>document.body.dataset.playing==='true');
   }
   if(!await p.locator('#동층이동').isDisabled())throw Error('Menu teleport must stay disabled during missions');
   if(mobile){
    const yaw=await p.evaluate(()=>schoolTour.getState().yaw),cdp=await context.newCDPSession(p);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:275,y:430}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:345,y:430}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    if(Math.abs(yaw-await p.evaluate(()=>schoolTour.getState().yaw))<.01)throw Error('Touch look did not resume');
   }
   if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));
   results.push({mobile,rides,parcelPreserved:true,timerPaused:true,lookResumed:true,errors,failed});
  }finally{await context.close();}
 }
 return {ok:true,results};
}
