async main=>{
 await main.goto('about:blank');const results=[];
 for(const mobile of [false,true]){
  const context=await main.context().browser().newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>localStorage.setItem('석암-RockOn-기록-v1',JSON.stringify({version:1,stamps:48,bestRound:4,wins:0,awards:[]})));
  try{
   await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});
   const click=s=>mobile?page.locator(s).tap():page.locator(s).click();await click('#레이싱시작');await click('[data-car="field-champion"]');await click('#레이스출발');
   await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing',null,{timeout:45000});
   const cdp=mobile?await context.newCDPSession(page):null,point=async(s,id)=>{const b=await page.locator(s).boundingBox();return {id,x:b.x+b.width/2,y:b.y+b.height/2};};
   const gas=mobile?await point('[data-race-hold=gas]',1):null,boost=mobile?await point('[data-race-hold=boost]',2):null;
   if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas]});else await page.keyboard.down('w');
   await page.waitForFunction(()=>schoolTour.getRacingState().speed>4);
   if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,boost]});else await page.keyboard.down('Shift');
   await page.waitForFunction(()=>schoolTour.getRacingState().effects.playerVisible&&schoolTour.getRacingState().boost<.98&&document.querySelector('#부스트계기').dataset.boost==='active');
   await page.waitForFunction(()=>schoolTour.getRacingState().time>1.2&&schoolTour.getRacingState().effects.playerVisible);
   await page.screenshot({path:`output/boost-${mobile?'mobile':'pc'}.png`});
   const state=await page.evaluate(()=>({boost:schoolTour.getRacingState().boost,effects:schoolTour.getRacingState().effects,percent:document.querySelector('#레이스부스트잔량').textContent,barHeight:document.querySelector('#레이스부스트').getBoundingClientRect().height}));
   if(state.barHeight<18||state.percent==='100%')throw Error('Gauge not enlarged or not updating');
   if(!mobile&&!(await page.locator('.레이스키안내').innerText()).includes('Space'))throw Error('Brake key missing');
   if(mobile){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const brake=await point('[data-race-hold=brake]',3);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[brake]});}
   else await page.keyboard.down('Space');
   await page.waitForFunction(()=>Math.abs(schoolTour.getRacingState().speed)<2&&!schoolTour.getRacingState().effects.playerVisible);
   if(mobile)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else{await page.keyboard.up('Space');await page.keyboard.up('Shift');await page.keyboard.up('w');}
   await page.waitForFunction(()=>!schoolTour.getRacingState().effects.playerVisible);await click('#레이스일시정지');await page.waitForFunction(()=>!schoolTour.getRacingState().effects.visible);
   await click('#레이스다음');
   if(mobile){await page.setViewportSize({width:844,height:390});await page.screenshot({path:'output/boost-mobile-landscape.png'});}
   const layout=await page.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};},gauge=rect('.레이스계기'),footer=rect('.레이스키안내'),map=rect('#레이스트랙지도'),touch=rect('.레이스터치');
    const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
    return {overflow:document.documentElement.scrollWidth>innerWidth,gauge,footer,overlap:overlap(gauge,footer)||overlap(gauge,map)||(matchMedia('(pointer:coarse)').matches&&overlap(gauge,touch))};
   });if(layout.overflow||layout.overlap)throw Error('HUD overlap: '+JSON.stringify(layout));
   await click('#레이스종료');if(await page.evaluate(()=>schoolTour.getRacingState().effects.visible))throw Error('Flames remained after exit');
   if(errors.length)throw Error(errors.join('\n'));results.push({mobile,state,layout,releasePauseExit:true,errors});
  }finally{await context.close();}
 }return {ok:true,results};
}
