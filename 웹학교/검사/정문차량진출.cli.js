async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1100,height:800});
 await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:180000});
 await page.locator('#시작').click();await page.locator('#운전선택').click();
 await page.getByRole('button',{name:'정문 주차장',exact:true}).click();
 await page.locator('#캐릭터확인').click();await page.waitForFunction(()=>schoolTour.getState().mode==='walk'&&schoolTour.getState().character.modelStatus==='ready',null,{timeout:180000});
 // Use the first free sedan's real driver-side door, then actual F/W controls.
 await page.evaluate(async()=>{
  const car=schoolTour.getDrivingState().cars.find(c=>c.id==='field-sedan-black'),{CAR_DIMENSIONS}=await import('/웹학교/주차장.mjs');
  const lx=-CAR_DIMENSIONS.sedan.width/2-.62,ly=.35;
  schoolTour.test.setPosition({x:car.position.x+Math.cos(car.yaw)*lx-Math.sin(car.yaw)*ly,y:car.position.y+Math.sin(car.yaw)*lx+Math.cos(car.yaw)*ly,z:car.position.z});
 });
 await page.keyboard.press('f');await page.waitForFunction(()=>schoolTour.getDrivingState().phase==='driving',null,{timeout:30000});
 const before=await page.evaluate(()=>schoolTour.getDrivingState());
 await page.screenshot({path:'output/front-car-apron-before.png'});
 await page.keyboard.down('w');
 try{await page.waitForFunction(()=>schoolTour.getDrivingState().cars.find(c=>c.id==='field-sedan-black').position.x> -6,null,{timeout:30000,polling:100});}finally{await page.keyboard.up('w');}
 await page.waitForTimeout(150);const after=await page.evaluate(()=>schoolTour.getDrivingState());
 await page.screenshot({path:'output/front-car-apron-after.png'});
 if(errors.length)throw Error(JSON.stringify(errors));
 await page.goto('about:blank');
 return {ok:true,actualBoarding:true,actualForwardInput:true,before:before.cars.find(c=>c.id===before.carId),after:after.cars.find(c=>c.id===after.carId),errors};
}
