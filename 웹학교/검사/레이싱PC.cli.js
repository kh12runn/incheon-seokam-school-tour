async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1365,height:900});await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});
 await page.locator('#레이싱시작').click();await page.locator('[data-car="field-lamborghini"]').click();if(!await page.locator('#레이스출발').isDisabled())throw Error('Locked supercar allowed');
 await page.screenshot({path:'output/race-sports.png'});await page.locator('[data-car="field-tucson"]').click();await page.screenshot({path:'output/race-tucson.png'});
 await page.locator('[data-car="field-sedan-black"]').click();await page.locator('#레이스출발').click();await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing');
 const initial=await page.evaluate(()=>schoolTour.getRacingState());if(initial.laps!==3)throw Error('Not three laps');
 await page.keyboard.down('KeyW');await page.waitForFunction(t=>schoolTour.getRacingState().time>t+8,initial.time,{timeout:60000});await page.keyboard.up('KeyW');
 const straight=await page.evaluate(()=>schoolTour.getRacingState());if(Math.abs(straight.cars[0].yaw-initial.cars[0].yaw)>.001||straight.cars[0].lap!==0)throw Error('Throttle automatically followed track');
 await page.keyboard.press('Escape');await page.locator('#레이스재도전').click();await page.waitForFunction(()=>schoolTour.getRacingState().phase==='racing');
 await page.keyboard.down('KeyW');await page.keyboard.down('KeyD');const turnStart=await page.evaluate(()=>schoolTour.getRacingState().time);await page.waitForFunction(t=>schoolTour.getRacingState().time>t+1,turnStart,{timeout:15000});await page.keyboard.up('KeyD');await page.keyboard.up('KeyW');
 const steered=await page.evaluate(()=>schoolTour.getRacingState());if(Math.abs(steered.cars[0].yaw-straight.cars[0].yaw)<.1)throw Error('Steering did not turn car');
 await page.keyboard.press('Escape');await page.locator('#레이스재도전').click();
 // Read-only local diagnostics choose keys. The actual document input handlers,
 // animation loop, physics, finish detection and result UI perform the race.
 await page.evaluate(async()=>{
  const {driverInput}=await import('/웹학교/검사/레이싱테스트조작.mjs');const held=new Set();
  window.__raceKeys=()=>{const r=schoolTour.test.raceDebug();if(!r||r.view().phase==='finished'){for(const code of held)document.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));return;}
   const c=driverInput(r,{digital:true}),wanted=new Set();if(c.throttle>0)wanted.add('KeyW');if(c.throttle<0)wanted.add('KeyS');if(c.steer>0)wanted.add('KeyD');if(c.steer<0)wanted.add('KeyA');if(c.brake)wanted.add('Space');if(c.boost)wanted.add('ShiftLeft');
   for(const key of held)if(!wanted.has(key)){document.dispatchEvent(new KeyboardEvent('keyup',{code:key,bubbles:true}));held.delete(key);}for(const key of wanted)if(!held.has(key)){document.dispatchEvent(new KeyboardEvent('keydown',{code:key,bubbles:true}));held.add(key);}requestAnimationFrame(window.__raceKeys);
  };requestAnimationFrame(window.__raceKeys);
 });
 await page.waitForFunction(()=>schoolTour.getRacingState().phase==='finished',null,{timeout:360000});const first=await page.evaluate(()=>schoolTour.getRacingState());if(!first.won)throw Error('Beginner race lost: '+JSON.stringify(first));if(first.cars[0].lap!==3)throw Error('Three laps did not finish');await page.screenshot({path:'output/race-first-win.png'});
 await page.locator('#레이스다음').click();await page.waitForFunction(()=>schoolTour.getRacingState().round===2);await page.keyboard.press('Escape');const before=await page.evaluate(()=>schoolTour.getRacingState().time);await page.waitForTimeout(500);if(before!==await page.evaluate(()=>schoolTour.getRacingState().time))throw Error('Pause failed');await page.keyboard.press('Escape');await page.locator('#레이스종료').click();
 await page.reload();await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});if((await page.evaluate(()=>schoolTour.getRacingState().progress.bestRound))<1)throw Error('Round record not saved');
 // Test storage in this isolated development browser only. Restore afterward.
 const original=await page.evaluate(()=>localStorage.getItem('석암-RockOn-기록-v1'));
 await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('석암-RockOn-기록-v1'));p.stamps=48;p.bestRound=4;localStorage.setItem('석암-RockOn-기록-v1',JSON.stringify(p));});
 try{await page.reload();await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});await page.locator('#레이싱시작').click();await page.locator('[data-car="field-champion"]').click();if(await page.locator('#레이스출발').isDisabled())throw Error('48 stamps did not unlock');await page.locator('#레이스라운드').selectOption('5');await page.locator('#레이스출발').click();const final=await page.evaluate(()=>schoolTour.getRacingState());if(final.total!==6||final.round!==5)throw Error('Final round unavailable');await page.screenshot({path:'output/race-champion-grid.png'});await page.locator('#레이스종료').click();}
 finally{await page.evaluate(value=>localStorage.setItem('석암-RockOn-기록-v1',value),original);}
 if(await page.evaluate(()=>schoolTour.getRacePassageState().open))throw Error('Passage not restored');
 if(errors.length)throw Error(errors.join('\n'));return {ok:true,noAutoHeading:true,manualSteering:true,won:first.won,laps:first.laps,newObstacles:first.generation,roundAdvance:true,recordPersists:true,unlock:true,errors};
}
