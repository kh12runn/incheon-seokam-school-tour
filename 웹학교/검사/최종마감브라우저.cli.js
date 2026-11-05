async page=>{
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push({status:r.status(),url:r.url()});});
 const base='http://127.0.0.1:8082';
 await page.setViewportSize({width:1100,height:740});await page.goto(base+'/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:150000});
 const aerial=await page.evaluate(()=>schoolTour.getPerformanceState());await page.screenshot({path:'output/final-aerial.png'});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 const rooms=[];
 for(const id of ['2F_STAFF','2F_BROADCAST','2F_OPERATIONS_MEETING','4F_GRADE6_RESEARCH','3F_BOOK_LIBRARY','2F_SCIENCE','4F_6-6','4F_6-7','2F_PRINCIPAL']){
  await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption(id);await page.locator('#방이동').click();
  if(['2F_SCIENCE','4F_6-6','4F_6-7'].includes(id))await page.waitForFunction(id=>schoolTour.getClassTeacherStates().some(t=>t.roomId===id&&t.modelStatus==='ready'),id,{timeout:150000});
  if(id==='2F_PRINCIPAL')await page.waitForFunction(()=>schoolTour.getPrincipalState().modelStatus==='ready',null,{timeout:150000});
  rooms.push({id,...await page.evaluate(()=>schoolTour.getPerformanceState())});await page.screenshot({path:'output/final-'+id+'.png'});
 }
 const stairs=await page.evaluate(()=>schoolTour.test.world.stairs.map(s=>({id:s.id,frame:s.frame})));
 for(const s of stairs){await page.evaluate(s=>{const f=s.frame,p={x:f.origin[0]+f.right[0]*1.2+f.inward[0]*.55,y:f.origin[1]+f.right[1]*1.2+f.inward[1]*.55,z:0};schoolTour.test.setPosition(p);schoolTour.test.setYaw(Math.atan2(-f.inward[0],f.inward[1]));},s);await page.waitForTimeout(350);await page.screenshot({path:'output/final-stair-'+s.id+'.png'});}
 for(const p of [{name:'main-end',x:1.4,y:1.5,z:10.2,yaw:-Math.PI/2},{name:'connector',x:101.5,y:-8,z:6.8,yaw:Math.PI},{name:'annex-end',x:101.5,y:-71,z:3.4,yaw:Math.PI}]){
  await page.evaluate(p=>{schoolTour.test.setPosition(p);schoolTour.test.setYaw(p.yaw);},p);await page.waitForTimeout(350);await page.screenshot({path:'output/final-'+p.name+'.png'});
 }
 // Actual browser input, with two touch pointers rather than mouse dragging.
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await page.goto(base+'/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:150000});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();await page.waitForFunction(()=>schoolTour.getState().touch.visible);
 await page.evaluate(()=>schoolTour.test.setPosition({x:75,y:1.5,z:10.2}));
 const box=await page.locator('#이동패드').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 const before=await page.evaluate(()=>schoolTour.getState());const fingers=new Map();
 async function touch(type,id,p){if(type==='touchEnd')fingers.delete(id);else fingers.set(id,{id,...p,radiusX:5,radiusY:5,force:1});await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...fingers.values()]});}
 await touch('touchStart',1,{x,y});await touch('touchMove',1,{x:x+30,y});await touch('touchStart',2,{x:300,y:370});await touch('touchMove',2,{x:335,y:350});await page.waitForTimeout(450);
 const moving=await page.evaluate(()=>schoolTour.getState());await touch('touchEnd',2);await touch('touchEnd',1);
 if(Math.hypot(moving.position.x-before.position.x,moving.position.y-before.position.y)<.1||Math.abs(moving.yaw-before.yaw)<.02)throw Error('Mobile movement/look failed');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.screenshot({path:'output/final-mobile.png'});
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.send('Emulation.clearDeviceMetricsOverride');await cdp.detach();
 if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));return{ok:true,aerial,rooms,stairs:stairs.map(s=>s.id),mobile:{joystick:true,simultaneousLook:true,noOverflow:true},errors,failed};
}
