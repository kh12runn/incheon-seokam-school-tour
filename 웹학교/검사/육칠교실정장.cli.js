async page=>{
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push(r.url());});
 await page.route('**/*',async route=>{if(!decodeURI(new URL(route.request().url()).pathname).endsWith('/웹학교/게임.mjs'))return route.continue();const response=await route.fetch(),source=await response.text();await route.fulfill({response,body:source.replace('function frame(now){','function frame(now){if(window.pauseTeacherProbe)return;')+'\nwindow.teacherProbe={classTeachers,scene,camera,renderer,THREE};'});});
 await page.setViewportSize({width:1200,height:800});await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:120000});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();await page.waitForFunction(()=>schoolTour.getState().mode==='walk',null,{timeout:90000});
 await page.evaluate(()=>schoolTour.test.setPosition({x:2.6,y:1.5,z:10.2}));await page.waitForFunction(()=>schoolTour.getClassTeacherStates()[6].modelStatus==='ready',null,{timeout:120000});
 const before=await page.evaluate(()=>schoolTour.getClassTeacherStates()[6].distance);await page.waitForFunction(b=>schoolTour.getClassTeacherStates()[6].distance>b+.6,before,{timeout:30000});
 const state=await page.evaluate(()=>{window.pauseTeacherProbe=true;const {classTeachers,scene,camera,renderer}=teacherProbe,t=classTeachers.teachers[6],p=t.root.position;camera.position.set(p.x+1.5,p.y+1.25,p.z+1.6);camera.lookAt(p.x,p.y+.95,p.z);renderer.render(scene,camera);return t.getState();});
 await page.screenshot({path:'output/6-7-suit-classroom.png'});await page.unroute('**/*');if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));return {ok:true,state,errors,failed};
}
