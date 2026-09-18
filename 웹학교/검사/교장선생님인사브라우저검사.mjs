export async function verifyPrincipalGreetings(page,baseURL='http://127.0.0.1:8080'){
  const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  const bubble=name=>page.locator('#'+name+'교장말풍선');
  try{
    await page.goto(baseURL+'/?test=1&greeting-check=1');
    await page.waitForFunction(()=>window.schoolTour?.getState().ready);
    assert(!await bubble('중앙현관').isVisible(),'항공뷰 말풍선 숨김');
    await page.locator('#시작').click();await page.locator('#캐릭터확인').click();
    await page.evaluate(()=>{schoolTour.test.setPosition({x:45,y:-2.8,z:0});schoolTour.test.setYaw(-Math.PI/2);});
    await bubble('중앙현관').waitFor({state:'visible'});
    assert(await bubble('중앙현관').textContent()==='행복하세요! 9월은 September!','정확한 문구');
    await page.waitForFunction(()=>schoolTour.getLobbyPrincipalState().faceTexture==='ready');
    const runner=await page.evaluate(()=>schoolTour.getLobbyPrincipalState());assert(runner.accessories.length===3&&runner.faceTexture==='ready','러닝복·선글라스·선캡·메가폰, 사진 얼굴 로드');
    assert(runner.appearanceVersion==='approved-skin-wrap-v6','승인된 피부·검정 머리·감싸는 선글라스 적용');
    await page.evaluate(()=>document.getElementById('메뉴').click());assert(!await bubble('중앙현관').isVisible(),'메뉴에서 숨김');
    await page.locator('#메뉴닫기').click();await bubble('중앙현관').waitFor({state:'visible'});
    assert(await page.evaluate(()=>{const s=schoolTour.getState();return s.locked||s.freeLook||s.touch.active;}),'메뉴 X 닫은 뒤 조작 유지');
    await page.evaluate(()=>schoolTour.test.setPosition({x:41,y:-2.8,z:0}));await bubble('중앙현관').waitFor({state:'hidden'});
    await page.evaluate(()=>schoolTour.test.setPosition({x:32.45,y:-.85,z:3.4}));
    await page.waitForFunction(()=>schoolTour.getPrincipalState().visible);
    await page.evaluate(()=>{
      const n=schoolTour.getPrincipalState().position,w=schoolTour.test.world;
      for(const [dx,dy]of [[0,.8],[-.8,0],[.8,0],[0,-.8]]){const p=w.candidate(n.x+dx,n.y+dy,n.z);if(!p)continue;schoolTour.test.setPosition(p);schoolTour.test.setYaw(Math.atan2(dx,-dy));return;}
      throw Error('교장실 접근 위치 없음');
    });
    await bubble('교장실').waitFor({state:'visible'});assert(!await bubble('중앙현관').isVisible(),'2층에서 1층 인사 숨김');
    await page.waitForFunction(()=>schoolTour.getOfficePrincipalStates().every(s=>s.modelStatus==='ready'));
    assert(await page.evaluate(()=>schoolTour.getOfficePrincipalStates().length===2&&schoolTour.getOfficePrincipalStates().every(s=>s.height===1.84)),'교장실 두 승인 모델 로드 및 184cm 높이');
    assert(await bubble('교장실').textContent()==='행복하세요! 9월은 September!','두 NPC 동일한 인사');
    assert(errors.length===0,errors.join(';'));
    return {ok:true,runner,officeGreeting:true,lobbyGreeting:true,menuResume:true,otherFloorHidden:true,errors};
  }finally{page.off('pageerror',onError);}
}
