async page=>{
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(r.url()+':'+r.status());});
 await page.setViewportSize({width:1365,height:900});await page.goto('http://127.0.0.1:8080/?test=1&shaderDebug=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});
 const original=await page.evaluate(()=>localStorage.getItem('석암-RockOn-기록-v1'));
 try{
  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('석암-RockOn-기록-v1')||'{}');p.stamps=48;p.bestRound=4;localStorage.setItem('석암-RockOn-기록-v1',JSON.stringify(p));});
  await page.reload();await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});await page.locator('#레이싱시작').click();await page.locator('[data-car="field-champion"]').click();await page.locator('#레이스라운드').selectOption('5');await page.locator('#레이스출발').click();
  await page.waitForFunction(()=>schoolTour.getRacingState().drivers?.length===5&&schoolTour.getRacingState().drivers.every(d=>d.status==='ready'),null,{timeout:120000});
  const drivers=await page.evaluate(()=>schoolTour.getRacingState().drivers);if(new Set(drivers.map(d=>d.driverId)).size!==5)throw Error('Duplicate teacher');await page.screenshot({path:'output/race-teacher-grid.png'});
  // Fast, input-driven physics simulation for final-round result UI coverage.
  // The PC test separately completes three laps through real keyboard events.
  await page.evaluate(async()=>{const {driverInput}=await import('/웹학교/검사/레이싱테스트조작.mjs'),r=schoolTour.test.raceDebug();r.pause(false);for(let i=0;i<18000&&r.view().phase!=='finished';i++){r.update(1/60,driverInput(r));if(i%180===0)await new Promise(resolve=>setTimeout(resolve,0));}if(r.view().phase!=='finished')throw Error('Final race did not finish');});
  await page.locator('#레이스결과표').waitFor({state:'visible'});const state=await page.evaluate(()=>schoolTour.getRacingState());if(state.laps!==3||state.total!==6)throw Error('Wrong final round');
  const rows=await page.locator('#레이스결과순위 tr').allTextContents();if(rows.length!==6)throw Error('Wrong standings count');for(const c of state.standings)if(!rows.some(row=>row.includes(c.driverName)&&row.includes(c.carName)))throw Error('Driver/result mismatch: '+c.driverName);
  if(!(await page.locator('#레이스결과분류').textContent()).includes('최종'))throw Error('Final round label missing');await page.screenshot({path:'output/race-teacher-final.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'output/race-teacher-final-mobile.png'});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Result overflow');
  await page.locator('#레이스차고이동').click();await page.locator('#레이스종료').click();if(await page.evaluate(()=>schoolTour.getRacePassageState().open||schoolTour.getRacingState().drivers.length))throw Error('Race state not released');
  if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));return {ok:true,loadedDrivers:drivers,finalRank:state.rank,finalLaps:state.laps,rows:rows.length,portraitLayout:true,errors,failed};
 }finally{await page.evaluate(value=>value===null?localStorage.removeItem('석암-RockOn-기록-v1'):localStorage.setItem('석암-RockOn-기록-v1',value),original);}
}
