async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(!await page.evaluate(()=>window.schoolTour?.test&&schoolTour.getState().mode==='walk')){
  await page.setViewportSize({width:1100,height:760});
  await page.goto('http://127.0.0.1:8080/?test=1',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:150000});
  await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 }
 await page.waitForFunction(()=>schoolTour.getState().mode==='walk'&&schoolTour.getState().character.modelStatus==='ready',null,{timeout:150000});
 await page.evaluate(()=>document.getElementById('메뉴').click());
 await page.locator('#방선택').selectOption('4F_GRADE6_RESEARCH');await page.locator('#방이동').click();
 await page.waitForFunction(()=>!schoolTour.getState().menuOpen&&schoolTour.getState().mode==='walk');
 const before=await page.evaluate(()=>schoolTour.getState().position);
 await page.keyboard.down('w');
 try{await page.waitForFunction(y=>schoolTour.getState().position.y>y+.15,before.y,{timeout:20000});}finally{await page.keyboard.up('w');}
 const after=await page.evaluate(()=>schoolTour.getState().position);
 if(after.z<10||after.z>10.5)throw Error('wrong floor');
 await page.screenshot({path:'output/research6-oct19-game.png'});
 // Deterministic input steps avoid headless rendering latency overshooting the aisle.
 const aisle=await page.evaluate(()=>{
  const t=schoolTour.test,c=t.world.specialInteriors.find(q=>q.roomId==='4F_GRADE6_RESEARCH');
  t.setPosition(c.spawn);t.step(0,.35);t.step(-.2,0);
  for(let i=0;i<46;i++)t.step(0,.1);
  return schoolTour.getState().position;
 });
 if(aisle.y<8.6)throw Error('aisle blocked '+JSON.stringify(aisle));
 if(errors.length)throw Error(JSON.stringify(errors));
 return {ok:true,before,after,aisle,errors};
}
