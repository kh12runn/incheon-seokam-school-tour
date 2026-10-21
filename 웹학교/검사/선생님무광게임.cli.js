async page=>{
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push({url:r.url(),status:r.status()});});
 await page.setViewportSize({width:960,height:640});await page.goto('http://127.0.0.1:8080/?test=1');
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:90000});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 await page.waitForFunction(()=>schoolTour.getState().character.modelStatus==='ready',null,{timeout:60000});
 const rooms=[];
 for(const id of ['4F_6-4','4F_6-6','2F_SCIENCE']){
  await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption(id);await page.locator('#방이동').click();
  await page.waitForFunction(id=>schoolTour.getClassTeacherStates().some(t=>t.roomId===id&&t.modelStatus==='ready'&&t.distance>.15&&t.preparation?.processing==='worker'),id,{timeout:60000});
  const state=await page.evaluate(id=>({id,teacher:schoolTour.getClassTeacherStates().find(t=>t.roomId===id),cached:schoolTour.getClassTeacherStates().filter(t=>t.modelStatus==='ready').length}),id);
  if(state.cached>2)throw Error('Teacher model cache exceeded');
  if(state.teacher.preparation?.processing!=='worker')throw Error('Teacher filtering blocked the game thread');
  if(!(await page.evaluate(()=>schoolTour.getPerformanceState().shadowAutoUpdate)))throw Error('Walking shadows not restored');rooms.push(state);
  await page.screenshot({path:'output/matte-game-'+id+'.png'});
 }
 await page.keyboard.press('v');
 await page.waitForFunction(()=>schoolTour.getState().mode==='overview'&&!schoolTour.getPerformanceState().shadowAutoUpdate);
 if((await page.evaluate(()=>schoolTour.getClassTeacherStates())).some(t=>t.visible))throw Error('Teacher stayed visible in aerial view');
 if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));
 return {ok:true,rooms,errors,failed};
}
