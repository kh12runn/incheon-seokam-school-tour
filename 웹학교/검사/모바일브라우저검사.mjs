// Run with a Chromium Playwright page created with isMobile:true, hasTouch:true.
export async function verifyMobileControls(page){
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  await page.goto('http://127.0.0.1:8080/?test=1&mobile-check=1');
  await page.waitForFunction(()=>window.schoolTour?.getState().ready);
  const cdp=await page.context().newCDPSession(page),fingers=new Map(),checks=[];
  const state=()=>page.evaluate(()=>schoolTour.getState());
  const point=async id=>{const b=await page.locator('#'+id).boundingBox();assert(b,id+' visible');return {x:b.x+b.width/2,y:b.y+b.height/2};};
  async function event(type,id,p){if(type==='touchEnd')fingers.delete(id);else if(type==='touchCancel')fingers.clear();else fingers.set(id,{id,...p,radiusX:6,radiusY:6,force:1});await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...fingers.values()]});}
  // Overview pinch and drag, independent from walking camera controls.
  const initial=(await state()).overview.orbit.distance;
  await event('touchStart',1,{x:250,y:170});await event('touchStart',2,{x:310,y:240});
  await event('touchMove',2,{x:365,y:310});await event('touchEnd',2);await event('touchEnd',1);
  assert((await state()).overview.orbit.distance<initial,'항공뷰 두 손가락 확대');checks.push('항공뷰 핀치');
  await page.locator('#시작').tap();await page.locator('#캐릭터확인').tap();
  assert((await state()).touch.visible&&!(await state()).locked,'터치 자동 인식 · 잠금 없음');
  const stick=await point('이동패드'),start=await state();
  await event('touchStart',1,stick);await event('touchMove',1,{x:stick.x,y:stick.y-45});
  await event('touchStart',2,{x:280,y:390});await event('touchMove',2,{x:325,y:375});
  await page.waitForTimeout(350);const moved=await state();
  assert(Math.hypot(moved.position.x-start.position.x,moved.position.y-start.position.y)>.4,'조이스틱 이동');
  assert(Math.abs(moved.yaw-start.yaw)>.05&&moved.touch.stickHeld&&moved.touch.lookPointers===1,'동시 이동+시점');
  const jump=await point('터치점프');await event('touchStart',3,jump);await page.waitForTimeout(80);
  assert((await state()).jump.airborne,'세 번째 손가락 점프');checks.push('이동+시점+점프 멀티터치');
  await event('touchEnd',3);await event('touchEnd',2);await event('touchEnd',1);await page.waitForTimeout(900);
  const stopped=await state();await page.waitForTimeout(250);const still=await state();
  assert(Math.hypot(still.position.x-stopped.position.x,still.position.y-stopped.position.y)<.02,'손을 떼면 정지');
  await page.locator('#터치인사').tap();assert((await state()).character.waving,'인사 터치');checks.push('놓으면 정지 · 인사');
  // Cancellation and modal opening must release all pointer ownership.
  await event('touchStart',1,stick);await event('touchMove',1,{x:stick.x,y:stick.y-40});await event('touchCancel');
  assert(!(await state()).touch.stickHeld&&(await state()).touch.movement.forward===0,'취소 입력 해제');
  await event('touchStart',1,stick);await event('touchMove',1,{x:stick.x,y:stick.y-40});
  await page.locator('#메뉴').evaluate(e=>e.click());assert(!(await state()).touch.visible&&!(await state()).touch.stickHeld,'메뉴 입력 해제');
  await event('touchEnd',1);await page.locator('#메뉴닫기').tap();assert((await state()).touch.visible,'X 닫기 터치 복구');checks.push('취소·메뉴 복귀');
  // A screen rotation must stop the previous gesture; controls stay on screen.
  await event('touchStart',1,stick);await event('touchMove',1,{x:stick.x,y:stick.y-40});
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);await event('touchEnd',1);
  assert(!(await state()).touch.stickHeld,'회전 시 입력 해제');
  for(const id of ['이동패드','터치점프','터치인사','메뉴']){const b=await page.locator('#'+id).boundingBox();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=845&&b.y+b.height<=391,'가로 화면 버튼 범위 '+id);}
  const landscapeStick=await point('이동패드');await event('touchStart',1,landscapeStick);await event('touchMove',1,{x:landscapeStick.x+40,y:landscapeStick.y});assert((await state()).touch.movement.right>.9,'가로 화면 조이스틱');await event('touchEnd',1);checks.push('가로 회전·조작');
  await page.evaluate(()=>{schoolTour.test.setPosition({x:78.5,y:1.5,z:0});});await page.waitForTimeout(200);
  await page.locator('#승강기호출').tap();await page.locator('[data-elevator-floor="4"]').tap();await page.waitForFunction(()=>schoolTour.getState().position.z>10&&schoolTour.getState().touch.visible);checks.push('터치 엘리베이터');
  await page.locator('#메뉴').tap();await page.locator('#동층이동').selectOption('ANNEX:4');assert((await state()).position.y===-43,'터치 층 선택');
  await page.locator('#메뉴').tap();await page.locator('#전체').tap();assert(!(await state()).touch.visible,'항공뷰에서는 패드 숨김');
  await cdp.detach();return {ok:true,checks,graphics:(await state()).graphics};
}
