async main=>{
 await main.goto('about:blank');const context=await main.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await context.addInitScript(()=>{if(!localStorage.getItem('석암-RockOn-기록-v1'))localStorage.setItem('석암-RockOn-기록-v1',JSON.stringify({version:1,stamps:48,bestRound:4,wins:4,awards:[]}));});
 try{
  await page.goto('http://127.0.0.1:8081/?test=1');await page.waitForFunction(()=>schoolTour?.getState().ready,null,{timeout:180000});await page.screenshot({path:'output/world-mobile-final-start.png'});
  await page.locator('#레이싱시작').tap();await page.locator('#레이스출발').tap();await page.locator('[data-round="5"]').tap();await page.waitForTimeout(2500);await page.screenshot({path:'output/world-mobile-final-preview.png'});
  await page.locator('.코스출발').tap();await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing');
  const cameraCheck=await page.evaluate(()=>{const r=schoolTour.test.raceDebug(),p=r.course.trackPoint(r.course.length*.40);Object.assign(r.player,{x:p.x,z:p.z,height:p.height,s:p.s,yaw:p.yaw});return {height:p.height,course:r.course.id};});
  await page.waitForTimeout(1200);await page.screenshot({path:'output/world-mobile-roof-driving.png'});
  await page.locator('#레이스일시정지').tap();await page.locator('#레이스차고이동').tap();await page.locator('#레이스출발').tap();
  for(const round of [2,3,4,5,1,5])await page.locator(`[data-round="${round}"]`).tap();
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(1500);await page.screenshot({path:'output/world-mobile-final-landscape.png'});
  const metrics=await page.evaluate(()=>({perf:schoolTour.getPerformanceState(),overflow:document.documentElement.scrollWidth>innerWidth}));if(metrics.overflow||errors.length)throw Error(JSON.stringify({metrics,errors}));
  await page.locator('#레이스종료').tap();if(await page.evaluate(()=>schoolTour.getState().mode!=='overview'))throw Error('Exit failed');
  return {ok:true,cameraCheck,metrics,errors};
 }finally{await context.close();}
}
