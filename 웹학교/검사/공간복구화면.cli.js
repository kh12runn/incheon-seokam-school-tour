async page=>{
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))failed.push(r.url());});
 await page.route('**/*',async route=>{if(!decodeURI(new URL(route.request().url()).pathname).endsWith('/웹학교/게임.mjs'))return route.continue();const response=await route.fetch();let source=await response.text();source=source.replace('function frame(now){','function frame(now){if(window.pauseRoomProbe)return;');await route.fulfill({response,body:source+'\nwindow.roomProbe={scene,camera,renderer,THREE,resume(){window.pauseRoomProbe=false;requestAnimationFrame(frame);}};'});});
 await page.setViewportSize({width:1200,height:800});await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>schoolTour?.getState().ready,null,{timeout:90000});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 const checks=[];
 for(const id of ['2F_STAFF','2F_BROADCAST','2F_OPERATIONS_MEETING','2F_SCIENCE','2F_INTELLIGENT_SCIENCE','4F_GRADE6_RESEARCH','1F_NURSE','3F_BOOK_LIBRARY','4F_COMPUTER']){
  await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption(id);await page.locator('#방이동').click();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const c=await page.evaluate(id=>{
   window.pauseRoomProbe=true;const w=schoolTour.test.world,r=w.data.rooms.find(r=>r.id===id),b=r.bounds,{scene,camera,renderer}=roomProbe;
   const centers=[w.classroom64,...w.classroomInteriors,...w.specialInteriors].filter(Boolean),inside=centers.find(c=>(c.roomId??c.room?.id)===id);if(!inside?.boxes.length)throw Error('No furnishing '+id);
   const x=(b[0]+b[1])/2,front=b[2]>=0?b[2]+.6:b[3]-.6,target=b[2]>=0?b[3]-1:b[2]+1;camera.position.set(x,b[4]+1.68,-front);camera.lookAt(x,b[4]+1.25,-target);renderer.render(scene,camera);
   return {id,name:r.name,boxes:inside.boxes.length,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls};
  },id);checks.push(c);await page.screenshot({path:'output/room-check-'+id+'.png'});await page.evaluate(()=>roomProbe.resume());
 }
 await page.unroute('**/*');if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));return {ok:true,checks,errors,failed};
}
