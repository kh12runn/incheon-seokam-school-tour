async main=>{
 await main.goto('about:blank');const reports=[];
 for(const mobile of [false,true]){
  const context=await main.context().browser().newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});
   const click=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
   await click('#레이싱시작');if(await page.locator('#레이스소리').getAttribute('aria-pressed')!=='true')throw Error('Sound must default on');
   await click('#레이스출발');await page.waitForFunction(()=>schoolTour.getRacingState().audio.events.start===1,null,{timeout:45000});
   await page.waitForFunction(()=>schoolTour.getRacingState().audio.rms>.001,null,{timeout:15000});
   const before=await page.evaluate(()=>schoolTour.getRacingState().audio);
   const cdp=mobile?await context.newCDPSession(page):null;
   if(mobile){const b=await page.locator('[data-race-hold=gas]').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:b.x+b.width/2,y:b.y+b.height/2}]});}else await page.keyboard.down('w');
   await page.waitForFunction(()=>schoolTour.getRacingState().speed>4,null,{timeout:20000});
   const driving=await page.evaluate(()=>schoolTour.getRacingState().audio);
   if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.keyboard.up('w');
   if(Math.abs(driving.frequency-before.frequency)<1)throw Error('Engine pitch unchanged');
   await click('#레이스소리');await page.waitForFunction(()=>{const a=schoolTour.getRacingState().audio;return !a.enabled&&!a.active&&a.voices===0;});
   await click('#레이스일시정지');await click('#레이스다음');if(await page.locator('#레이스소리').getAttribute('aria-pressed')!=='false')throw Error('Resume ignored mute choice');
   await click('#레이스소리');await page.waitForFunction(()=>schoolTour.getRacingState().audio.rms>.001);
   await click('#레이스일시정지');await page.waitForFunction(()=>!schoolTour.getRacingState().audio.active&&schoolTour.getRacingState().audio.voices===0);
   await click('#레이스다음');await page.waitForFunction(()=>schoolTour.getRacingState().audio.active);
   await page.screenshot({path:`output/race-audio-${mobile?'mobile':'pc'}.png`});
   const running=await page.evaluate(()=>schoolTour.getRacingState().audio);
   await click('#레이스종료');await page.waitForFunction(()=>{const a=schoolTour.getRacingState().audio;return !a.active&&a.voices===0&&a.context==='suspended';});
   if(errors.length)throw Error(errors.join('\n'));
   reports.push({mobile,automaticStart:before,driving,peakVoices:running.peakVoices,mutePauseExit:true,errors});
  }finally{await context.close();}
 }
 return reports;
}
