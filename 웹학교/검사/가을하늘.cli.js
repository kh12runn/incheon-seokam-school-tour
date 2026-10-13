async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/?test=1',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:150000});
 const sky=await page.evaluate(async()=>{
  const {clearDaySky,campusGroundBackdrop}=await import('/웹학교/야외풍경.mjs'),texture=clearDaySky(),canvas=texture.image;
  const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,halves=[];
  for(let half=0;half<2;half++){
   let blue=0,white=0,dark=0;
   for(let y=half*canvas.height/2;y<(half+1)*canvas.height/2;y+=4)for(let x=0;x<canvas.width;x+=4){
    const i=(y*canvas.width+x)*4,r=data[i],g=data[i+1],b=data[i+2];
    if(b>r+35&&b>g+10)blue++;if(r>232&&g>235&&b>235)white++;if((r+g+b)/3<115)dark++;
   }
   halves.push({blue,white,dark});
  }
  texture.dispose();
  const ground=campusGroundBackdrop(),groundInfo={height:ground.position.y,triangles:ground.geometry.index.count/3,width:ground.geometry.parameters.width};ground.geometry.dispose();ground.material.dispose();
  return {halves,ground:groundInfo,overlay:getComputedStyle(document.querySelector('.화면음영')).display,dimensions:[canvas.width,canvas.height]};
 });
 if(sky.overlay!=='none'||sky.halves[0].blue<200||sky.halves[0].white<100||sky.halves[1].white!==0||sky.ground.height>=-3.4||sky.ground.triangles!==2)throw Error(JSON.stringify(sky));
 await page.screenshot({path:'output/grounded-school-overview.png',timeout:30000});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 await page.waitForFunction(()=>schoolTour.getState().mode==='walk'&&schoolTour.getState().character.modelStatus==='ready',null,{timeout:120000});
 await page.evaluate(()=>{schoolTour.test.setPosition({x:35,y:-45,z:-.3});schoolTour.test.setYaw(Math.PI);});
 await page.waitForTimeout(1000);
 await page.screenshot({path:'output/autumn-sky-playground.png',timeout:30000});
 if(errors.length)throw Error(JSON.stringify(errors));
 return {ok:true,sky,errors};
}
