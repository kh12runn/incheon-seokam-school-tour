async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  if(!decodeURI(new URL(route.request().url()).pathname).endsWith('/웹학교/게임.mjs'))return route.continue();
  const response=await route.fetch();const source=(await response.text()).replace('function frame(now){','function frame(now){if(window.pauseTeacherProbe)return;');
  await route.fulfill({response,body:source+'\nwindow.teacherProbe={classTeachers,scene,camera,renderer,THREE};'});
 });
 await page.setViewportSize({width:1100,height:800});await page.goto('http://127.0.0.1:8080/?test=1');
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:90000});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption('2F_SCIENCE');await page.locator('#방이동').click();
 await page.waitForFunction(()=>schoolTour.getClassTeacherStates().some(t=>t.id==='teacher-science'&&t.modelStatus==='ready'&&t.distance>.15&&t.preparation?.processing==='worker'),null,{timeout:90000});
 const result=await page.evaluate(()=>{
  window.pauseTeacherProbe=true;const {classTeachers,scene,camera,renderer,THREE:T}=teacherProbe,t=classTeachers.teachers.find(t=>t.config.id==='teacher-science');
  for(let i=0;i<60;i++)t.update(.05,null,true);
  t.root.updateMatrixWorld(true);const eye=t.root.localToWorld(new T.Vector3(0,1.35,2.5)),target=t.root.localToWorld(new T.Vector3(0,1.05,0));camera.position.copy(eye);camera.lookAt(target);camera.updateMatrixWorld();
  let drawn=0;t.root.traverse(o=>{if(o.isMesh)o.onAfterRender=()=>drawn++;});renderer.render(scene,camera);
  return {drawn,state:t.getState()};
 });
 await page.screenshot({path:'output/science-corrected-in-room.png'});await page.unroute('**/*');
 if(!result.drawn||errors.length)throw Error(JSON.stringify({result,errors}));return {ok:true,...result,errors};
}
