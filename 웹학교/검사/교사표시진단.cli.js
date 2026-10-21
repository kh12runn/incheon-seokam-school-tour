async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  if(!decodeURI(new URL(route.request().url()).pathname).endsWith('/웹학교/게임.mjs'))return route.continue();
  const response=await route.fetch();let source=await response.text();
  source=source.replace('function frame(now){','function frame(now){if(window.pauseTeacherProbe)return;');
  await route.fulfill({response,body:source+'\nwindow.teacherProbe={classTeachers,scene,camera,renderer,THREE};'});
 });
 await page.setViewportSize({width:1100,height:720});await page.goto('http://127.0.0.1:8080/?test=1');
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:90000});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 await page.waitForFunction(()=>schoolTour.getState().character.modelStatus==='ready',null,{timeout:60000});
 await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption('4F_6-4');await page.locator('#방이동').click();
 const entered=await page.evaluate(()=>({time:performance.now(),state:schoolTour.getClassTeacherStates()[3]}));
 await page.screenshot({path:'output/teacher-missing-entry.png'});
 await page.waitForFunction(()=>schoolTour.getClassTeacherStates()[3].modelStatus==='ready',null,{timeout:90000});
 const diagnostics=await page.evaluate(()=>{
  window.pauseTeacherProbe=true;
  const {classTeachers,scene,camera,renderer,THREE:T}=teacherProbe,t=classTeachers.teachers[3];
  t.root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(t.root),size=bounds.getSize(new T.Vector3());
  const meshes=[];t.root.traverse(o=>{if(o.isMesh)meshes.push({name:o.name,vertices:o.geometry.attributes.position.count,visible:o.visible,opacity:o.material.opacity,transparent:o.material.transparent,bounds:o.geometry.boundingBox});});
  const p=t.root.position;camera.position.set(p.x-3,p.y+1.45,p.z-2);camera.lookAt(p.x,p.y+.9,p.z);camera.updateMatrixWorld();
  renderer.render(scene,camera);
  return {time:performance.now(),state:t.getState(),position:p.toArray(),bounds:{min:bounds.min.toArray(),max:bounds.max.toArray(),size:size.toArray()},meshes};
 });
 await page.screenshot({path:'output/teacher-missing-ready.png'});await page.unroute('**/*');
 return {entered,diagnostics,errors};
}
