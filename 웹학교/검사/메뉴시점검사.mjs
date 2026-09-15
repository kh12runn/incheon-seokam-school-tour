// Browser regression. Pass a Playwright Page; no extra click after dismissal.
// Example: await verifyMenuLook(page, {denyLock:true}).
export async function verifyMenuLook(page,{denyLock=false}={}){
  const checks=[];
  await page.goto('http://127.0.0.1:8080/?test=1');
  await page.waitForFunction(()=>window.schoolTour?.getState().ready);
  if(denyLock)await page.evaluate(()=>{
    HTMLCanvasElement.prototype.requestPointerLock=function(){
      document.dispatchEvent(new Event('pointerlockerror'));
      return Promise.reject(new DOMException('Deliberately denied in regression test','NotAllowedError'));
    };
  });
  const state=()=>page.evaluate(()=>schoolTour.getState());
  async function look(name){
    await page.waitForFunction(()=>{
      const s=schoolTour.getState();
      return s.mode==='walk'&&(s.locked||s.freeLook)&&!s.menuOpen&&
        !document.querySelector('#승강기창').open&&!document.querySelector('#캐릭터창').open;
    });
    await page.mouse.move(500,320);
    const before=await state();
    await page.mouse.move(610,365,{steps:4});
    const after=await state();
    if(after.dragMode||Math.abs(after.yaw-before.yaw)<.01)throw Error(name+': mouse look did not resume without dragging');
    if(!await page.locator('#시작안내').evaluate(e=>e.hidden))throw Error(name+': pause overlay remains');
    checks.push({name,locked:after.locked,freeLook:after.freeLook});
  }
  async function menu(){
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.querySelector('#게임메뉴').open);
    const before=await state();await page.mouse.move(470,290);
    if(Math.abs((await state()).yaw-before.yaw)>1e-8)throw Error('View moved behind an open menu');
  }
  await page.locator('#시작').click();
  await page.locator('#캐릭터확인').click();
  await look('캐릭터 선택 후 시작');
  for(let i=0;i<3;i++){
    await menu();await page.keyboard.press('Escape');await look('Esc 닫기 '+i);
    await menu();await page.locator('#메뉴닫기').click();await look('X 닫기 '+i);
  }
  await menu();await page.evaluate(()=>document.querySelector('#게임메뉴').close());await look('직접 close 종료');
  await menu();await page.locator('#걷기').click();await look('탐험 계속하기');
  for(const value of ['MAIN:1','MAIN:4','ANNEX:2']){
    await menu();await page.locator('#동층이동').selectOption(value);await look('층 선택 '+value);
  }
  await menu();await page.locator('#육사이동').click();await look('6-4 바로가기');
  await menu();await page.locator('#방선택').selectOption('4F_6-6');await page.locator('#방이동').click();await look('교실 선택');
  await menu();await page.locator('#처음').click();await look('출발점 이동');
  await menu();await page.locator('summary').click();await page.locator('#드래그걷기').click();await look('잠금 없이도 자동 시점');
  // Free-look must also work over the HUD, not only over the canvas.
  await page.mouse.move(120,65);const hudBefore=await state();await page.mouse.move(170,65);
  if(Math.abs((await state()).yaw-hudBefore.yaw)<.01)throw Error('HUD creates a dead area');
  for(const action of ['escape','close','ride']){
    await page.evaluate(()=>schoolTour.test.setPosition({x:78.5,y:1.5,z:0}));
    await page.keyboard.press('KeyE');await page.waitForFunction(()=>document.querySelector('#승강기창').open);
    if(action==='escape')await page.keyboard.press('Escape');
    else if(action==='close')await page.locator('#승강기닫기').click();
    else await page.locator('[data-elevator-floor="4"]').click();
    await look('엘리베이터 '+action);
  }
  await menu();await page.locator('#전체').click();
  if((await state()).mode!=='overview')throw Error('Overview must remain overview');
  return {ok:true,denyLock,checks};
}
