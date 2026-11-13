async main=>{
 const browser=main.context().browser(),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8081/?test=1');await page.waitForFunction(()=>schoolTour?.getState().ready,null,{timeout:180000});
  await page.locator('#항공뷰기록 .기록목록').getByText('아직 기록이 없어요. 첫 번째 이름을 남겨보세요!').waitFor();
  await page.screenshot({path:'output/world-start-pc.png'});
  await page.locator('#레이싱시작').click();await page.locator('#레이스출발').click();
  await page.locator('.코스탭 [data-round="4"]').click();
  if(!await page.locator('.코스출발').isDisabled())throw Error('Locked round started');
  await page.waitForTimeout(1500);await page.screenshot({path:'output/world-locked-roof.png'});
  await page.locator('.코스구경').hover({position:{x:650,y:110}});await page.mouse.down();await page.mouse.move(900,350,{steps:12});await page.mouse.up();
  await page.locator('.코스탭 [data-round="3"]').click();await page.waitForTimeout(1000);await page.screenshot({path:'output/world-tunnel.png'});
  await page.locator('.코스탭 [data-round="1"]').click();await page.locator('.코스출발').click();await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing');
  await page.keyboard.down('w');await page.waitForTimeout(1500);await page.keyboard.up('w');if((await page.evaluate(()=>schoolTour.getRacingState().speed))<1)throw Error('Race does not drive');
  await page.keyboard.press('Escape');await page.locator('#레이스차고이동').click();await page.locator('#레이스종료').click();
  if(await page.evaluate(()=>schoolTour.getState().mode!=='overview'))throw Error('Exit did not restore school');
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}),mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));
  try{
   await mp.goto('http://127.0.0.1:8081/');await mp.waitForFunction(()=>schoolTour?.getState().ready,null,{timeout:180000});
   await mp.screenshot({path:'output/world-start-mobile.png'});await mp.locator('.기록접기').tap();await mp.locator('#항공뷰기록 [aria-label="라운드 5 기록"]').tap();await mp.screenshot({path:'output/world-records-mobile.png'});await mp.locator('.기록접기').tap();
   await mp.locator('#레이싱시작').tap();await mp.locator('#레이스출발').tap();await mp.locator('.코스탭 [data-round="5"]').tap();await mp.waitForTimeout(1200);await mp.screenshot({path:'output/world-preview-mobile.png'});
   if(!await mp.locator('.코스출발').isDisabled())throw Error('Mobile lock');
   await mp.locator('.코스기록보기').tap();await mp.locator('.코스순위닫기').tap();
   if(await mp.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
  }finally{await mobile.close();}
  if(errors.length)throw Error(errors.join('\n'));return {ok:true,PC:true,mobile:true,lockedPreview:true,manualDrive:true,errors};
 }finally{await context.close();}
}
