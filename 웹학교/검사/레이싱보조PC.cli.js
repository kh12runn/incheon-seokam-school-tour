async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setViewportSize({width:1365,height:900});await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});
 await page.locator('#레이싱시작').click();
 if(/탈출|보조/.test(await page.locator('.레이스도움').textContent()))throw Error('Technical assist instructions remain in the garage');
 await page.locator('[data-car="field-sedan-black"]').click();await page.locator('#레이스출발').click();await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing');
 const config=await page.evaluate(async()=>({...((await import('/웹학교/레이싱물리.mjs')).RACE_ASSIST_CONFIG)})),cases=[];
 try{
  for(const key of [null,'KeyA','KeyD']){
   // Only fixture placement is synthetic. Keys, RAF, physics and UI remain real.
   await page.evaluate(()=>{
    const r=schoolTour.test.raceDebug(),c=r.player;for(const other of r.cars.slice(1))other.finish=0;
    Object.assign(c,{x:79.17186903211827,z:61.5,yaw:-Math.PI/2,s:42.4997,lane:2.138,speed:0,steering:0,wall:.6,hit:0,started:true,checkpoint:3,nextCheckpoint:4,contact:0,obstacleContact:0,assistStrength:0,assistActive:false});
    const a={start:{x:c.x,z:c.z,s:c.s,resetSerial:c.resetSerial},frames:0,maxSpeed:0,maxStrength:0,maxEscape:0,maxAdvance:0,maxStep:0,escaped:false,startTime:null,done:false,uiMessages:[],normalSpeed:c.profile.speed};window.assistSample=a;let previous={x:c.x,z:c.z};
    const sample=()=>{const r=schoolTour.test.raceDebug();if(!r)return;const s=r.view(),p=r.player,d=Math.hypot(p.x-a.start.x,p.z-a.start.z),advance=p.s-a.start.s;
     a.maxEscape=Math.max(a.maxEscape,d);a.maxAdvance=Math.max(a.maxAdvance,advance);if(d>4&&advance>2)a.escaped=true;
     a.maxStep=Math.max(a.maxStep,Math.hypot(p.x-previous.x,p.z-previous.z));previous={x:p.x,z:p.z};
     const message=document.getElementById('레이스알림').textContent;if(/탈출|보조/.test(message))a.uiMessages.push(message);
     if(s.assistActive){a.frames++;a.maxSpeed=Math.max(a.maxSpeed,Math.abs(s.speed));a.limit=s.assistSpeedLimit;a.maxStrength=Math.max(a.maxStrength,p.assistStrength);}
     if(a.startTime!==null&&s.time-a.startTime>=5){a.done=true;a.end=s;a.resetSerial=p.resetSerial;return;}requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
   });
   await page.keyboard.down('KeyW');if(key)await page.keyboard.down(key);
   await page.evaluate(()=>window.assistSample.startTime=schoolTour.getRacingState().time);
   await page.waitForFunction(()=>schoolTour.getRacingState().assistActive,null,{timeout:15000});
   if(!key)await page.screenshot({path:'output/race-assist-active.png'});
   await page.waitForFunction(()=>window.assistSample.done,null,{timeout:45000});
   if(key)await page.keyboard.up(key);await page.keyboard.up('KeyW');
   const sample=await page.evaluate(()=>window.assistSample);
   // A held right turn may escape backward; respecting it is intentional.
   if(sample.maxEscape<=4||(key!=='KeyD'&&!sample.escaped))throw Error('Contact escape failed: '+JSON.stringify({key,sample}));
   if(!sample.frames||Math.abs(sample.limit-sample.normalSpeed*config.speedRatio)>.000001||sample.maxSpeed>sample.limit+.3||sample.maxStrength>config.maxStrength+.000001||sample.maxStep>1.2||sample.resetSerial!==sample.start.resetSerial)throw Error('Assist speed/strength/continuity failed: '+JSON.stringify(sample));
   if(sample.uiMessages.length)throw Error('Technical assist message appeared: '+sample.uiMessages.join(','));
   await page.keyboard.down('Space');const brakeTime=await page.evaluate(()=>schoolTour.getRacingState().time);await page.waitForFunction(t=>schoolTour.getRacingState().time>t+1,brakeTime);await page.keyboard.up('Space');
   const stopped=await page.evaluate(()=>schoolTour.getRacingState());if(stopped.assistActive||Math.abs(stopped.speed)>.1)throw Error('Brake did not stop assist');
   cases.push({keys:key?'W+'+key:'W',maxEscape:sample.maxEscape,maxAdvance:sample.maxAdvance,maxSpeed:sample.maxSpeed,maxStrength:sample.maxStrength,brakeStopsAssist:true});
  }
  await page.screenshot({path:'output/race-assist-escaped.png'});await page.locator('#레이스종료').click();if(errors.length)throw Error(errors.join('\n'));
  return {ok:true,forwardOnlyEscape:true,userSteeringChoice:true,technicalHintsAbsent:true,config,cases,errors};
 }finally{for(const key of ['KeyW','KeyA','KeyD','Space'])await page.keyboard.up(key).catch(()=>{});}
}
