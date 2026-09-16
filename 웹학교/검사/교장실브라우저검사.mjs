export async function verifyPrincipalRoom(page){
  const assert=(v,m)=>{if(!v)throw new Error(m);},errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  try{
    await page.goto('http://127.0.0.1:8080/?test=1&principal-check=1');
    await page.waitForFunction(()=>window.schoolTour?.getState().ready);
    const lazy=await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>decodeURIComponent(r.name).includes('교장선생님-얼굴')));assert(lazy,'항공뷰에서 얼굴 다운로드 안 함');
    await page.locator('#시작').click();await page.locator('#캐릭터확인').click();
    await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption('2F_PRINCIPAL');await page.locator('#방이동').click();
    await page.waitForFunction(()=>schoolTour.getPrincipalState().faceTexture==='ready');
    const entry=await page.evaluate(()=>schoolTour.getState());assert(entry.position.x===32.45&&entry.position.z===3.4,'교장실 안전한 입구 이동');
    await page.waitForFunction(()=>schoolTour.getPrincipalState().distance>.30);
    const moving=await page.evaluate(()=>schoolTour.getPrincipalState());assert(moving.visible,'NPC 표시');
    await page.evaluate(()=>document.getElementById('메뉴').click());const paused=await page.evaluate(()=>schoolTour.getPrincipalState().position);
    await page.waitForTimeout(400);assert(JSON.stringify(paused)===JSON.stringify(await page.evaluate(()=>schoolTour.getPrincipalState().position)),'메뉴 중 NPC 정지');
    await page.locator('#메뉴닫기').click();const resume=await page.evaluate(()=>schoolTour.getState());assert(resume.freeLook||resume.locked||resume.touch.active,'X 닫은 뒤 시점 복구');
    const approach=await page.evaluate(()=>{
      const p=schoolTour.getPrincipalState().position,w=schoolTour.test.world;
      for(const [dx,dy] of [[-.85,0],[.85,0],[0,.85],[0,-.85]]){
        const q=w.candidate(p.x+dx,p.y+dy,p.z);if(!q)continue;
        schoolTour.test.setPosition(q);schoolTour.test.setYaw(Math.atan2(dx,-dy));return true;
      }return false;
    });assert(approach,'접근 검사 위치');
    await page.waitForTimeout(100);assert(await page.evaluate(()=>schoolTour.getPrincipalState().yielding),'사용자 가까우면 멈춤');
    await page.keyboard.down('w');await page.waitForTimeout(550);await page.keyboard.up('w');
    const spacing=await page.evaluate(()=>{const p=schoolTour.getState().position,n=schoolTour.getPrincipalState().position;return Math.hypot(p.x-n.x,p.y-n.y);});assert(spacing>=.54,'NPC 몸 통과 방지');
    await page.evaluate(()=>schoolTour.test.setPosition({x:20,y:1.5,z:0}));await page.waitForTimeout(150);
    assert(!await page.evaluate(()=>schoolTour.getPrincipalState().visible),'다른 층 NPC 숨김');assert(errors.length===0,'실행 오류 '+errors.join(';'));
    return {ok:true,lazyFace:true,entry:true,patrolMoved:moving.distance,menuPause:true,closeResume:true,playerYield:true,npcSpacing:spacing,otherFloorHidden:true,errors};
  }finally{page.off('pageerror',onError);}
}
