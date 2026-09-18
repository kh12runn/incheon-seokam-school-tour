export async function verifyPrincipalRoom(page,baseURL='http://127.0.0.1:8080'){
  const assert=(v,m)=>{if(!v)throw new Error(m);},errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  try{
    await page.goto(baseURL+'/?test=1&principal-check=1');
    await page.waitForFunction(()=>window.schoolTour?.getState().ready);
    const lazy=await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>decodeURIComponent(r.name).includes('/캐릭터모델/')));assert(lazy,'항공뷰에서 GLB 다운로드 안 함');
    await page.locator('#시작').click();await page.locator('#캐릭터확인').click();
    await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption('2F_PRINCIPAL');await page.locator('#방이동').click({noWaitAfter:true});
    await page.waitForFunction(()=>schoolTour.getOfficePrincipalStates().length===2&&schoolTour.getOfficePrincipalStates().every(s=>s.modelStatus==='ready'));
    const pair=await page.evaluate(()=>schoolTour.getOfficePrincipalStates());
    assert(pair.map(s=>s.id).join(',')==='realistic,cute','실물형과 귀여운형');
    assert(pair.every(s=>s.visible&&s.height===1.84&&!s.moving),'두 모델 표시·184cm·고정 배치');
    const entry=await page.evaluate(()=>schoolTour.getState());assert(entry.position.x===32.45&&entry.position.z===3.4,'교장실 안전한 입구 이동');
    await page.evaluate(()=>document.getElementById('메뉴').click());const paused=await page.evaluate(()=>schoolTour.getOfficePrincipalStates().map(s=>s.position));
    await page.waitForTimeout(400);assert(JSON.stringify(paused)===JSON.stringify(await page.evaluate(()=>schoolTour.getOfficePrincipalStates().map(s=>s.position))),'메뉴 중 두 모델 위치 유지');
    await page.locator('#메뉴닫기').click();const resume=await page.evaluate(()=>schoolTour.getState());assert(resume.freeLook||resume.locked||resume.touch.active,'X 닫은 뒤 시점 복구');
    const spacing=[];
    for(let index=0;index<2;index++){
      const approach=await page.evaluate(index=>{
        const p=schoolTour.getOfficePrincipalStates()[index].position,w=schoolTour.test.world;
        for(const [dx,dy] of [[.85,0],[0,.85],[0,-.85],[-.85,0]]){
          const q=w.candidate(p.x+dx,p.y+dy,p.z);if(!q)continue;
          schoolTour.test.setPosition(q);schoolTour.test.setYaw(Math.atan2(dx,-dy));return true;
        }return false;
      },index);assert(approach,'모델 '+index+' 접근 검사 위치');
      await page.keyboard.down('w');
      try{
        await page.waitForFunction(index=>{const p=schoolTour.getState().position,n=schoolTour.getOfficePrincipalStates()[index].position;return Math.hypot(p.x-n.x,p.y-n.y)<.75;},index);
        await page.evaluate(()=>new Promise(resolve=>{let frames=12;function tick(){if(--frames<=0)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
        const stopped=await page.evaluate(()=>schoolTour.getState().position);
        await page.evaluate(()=>new Promise(resolve=>{let frames=6;function tick(){if(--frames<=0)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
        const held=await page.evaluate(()=>schoolTour.getState().position);
        assert(Math.hypot(held.x-stopped.x,held.y-stopped.y)<1e-6,'계속 전진해도 모델 충돌 위치 유지');
      }finally{await page.keyboard.up('w');}
      const distance=await page.evaluate(index=>{const p=schoolTour.getState().position,n=schoolTour.getOfficePrincipalStates()[index].position;return Math.hypot(p.x-n.x,p.y-n.y);},index);
      // Movement rejects an entire step that crosses the .56m radius, leaving
      // up to one movement step outside that boundary on slow renderers.
      assert(distance>=.54&&distance<.75,'모델 '+index+' 앞으로 이동 후 충돌 경계에서 멈춤');spacing.push(distance);
    }
    await page.evaluate(()=>schoolTour.test.setPosition({x:20,y:1.5,z:0}));await page.waitForTimeout(150);
    assert(await page.evaluate(()=>schoolTour.getOfficePrincipalStates().every(s=>!s.visible)),'다른 층 두 모델 숨김');assert(errors.length===0,'실행 오류 '+errors.join(';'));
    return {ok:true,lazyModels:lazy,pair,entry:true,menuPause:true,closeResume:true,npcSpacing:spacing,otherFloorHidden:true,errors};
  }finally{page.off('pageerror',onError);}
}
