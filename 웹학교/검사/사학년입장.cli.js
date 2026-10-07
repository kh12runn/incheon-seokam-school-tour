async page => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1100,height:750});
  await page.goto('http://127.0.0.1:8080/?test=1');
  await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:120000});
  await page.locator('#시작').click();
  await page.locator('#걸어서선택').click();
  await page.locator('#캐릭터확인').click();
  await page.evaluate(()=>document.getElementById('메뉴').click());
  await page.locator('#방선택').selectOption('4F_4-4');
  await page.locator('#방이동').click({noWaitAfter:true});
  await page.waitForFunction(()=>schoolTour.getState().mode==='walk');
  const entered=await page.evaluate(()=>schoolTour.getState());
  if(Math.abs(entered.position.z-10.2)>.001)throw new Error('Wrong floor');
  await page.screenshot({path:'output/grade4-game-entry.png'});
  await page.keyboard.down('w');await page.waitForTimeout(600);await page.keyboard.up('w');
  const moved=await page.evaluate(()=>schoolTour.getState());
  if(errors.length)throw new Error(JSON.stringify(errors));
  return {ok:true,entered,moved};
}
