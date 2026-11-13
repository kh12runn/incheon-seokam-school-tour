async main=>{
 await main.goto('about:blank');const browser=main.context().browser(),context=await browser.newContext({viewport:{width:1280,height:850}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{if(!localStorage.getItem('석암-RockOn-기록-v1'))localStorage.setItem('석암-RockOn-기록-v1',JSON.stringify({version:1,stamps:48,bestRound:0,wins:0,awards:[]}));});
 // UI contract tests use deterministic responses; the real SQLite API has a
 // separate HTTP + actual-physics-proof test, including restart/concurrency.
 const rows=[];let submitCount=0;
 await page.route('**/api/racing/finish',route=>route.fulfill({json:{qualifies:true,milliseconds:81000,records:rows}}));
 await page.route('**/api/racing/submit',route=>{submitCount++;const data=route.request().postDataJSON();if(data.nickname!=='도전왕'||data.grade!==6||data.classNumber!==2)throw Error('Identity form mismatch');rows.push({rank:1,grade:6,class:2,nickname:'도전왕',carName:'석암 챔피언',milliseconds:81000});return route.fulfill({json:{rank:1,records:rows}});});
 try{
  await page.goto('http://127.0.0.1:8081/?test=1');await page.waitForFunction(()=>schoolTour?.getState().ready,null,{timeout:180000});
  await page.locator('#레이싱시작').click();await page.locator('[data-car="field-champion"]').click();await page.locator('#레이스출발').click();await page.locator('.코스출발').click();
  const win=await page.evaluate(async()=>{const {driverInput}=await import('/웹학교/검사/레이싱테스트조작.mjs'),r=schoolTour.test.raceDebug();for(let i=0;i<30*300&&r.view().phase!=='finished';i++){r.update(1/30,driverInput(r,{skill:'expert'}));if(i%300===0)await new Promise(requestAnimationFrame);}return r.view();});if(!win.won)throw Error('Did not win');
  await page.locator('.기록등록 form').waitFor({state:'visible'});await page.locator('.기록등록 select').selectOption('6');await page.locator('.기록등록 [name=classNumber]').fill('2');await page.locator('.기록등록 [name=nickname]').fill('도전왕');await page.locator('.기록등록 [type=submit]').click();await page.getByText('공용 기록 1위! 친구들이 볼 수 있도록 저장했어요.').waitFor();
  await page.screenshot({path:'output/world-record-result.png'});
  await page.locator('#레이스다음').click();if(await page.locator('.코스출발').isDisabled())throw Error('Round 2 not unlocked');
  if(await page.locator('#레이스코스선택').getAttribute('data-round')!=='2')throw Error('Next preview not selected');
  await page.screenshot({path:'output/world-unlocked-highway.png'});
  await page.locator('.코스탭 [data-round="4"]').click();if(!await page.locator('.코스출발').isDisabled())throw Error('Round 4 unlocked early');
  await page.locator('#레이스종료').click();await page.reload();await page.waitForFunction(()=>schoolTour?.getState().ready,null,{timeout:180000});await page.locator('#레이싱시작').click();await page.locator('#레이스출발').click();await page.locator('.코스탭 [data-round="2"]').click();if(await page.locator('.코스출발').isDisabled())throw Error('Unlock lost on reload');
  await page.locator('.코스출발').click();await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing');await page.keyboard.down('w');await page.waitForTimeout(2000);await page.keyboard.up('w');await page.screenshot({path:'output/world-highway-driving.png'});await page.locator('#레이스종료').click();
  if(submitCount!==1||errors.length)throw Error(JSON.stringify({submitCount,errors}));return {ok:true,earnedUnlock:true,reloadPersistence:true,recordForm:true,liveHighwayDriving:true,errors};
 }finally{await context.close();}
}
