async main=>{
 await main.goto('about:blank');const context=await main.context().browser().newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await context.addInitScript(()=>localStorage.setItem('석암-RockOn-기록-v1',JSON.stringify({version:1,stamps:0,bestRound:3,wins:0,awards:[]})));
 await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});
 await page.locator('#레이싱시작').tap();await page.locator('#레이스라운드').selectOption('4');await page.screenshot({path:'output/race-mobile-garage.png'});await page.locator('#레이스출발').tap();await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing',null,{timeout:40000});
 const course=await page.evaluate(()=>schoolTour.getRacingState().course);
 if(course.direction!==-1||await page.locator('#레이스트랙지도').getAttribute('data-course')!==course.id)throw Error('Mobile reverse-round map mismatch');
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const center=async selector=>{const b=await page.locator(selector).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};};
 const gas=await center('[data-race-hold=gas]'),right=await center('[data-race-hold=right]');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...gas}]});await page.waitForFunction(()=>schoolTour.getRacingState().speed>5,null,{timeout:30000});
 const a=await page.evaluate(()=>schoolTour.getRacingState());
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...gas},{id:2,...right}]});await page.waitForFunction(a=>{const b=schoolTour.getRacingState(),p=b.cars[0],q=a.cars[0];return Math.hypot(p.x-q.x,p.z-q.z)>.1&&Math.abs(Math.atan2(Math.sin(p.yaw-q.yaw),Math.cos(p.yaw-q.yaw)))>.15;},a,{timeout:15000});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const b=await page.evaluate(()=>schoolTour.getRacingState());if(Math.hypot(b.cars[0].x-a.cars[0].x,b.cars[0].z-a.cars[0].z)<.1)throw Error('Two-finger throttle/steering failed');
 await page.locator('#레이스복귀').tap();const reverse=await center('[data-race-hold=reverse]');await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:3,...reverse}]});await page.waitForFunction(()=>schoolTour.getRacingState().speed<-.5,null,{timeout:15000});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.screenshot({path:'output/race-mobile-driving.png'});await page.locator('#레이스일시정지').tap();const t=await page.evaluate(()=>schoolTour.getRacingState().time);await page.waitForTimeout(500);if(t!==await page.evaluate(()=>schoolTour.getRacingState().time))throw Error('Pause failed');await page.locator('#레이스다음').tap();
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:'output/race-mobile-landscape.png'});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');await page.locator('#레이스종료').tap();if(await page.evaluate(()=>schoolTour.getState().mode)!=='overview'||await page.evaluate(()=>schoolTour.getRacePassageState().open))throw Error('Exit failed');
 if(errors.length)throw Error(errors.join('\n'));return {ok:true,course,multitouch:true,reverse:true,pause:true,landscape:true,errors};
 }finally{await context.close();}
}
