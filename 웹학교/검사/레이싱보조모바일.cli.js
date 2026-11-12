async main=>{
 // Keep the configured development session; all touch/storage changes belong
 // to this isolated context, which is closed even when an assertion fails.
 await main.goto('about:blank');
 const context=await main.context().browser().newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 let cdp;
 try{
  await page.goto('http://127.0.0.1:8080/?test=1');
  await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});
  await page.locator('#레이싱시작').tap();
  if(/탈출|보조/.test(await page.locator('.레이스도움').textContent()))throw Error('Technical assist instructions remain in the garage');
  await page.locator('[data-car="field-sedan-black"]').tap();
  await page.locator('#레이스출발').tap();
  await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing',null,{timeout:40000});
  cdp=await context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  const center=async selector=>{
   const box=await page.locator(selector).boundingBox();if(!box)throw Error('Missing mobile control: '+selector);
   return {x:box.x+box.width/2,y:box.y+box.height/2};
  };
  const controls=()=>page.evaluate(()=>{
   const elements=[...document.querySelectorAll('#레이싱 [data-race-hold],#레이스복귀,#레이스소리,#레이스일시정지,#레이스종료')];
   const boxes=elements.map(element=>{const b=element.getBoundingClientRect();return {name:element.dataset.raceHold||element.id,x:b.x,y:b.y,width:b.width,height:b.height,clickable:element.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))};});
   for(const b of boxes){
    if(b.width<=0||b.height<=0||b.x<-.5||b.y<-.5||b.x+b.width>innerWidth+.5||b.y+b.height>innerHeight+.5)throw Error('Mobile control outside viewport: '+JSON.stringify(b));
    if(!b.clickable)throw Error('Mobile control obscured: '+b.name);
   }
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j],w=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),h=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
    if(w>1&&h>1)throw Error('Overlapping mobile controls: '+a.name+' / '+b.name);
   }
   if(document.documentElement.scrollWidth>innerWidth)throw Error('Horizontal overflow');
   return {viewport:{width:innerWidth,height:innerHeight},boxes};
  });
  const portrait=await controls();
  const initial=await page.evaluate(async()=>{
   const config=(await import('/웹학교/레이싱물리.mjs')).RACE_ASSIST_CONFIG;
   const race=schoolTour.test.raceDebug(),p=race.player;
   // Reproduce the actual blocked corner; no synthetic update/teleport occurs
   // during the following five seconds of real touch + animation-loop input.
   window.__placeRaceAssistFixture=()=>{
    Object.assign(p,{x:79.171869,z:61.5,yaw:-Math.PI/2,s:42.4997,checkpoint:3,nextCheckpoint:4,started:true,speed:0,wall:.6,steering:0,sideSpeed:0,hit:0,finish:null,assistStrength:0,contact:0,obstacleContact:0,assistActive:false});
    for(const car of race.cars.slice(1)){car.finish=0;car.speed=0;}
    return {x:p.x,z:p.z,s:p.s,time:race.view().time,expectedLimit:p.profile.speed*config.speedRatio,expectedStrength:config.maxStrength,resetSerial:p.resetSerial};
   };
   window.__raceAssistTouchEvents=[];
   for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,event=>{
    const hold=event.target.closest?.('[data-race-hold]')?.dataset.raceHold;if(hold)window.__raceAssistTouchEvents.push({type,hold,id:event.pointerId,pointerType:event.pointerType,time:race.view().time});
   },true);
   return window.__placeRaceAssistFixture();
  });
  // This corner turns left. A wrong-way right turn can leave the contact but
  // should not be expected to advance along the course automatically.
  const gas=await center('[data-race-hold=gas]'),left=await center('[data-race-hold=left]');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...gas},{id:2,...left}]});
  await page.evaluate(()=>{
   window.__startRaceAssistProbe=()=>{
   const start=schoolTour.getRacingState().time,probe={done:false,samples:[],error:null};window.__raceAssistProbe=probe;
   const sample=()=>{
    try{
     const race=schoolTour.test.raceDebug(),v=race.view(),p=race.player;
     if(typeof v.assistActive!=='boolean'||!Number.isFinite(v.assistSpeedLimit)||!Number.isFinite(p.assistStrength))throw Error('Missing steering assistance diagnostics');
     const message=document.getElementById('레이스알림').textContent;if(/탈출|보조/.test(message))throw Error('Technical assist message appeared: '+message);
     probe.samples.push({time:v.time,x:p.x,z:p.z,s:p.s,yaw:p.yaw,steering:p.steering,speed:p.speed,active:v.assistActive,reason:v.assistReason,wall:p.wall,contact:p.contact,obstacleContact:p.obstacleContact,hit:p.hit,limit:v.assistSpeedLimit,strength:p.assistStrength,resetSerial:p.resetSerial,held:[...document.querySelectorAll('#레이싱 [data-race-hold].눌림')].map(button=>button.dataset.raceHold),hidden:document.hidden,focused:document.hasFocus()});
     if(v.time-start>=5){probe.done=true;return;}
     requestAnimationFrame(sample);
    }catch(error){probe.error=error.message;probe.done=true;}
   };requestAnimationFrame(sample);
   };window.__startRaceAssistProbe();
  });
  await page.waitForFunction(()=>window.__raceAssistProbe?.done,null,{timeout:90000});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const probe=await page.evaluate(()=>({...window.__raceAssistProbe,touchEvents:window.__raceAssistTouchEvents}));
  if(probe.error)throw Error(probe.error);
  const last=probe.samples.at(-1),active=probe.samples.filter(s=>s.active);
  const distance=Math.hypot(last.x-initial.x,last.z-initial.z),advance=last.s-initial.s;
  const maxStrength=Math.max(...probe.samples.map(s=>s.strength)),maxEscape=Math.max(...probe.samples.map(s=>Math.hypot(s.x-initial.x,s.z-initial.z)));
  const escaped=probe.samples.find(s=>Math.hypot(s.x-initial.x,s.z-initial.z)>4&&s.s-initial.s>2);
  const maxStep=Math.max(...probe.samples.map((s,i,list)=>i?Math.hypot(s.x-list[i-1].x,s.z-list[i-1].z):0));
  const seconds=probe.samples.filter((s,i,list)=>i===0||Math.floor(s.time-list[0].time)>Math.floor(list[i-1].time-list[0].time));
  if(probe.samples.some(s=>!s.held.includes('gas')||!s.held.includes('left')))throw Error('Touch hold lost during escape: '+JSON.stringify({touchEvents:probe.touchEvents,seconds,last}));
  // Continued full steering legitimately circles back. Require a real forward
  // escape during the five-second trace, not automatic straightening afterward.
  if(!escaped)throw Error('Touch corner escape failed: '+JSON.stringify({distance,advance,maxEscape,maxStrength,simulatedSeconds:last.time-probe.samples[0].time,initial,last,touchEvents:probe.touchEvents,seconds}));
  if(maxStep>1.2||probe.samples.some(s=>s.resetSerial!==initial.resetSerial))throw Error('Contact assist teleported or reset the player');
  if(!active.length)throw Error('Contact steering assistance never activated');
  if(probe.samples.some(s=>s.strength<0||s.strength>initial.expectedStrength+.000001))throw Error('Assistance strength exceeded the configured maximum');
  if(probe.samples.some(s=>Math.abs(s.limit-initial.expectedLimit)>.000001))throw Error('Assistance speed limit differs from the configured fraction of car speed');
  if(active.some(s=>Math.abs(s.speed)>s.limit+.12))throw Error('Contact assistance exceeded its low-speed limit');
  await page.screenshot({path:'output/race-assist-mobile-portrait.png'});

  // The same contact must also clear with the gas pedal alone, without an
  // invisible steering touch or a test-driver correction.
  const soloInitial=await page.evaluate(()=>window.__placeRaceAssistFixture());
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:5,...await center('[data-race-hold=gas]')}]});
  await page.evaluate(()=>window.__startRaceAssistProbe());
  await page.waitForFunction(()=>window.__raceAssistProbe?.done,null,{timeout:90000});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const solo=await page.evaluate(()=>window.__raceAssistProbe);
  if(solo.error)throw Error(solo.error);
  const soloEscape=solo.samples.find(s=>Math.hypot(s.x-soloInitial.x,s.z-soloInitial.z)>4&&s.s-soloInitial.s>2);
  if(!soloEscape||!solo.samples.some(s=>s.active))throw Error('Gas-only touch did not escape the contact');
  if(solo.samples.some(s=>s.held.length!==1||s.held[0]!=='gas'))throw Error('Gas-only fixture had an extra or missing touch');
  if(solo.samples.some(s=>s.strength>soloInitial.expectedStrength+.000001||Math.abs(s.limit-soloInitial.expectedLimit)>.000001||s.active&&Math.abs(s.speed)>s.limit+.12||s.resetSerial!==soloInitial.resetSerial))throw Error('Gas-only assist exceeded the configured limits or reset the player');
  const soloMaxStep=Math.max(...solo.samples.map((s,i,list)=>i?Math.hypot(s.x-list[i-1].x,s.z-list[i-1].z):0));
  if(soloMaxStep>1.2)throw Error('Gas-only assistance teleported the player');
  await page.screenshot({path:'output/race-assist-mobile-gas-only.png'});

  // Use the visible recovery button to get a clear braking lane, then exercise
  // the separate touch brake against measured forward motion.
  await page.locator('#레이스복귀').tap();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:3,...await center('[data-race-hold=gas]')}]});
  await page.waitForFunction(()=>schoolTour.getRacingState().speed>3,null,{timeout:15000});
  const beforeBrake=await page.evaluate(()=>schoolTour.getRacingState().speed);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:4,...await center('[data-race-hold=brake]')}]});
  await page.waitForFunction(()=>Math.abs(schoolTour.getRacingState().speed)<.1,null,{timeout:15000});
  const afterBrake=await page.evaluate(()=>schoolTour.getRacingState().speed);
  if(await page.evaluate(()=>schoolTour.getRacingState().assistActive))throw Error('Brake did not disable contact assistance');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});

  await page.setViewportSize({width:844,height:390});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const landscape=await controls();
  await page.screenshot({path:'output/race-assist-mobile-landscape.png'});
  await page.locator('#레이스종료').tap();
  if(await page.evaluate(()=>schoolTour.getState().mode)!=='overview'||await page.evaluate(()=>schoolTour.getRacePassageState().open))throw Error('Race exit did not restore school');
  if(errors.length)throw Error(errors.join('\n'));
  return {ok:true,distance,advance,maxEscape,maxStep,escaped:{time:escaped.time-initial.time,distance:Math.hypot(escaped.x-initial.x,escaped.z-initial.z),advance:escaped.s-initial.s},gasOnly:{distance:Math.hypot(soloEscape.x-soloInitial.x,soloEscape.z-soloInitial.z),advance:soloEscape.s-soloInitial.s,maxStep:soloMaxStep},technicalHintsAbsent:true,assistFrames:active.length,maxStrength,simulatedSeconds:last.time-probe.samples[0].time,assistSpeedLimit:initial.expectedLimit,touchEvents:probe.touchEvents,beforeBrake,afterBrake,portrait,landscape,errors};
 }finally{
  if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}).catch(()=>{});
  await context.close();
 }
}
