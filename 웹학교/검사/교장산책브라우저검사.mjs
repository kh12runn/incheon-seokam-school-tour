export async function verifyPrincipalPatrol(page){
  const assert=(value,message)=>{if(!value)throw Error(message);};
  const checks=[];
  for(const office of [true,false]){
    await page.evaluate(office=>schoolTour.test.setPosition(office?{x:40,y:1.5,z:3.4}:{x:41,y:-2.8,z:0}),office);
    await page.waitForFunction(office=>office?schoolTour.getPrincipalState().modelStatus==='ready':schoolTour.getLobbyPrincipalState().modelStatus==='ready',office);
    const read=()=>page.evaluate(office=>office?schoolTour.getPrincipalState():schoolTour.getLobbyPrincipalState(),office);
    const before=await read();
    await page.waitForFunction(({office,before})=>{
      const s=office?schoolTour.getPrincipalState():schoolTour.getLobbyPrincipalState();
      return s.distance-before.distance>.5&&s.moving;
    },{office,before},{timeout:30000});
    const after=await read();assert(after.distance>before.distance+.5,'NPC moves through world, not just in place');
    if(office)assert(await page.evaluate(()=>schoolTour.getOfficePrincipalStates().length)===1,'Preserve one office principal');
    await page.evaluate(office=>{
      const npc=(office?schoolTour.getPrincipalState():schoolTour.getLobbyPrincipalState()).position;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const p=schoolTour.test.world.candidate(npc.x+dx,npc.y+dy,npc.z);if(!p)continue;
        schoolTour.test.setPosition(p);schoolTour.test.setYaw(Math.atan2(p.x-npc.x,npc.y-p.y));return;
      }
      throw Error('No approach position');
    },office);
    await page.locator('#월퀴즈말풍선').waitFor({state:'visible'});
    const held=await read();await page.waitForTimeout(250);assert(JSON.stringify((await read()).position)===JSON.stringify(held.position),'Stops to converse');
    const question=await page.evaluate(()=>schoolTour.getMonthQuizState().question);
    await page.evaluate(()=>{
      const state=schoolTour.getMonthQuizState(),months=['january','february','march','april','may','june','july','august','september','october','november','december'];
      document.querySelectorAll('#월퀴즈보기 button')[state.question.choices.indexOf(months[state.question.month-1])].click();
    });
    assert(await page.locator('#월퀴즈결과').innerText()==='참 잘했어요~','Correct answer before leave');
    await page.evaluate(office=>schoolTour.test.setPosition(office?{x:40,y:1.5,z:3.4}:{x:41,y:-2.8,z:0}),office);
    await page.waitForFunction(()=>!schoolTour.getMonthQuizState().open);
    await page.evaluate(held=>{
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const p=schoolTour.test.world.candidate(held.x+dx,held.y+dy,held.z);if(!p)continue;
        schoolTour.test.setPosition(p);schoolTour.test.setYaw(Math.atan2(p.x-held.x,held.y-p.y));return;
      }
    },held.position);
    await page.locator('#월퀴즈말풍선').waitFor({state:'visible'});
    const next=await page.evaluate(()=>schoolTour.getMonthQuizState());
    assert(next.question.month!==question.month&&!next.solved&&next.attempts===0,'Fresh quiz after returning');
    checks.push({office,distance:after.distance-before.distance,conversationalStop:true,freshQuiz:true});
  }
  return {ok:true,checks};
}
