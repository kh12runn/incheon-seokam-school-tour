async main=>{
 await main.goto('about:blank');const browser=main.context().browser(),errors=[];
 async function create(mobile=false){const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});await context.addInitScript(()=>localStorage.setItem('석암-RockOn-기록-v1',JSON.stringify({version:1,stamps:48,bestRound:4,wins:4,awards:[]})));const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});return {context,page};}
 const {context,page}=await create();
 try{
  await page.goto('http://127.0.0.1:8081/?test=1');await page.waitForFunction(()=>schoolTour?.getState().ready,null,{timeout:180000});await page.locator('#레이싱시작').click();await page.waitForFunction(()=>schoolTour.getRacingState().starter?.status==='ready',null,{timeout:120000});await page.locator('#레이스출발').click();
  for(const round of [2,3,4,5]){await page.locator(`.코스탭 [data-round="${round}"]`).click();await page.waitForTimeout(1200);await page.screenshot({path:`output/campus-round-${round}.png`});const passage=await page.evaluate(()=>schoolTour.getRacePassageState());if(!passage.open||passage.cutZones>32)throw Error('Invalid course cuts');}
  await page.locator('.코스출발').click();await page.waitForFunction(()=>schoolTour.getRacingState().phase==='countdown');
  await page.evaluate(()=>{const r=schoolTour.test.raceDebug();for(let i=0;i<4;i++)r.update(.25);r.pause(true);});await page.waitForTimeout(500);await page.screenshot({path:'output/campus-starter-ready.png'});
  await page.evaluate(()=>schoolTour.test.raceDebug().pause(false));await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing');await page.waitForTimeout(450);await page.screenshot({path:'output/campus-starter-go.png'});
  const first=await page.evaluate(()=>schoolTour.getRacingState().starter);await page.waitForTimeout(300);const second=await page.evaluate(()=>schoolTour.getRacingState().starter);if(first.pose.shoulderZ===second.pose.shoulderZ||second.status!=='ready')throw Error('Flag/arm not animated');
  const samples=await page.evaluate(()=>{const r=schoolTour.test.raceDebug();r.pause(true);return r.course.highlights.map(h=>({s:h.at*r.course.length,label:h.label}));});
  for(let i=0;i<samples.length;i++){
   const at=await page.evaluate(s=>{const r=schoolTour.test.raceDebug(),p=r.course.trackPoint(s);Object.assign(r.player,{x:p.x,z:p.z,height:p.height,s,yaw:p.yaw,speed:0,lane:0});return {height:p.height,tunnel:p.tunnel};},samples[i].s);
   await page.waitForTimeout(1200);await page.screenshot({path:`output/campus-drive-${i}.png`});
  }
  await page.locator('#레이스종료').click();if(await page.evaluate(()=>schoolTour.getRacePassageState().open))throw Error('School holes not restored');
 }finally{await context.close();}
 const mobile=await create(true);try{
  const p=mobile.page;await p.goto('http://127.0.0.1:8081/?test=1');await p.waitForFunction(()=>schoolTour?.getState().ready,null,{timeout:180000});await p.locator('#레이싱시작').tap();await p.locator('#레이스출발').tap();await p.locator('.코스탭 [data-round="3"]').tap();await p.waitForTimeout(1500);await p.screenshot({path:'output/campus-mobile-preview.png'});await p.locator('.코스출발').tap();await p.waitForFunction(()=>schoolTour.getRacingState().phase==='racing',null,{timeout:120000});
  await p.evaluate(()=>{const r=schoolTour.test.raceDebug(),s=r.course.highlights[0].at*r.course.length,point=r.course.trackPoint(s);r.pause(true);Object.assign(r.player,{x:point.x,z:point.z,s,height:point.height,yaw:point.yaw,speed:0});});await p.waitForTimeout(1400);await p.screenshot({path:'output/campus-mobile-tunnel.png'});
  const metrics=await p.evaluate(()=>schoolTour.getPerformanceState());if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');await p.locator('#레이스종료').tap();if(await p.evaluate(()=>schoolTour.getRacePassageState().open))throw Error('Mobile restoration failed');if(errors.length)throw Error(errors.join('\n'));return {ok:true,rounds:4,animatedPrincipal:true,undergroundCamera:true,mobile:true,restoresSchool:true,metrics,errors};
 }finally{await mobile.context.close();}
}
