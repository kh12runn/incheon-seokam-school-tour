async page=>{
 const context=await page.context().browser().newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const cdp=await context.newCDPSession(page);
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 async function tap(selector){await page.locator(selector).waitFor({state:'visible',timeout:30000});await page.waitForFunction(s=>!document.querySelector(s).disabled,selector,{timeout:120000});const b=await page.locator(selector).boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:3,x:b.x+b.width/2,y:b.y+b.height/2,radiusX:5,radiusY:5,force:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 try{
  await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:120000});
  const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));if(viewport.width!==390)throw Error(`Unexpected viewport ${JSON.stringify(viewport)}`);
  const graphics=await page.evaluate(()=>schoolTour.getState().graphics);if(graphics.shadows||graphics.pixelRatio>1.25)throw Error('Existing mobile rendering profile was not applied');await page.screenshot({path:'output/mission-mobile-start.png'});
  await tap('#퀴즈시작');await tap('#캐릭터확인');await page.waitForFunction(()=>schoolTour.getMissionState().phase==='search'&&schoolTour.getState().touch.visible,null,{timeout:120000});
  const b=await page.locator('#이동패드').boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2,before=await page.evaluate(()=>schoolTour.getState());
  const fingers=new Map();async function touch(type,id,p){if(type==='touchEnd')fingers.delete(id);else fingers.set(id,{id,...p,radiusX:5,radiusY:5,force:1});await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...fingers.values()]});}
  await touch('touchStart',1,{x,y});await touch('touchMove',1,{x:x+30,y});await touch('touchStart',2,{x:300,y:400});await touch('touchMove',2,{x:335,y:380});await page.waitForTimeout(450);const moving=await page.evaluate(()=>schoolTour.getState());await touch('touchEnd',2);await touch('touchEnd',1);
  if(Math.hypot(moving.position.x-before.position.x,moving.position.y-before.position.y)<.1||Math.abs(moving.yaw-before.yaw)<.02)throw Error(`Mobile joystick/look failed ${JSON.stringify({before,moving,target:await page.evaluate(()=>document.elementFromPoint(300,400)?.outerHTML.slice(0,200))})}`);
  await page.screenshot({path:'output/mission-mobile-search.png'});
  await page.evaluate(()=>schoolTour.test.setPosition(schoolTour.test.missionDebug().item));await page.waitForFunction(()=>schoolTour.getMissionState().phase==='teacher');const id=await page.evaluate(()=>schoolTour.getMissionState().teacher.id);
  await page.evaluate(()=>{const r=schoolTour.test.missionDebug().routes[1];schoolTour.test.setPosition(r[r.length-1]);});await page.waitForFunction(id=>schoolTour.getClassTeacherStates().find(n=>n.id===id)?.modelStatus==='ready',id,{timeout:150000});
  await page.evaluate(async id=>{const t=schoolTour.getClassTeacherStates().find(n=>n.id===id),w=schoolTour.test.world,{principalCanGreet}=await import('/웹학교/교장선생님인사.mjs');for(let a=0;a<6.3;a+=.2){const p={x:t.position.x+Math.cos(a)*1.5,y:t.position.y+Math.sin(a)*1.5,z:t.position.z};if(w.candidate(p.x,p.y,p.z)&&principalCanGreet(p,t.position,{colliders:w.colliders})){schoolTour.test.setPosition(p);schoolTour.test.setYaw(Math.atan2(p.x-t.position.x,t.position.y-p.y));return;}}throw Error('No teacher approach');},id);
  await page.locator('#탐험퀴즈말풍선').waitFor({state:'visible'});await page.screenshot({path:'output/mission-mobile-quiz.png'});
  const hud=await page.locator('#미션안내').boundingBox(),bubble=await page.locator('#탐험퀴즈말풍선').boundingBox();if(bubble.y<hud.y+hud.height)throw Error('Mobile quiz overlaps mission HUD');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
  const correct=await page.evaluate(()=>schoolTour.test.missionDebug().correct);await tap(`[data-choice="${correct}"]`);await page.waitForFunction(()=>schoolTour.getMissionState().stamps===1);
  if(errors.length)throw Error(JSON.stringify(errors));return{ok:true,joystick:true,simultaneousLook:true,touchAnswer:true,noOverflow:true,noHUDOverlap:true,graphics,errors};
 }finally{await cdp.detach();await context.close();}
}
