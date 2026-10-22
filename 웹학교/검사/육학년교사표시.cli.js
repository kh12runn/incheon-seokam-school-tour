async page=>{
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push(r.url());});
 await page.route('**/*',async route=>{
  if(!decodeURI(new URL(route.request().url()).pathname).endsWith('/웹학교/게임.mjs'))return route.continue();
  const response=await route.fetch();let source=await response.text();
  source=source.replace('function frame(now){','function frame(now){if(window.pauseTeacherProbe)return;');
  await route.fulfill({response,body:source+'\nwindow.teacherProbe={classTeachers,scene,camera,renderer,THREE,resume(){window.pauseTeacherProbe=false;requestAnimationFrame(frame);}};'});
 });
 await page.setViewportSize({width:1100,height:720});await page.goto('http://127.0.0.1:8080/?test=1');
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:90000});
 if((await page.evaluate(()=>schoolTour.getClassTeacherStates())).some(t=>t.modelStatus!=='not-requested'))throw Error('Unexpected startup downloads');
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 await page.waitForFunction(()=>schoolTour.getState().character.modelStatus==='ready',null,{timeout:60000});
 const checks=[];
 for(let i=0;i<8;i++){
  const started=await page.evaluate(i=>{
   const c=teacherProbe.classTeachers.teachers[i].config;
   schoolTour.test.setPosition({...c.position,y:1.5});return performance.now();
  },i);
  await page.waitForFunction(i=>{const t=schoolTour.getClassTeacherStates()[i];return t.visible&&t.hasModel&&t.modelStatus==='ready';},i,{timeout:60000});
  const before=await page.evaluate(i=>schoolTour.getClassTeacherStates()[i].distance,i);
  await page.waitForFunction(({i,before})=>schoolTour.getClassTeacherStates()[i].distance>before+.45,{i,before},{timeout:30000});
  const check=await page.evaluate(({i,started})=>{
   window.pauseTeacherProbe=true;
   const {classTeachers,scene,camera,renderer,THREE:T}=teacherProbe,t=classTeachers.teachers[i],p=t.root.position;
   const state=t.getState();let drawn=0,meshes=0;
   t.root.traverse(o=>{if(o.isMesh){meshes++;o.onAfterRender=()=>drawn++;}});
   // Actual room scene, camera on a clear interior side (not through a wall).
   camera.position.set(p.x+2,p.y+1.4,p.z+1.4);camera.lookAt(p.x,p.y+.9,p.z);camera.updateMatrixWorld();renderer.render(scene,camera);
   const bounds=new T.Box3();for(const child of t.root.children)if(!child.isSprite)bounds.expandByObject(child);
   const size=bounds.getSize(new T.Vector3());
   const cached=classTeachers.getStates().filter(t=>t.hasModel).length;
   if(!meshes||!drawn||size.y<t.config.height-.15||size.y>t.config.height+.08||cached>2)throw Error('Teacher not rendered: '+JSON.stringify({i,meshes,drawn,size,cached}));
   return {roomId:state.roomId,hasModel:state.hasModel,readyMs:performance.now()-started,preparation:state.preparation,meshes,drawn,height:size.y,configuredHeight:t.config.height,distance:state.distance,cached};
  },{i,started});checks.push(check);
  await page.screenshot({path:'output/restored-'+check.roomId+'.png'});
  await page.evaluate(()=>teacherProbe.resume());
 }
 await page.waitForFunction(()=>schoolTour.getClassTeacherStates()[7].preparation?.processing==='worker',null,{timeout:90000});
 await page.keyboard.press('v');await page.waitForFunction(()=>schoolTour.getState().mode==='overview'&&schoolTour.getClassTeacherStates().every(t=>!t.visible));
 if((await page.evaluate(()=>schoolTour.getClassTeacherStates())).some(t=>t.visible))throw Error('Teachers stayed visible in aerial view');
 await page.unroute('**/*');if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));
 return {ok:true,checks,finalWorkerFinished:true,errors,failed};
}
