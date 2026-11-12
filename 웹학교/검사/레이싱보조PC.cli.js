async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setViewportSize({width:1365,height:900});await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});
 await page.locator('#레이싱시작').click();await page.locator('#레이스출발').click();await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing');
 // Reproduce the observed outer corner contact. Only fixture placement is
 // synthetic; escape must use document keyboard handlers and animation frames.
 await page.evaluate(()=>{const r=schoolTour.test.raceDebug(),c=r.player;for(const other of r.cars.slice(1))other.finish=0;
  Object.assign(c,{x:79.17186903211827,z:61.5,yaw:-Math.PI/2,s:42.4997,lane:2.138,speed:0,steering:0,wall:.6,hit:0,started:true,checkpoint:3,nextCheckpoint:4});
  window.assistSample={start:{x:c.x,z:c.z,s:c.s},frames:0,maxSpeed:0,minSpeed:Infinity,maxStrength:0,maxEscape:0,maxAdvance:0,escaped:false,startTime:null,done:false};let previous={x:c.x,z:c.z};window.sampleAssist=()=>{const r=schoolTour.test.raceDebug();if(!r)return;const s=r.view(),a=window.assistSample,d=Math.hypot(r.player.x-a.start.x,r.player.z-a.start.z),advance=r.player.s-a.start.s;a.maxEscape=Math.max(a.maxEscape,d);a.maxAdvance=Math.max(a.maxAdvance,advance);if(d>4&&advance>2)a.escaped=true;a.maxStep=Math.max(a.maxStep||0,Math.hypot(r.player.x-previous.x,r.player.z-previous.z));previous={x:r.player.x,z:r.player.z};if(s.assistActive){a.frames++;a.maxSpeed=Math.max(a.maxSpeed,s.speed);a.minSpeed=Math.min(a.minSpeed,s.speed);a.limit=s.assistSpeedLimit;a.maxStrength=Math.max(a.maxStrength,r.player.assistStrength||0);}if(a.startTime!==null&&s.time-a.startTime>=5){a.done=true;a.end=s;return;}requestAnimationFrame(window.sampleAssist);};requestAnimationFrame(window.sampleAssist);
 });
 await page.keyboard.down('KeyW');await page.keyboard.down('KeyA');await page.evaluate(()=>window.assistSample.startTime=schoolTour.getRacingState().time);await page.waitForFunction(()=>schoolTour.getRacingState().assistActive,null,{timeout:15000});await page.screenshot({path:'output/race-assist-active.png'});
 await page.waitForFunction(()=>window.assistSample.done,null,{timeout:45000});await page.keyboard.up('KeyA');await page.keyboard.up('KeyW');
 const escaped=await page.evaluate(()=>({state:window.assistSample.end,sample:window.assistSample})),car=escaped.state.cars[0],sample=escaped.sample;
 if(!sample.escaped)throw Error('Forward/left did not escape the blocked corner');
 if(!sample.frames||sample.maxSpeed>sample.limit+.3||sample.maxStep>1.2)throw Error('Assist speed/continuity failed: '+JSON.stringify(sample));
 await page.keyboard.down('Space');const brakeTime=await page.evaluate(()=>schoolTour.getRacingState().time);await page.waitForFunction(t=>schoolTour.getRacingState().time>t+1,brakeTime);await page.keyboard.up('Space');const stopped=await page.evaluate(()=>schoolTour.getRacingState());if(stopped.assistActive||Math.abs(stopped.speed)>.1)throw Error('Brake did not stop assist');
 await page.screenshot({path:'output/race-assist-escaped.png'});await page.locator('#레이스종료').click();if(errors.length)throw Error(errors.join('\n'));return {ok:true,forwardSteeringEscape:true,moved:sample.maxEscape,sample,brakeStopsAssist:true,errors};
}
