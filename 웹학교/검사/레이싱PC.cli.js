async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1365,height:900});await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});
 await page.locator('#레이싱시작').click();await page.locator('[data-car="field-lamborghini"]').click();if(!await page.locator('#레이스출발').isDisabled())throw Error('Locked supercar allowed');
 await page.screenshot({path:'output/race-sports.png'});await page.locator('[data-car="field-tucson"]').click();await page.screenshot({path:'output/race-tucson.png'});
 await page.locator('[data-car="field-sedan-black"]').click();await page.locator('#레이스출발').click();
 // Read-only local diagnostics choose keys. The actual document input handlers,
 // animation loop, physics, finish detection and result UI perform the race.
 await page.evaluate(async()=>{
  const {TRACK,trackPoint}=await import('/웹학교/레이싱물리.mjs');const L=TRACK.length,held=new Set();
  window.__raceKeys=()=>{const r=schoolTour.test.raceDebug();if(!r||r.view().phase==='finished'){for(const code of held)document.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));return;}
   const c=r.player,lanes=[-3.2,0,3.2],scores=lanes.map(l=>{let s=Math.abs(l-c.lane);for(const o of r.obstacles){const gap=(o.s-c.s+L*100)%L;if(gap<25&&Math.abs(l-o.lane)<2)s+=50-gap;}return s;});const lane=lanes[scores.indexOf(Math.min(...scores))],wanted=new Set(['KeyW']);if(lane-c.lane>.16)wanted.add('KeyD');if(lane-c.lane<-.16)wanted.add('KeyA');if(!trackPoint(c.s).curve)wanted.add('ShiftLeft');
   for(const key of held)if(!wanted.has(key)){document.dispatchEvent(new KeyboardEvent('keyup',{code:key,bubbles:true}));held.delete(key);}for(const key of wanted)if(!held.has(key)){document.dispatchEvent(new KeyboardEvent('keydown',{code:key,bubbles:true}));held.add(key);}requestAnimationFrame(window.__raceKeys);
  };requestAnimationFrame(window.__raceKeys);
 });
 await page.waitForFunction(()=>schoolTour.getRacingState().phase==='finished',null,{timeout:180000});const first=await page.evaluate(()=>schoolTour.getRacingState());if(!first.won)throw Error('Beginner race lost: '+JSON.stringify(first));await page.screenshot({path:'output/race-first-win.png'});
 await page.locator('#레이스다음').click();await page.waitForFunction(()=>schoolTour.getRacingState().round===2);await page.keyboard.press('Escape');const before=await page.evaluate(()=>schoolTour.getRacingState().time);await page.waitForTimeout(500);if(before!==await page.evaluate(()=>schoolTour.getRacingState().time))throw Error('Pause failed');await page.keyboard.press('Escape');await page.locator('#레이스종료').click();
 await page.reload();await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});if((await page.evaluate(()=>schoolTour.getRacingState().progress.bestRound))<1)throw Error('Round record not saved');
 // Test storage in this isolated development browser only. Restore afterward.
 const original=await page.evaluate(()=>localStorage.getItem('석암-RockOn-기록-v1'));
 await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('석암-RockOn-기록-v1'));p.stamps=48;p.bestRound=4;localStorage.setItem('석암-RockOn-기록-v1',JSON.stringify(p));});
 try{await page.reload();await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});await page.locator('#레이싱시작').click();await page.locator('[data-car="field-champion"]').click();if(await page.locator('#레이스출발').isDisabled())throw Error('48 stamps did not unlock');await page.locator('#레이스라운드').selectOption('5');await page.locator('#레이스출발').click();const final=await page.evaluate(()=>schoolTour.getRacingState());if(final.total!==6||final.round!==5)throw Error('Final round unavailable');await page.screenshot({path:'output/race-champion-grid.png'});await page.locator('#레이스종료').click();}
 finally{await page.evaluate(value=>localStorage.setItem('석암-RockOn-기록-v1',value),original);}
 if(errors.length)throw Error(errors.join('\n'));return {ok:true,won:first.won,laps:first.laps,newObstacles:first.generation,roundAdvance:true,recordPersists:true,unlock:true,errors};
}
