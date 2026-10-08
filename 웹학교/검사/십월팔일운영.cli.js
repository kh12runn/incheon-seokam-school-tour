async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1100,height:750});
 await page.goto('https://school-tour-production.up.railway.app/');
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:150000});
 if(await page.evaluate(()=>!!schoolTour.test))throw new Error('Private test hook exposed');
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 const reports=[];
 for(const id of ['2F_2-6','1F_1-5','1F_1-4','1F_1-6','2F_1-1','3F_4-7','3F_4-8','2F_INDIVIDUAL_2','4F_GRADE2_RESEARCH','4F_GRADE6_RESEARCH','4F_COMPUTER','3F_4-6','4F_4-2']){
  await page.evaluate(()=>document.getElementById('메뉴').click());
  await page.locator('#방선택').selectOption(id);await page.locator('#방이동').click({noWaitAfter:true});
  await page.waitForFunction(()=>{const s=schoolTour.getState();return s.mode==='walk'&&!s.menuOpen&&(s.locked||s.freeLook);});
  await page.waitForTimeout(250);
  const before=await page.evaluate(()=>schoolTour.getState().position);
  if(Math.abs(before.z-(parseInt(id)-1)*3.4)>.001)throw new Error(id+' wrong floor');
  let after=before,moved=0,usedKey;
  // A spawn may face a desk; test an available direction, not wall pass-through.
  for(const key of ['w','a','s','d']){
   await page.keyboard.down(key);await page.waitForTimeout(250);await page.keyboard.up(key);
   after=await page.evaluate(()=>schoolTour.getState().position);moved=Math.hypot(after.x-before.x,after.y-before.y);usedKey=key;
   if(moved>=.01)break;
  }
  if(moved<.01)throw new Error(id+' movement blocked '+JSON.stringify({before,after}));
  await page.screenshot({path:'output/production-oct8-'+id+'.png'});
  reports.push({id,before,after,moved,usedKey});
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
 return {ok:true,reports,errors};
}
