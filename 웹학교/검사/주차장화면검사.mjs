import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/tmp/school-browser/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER||'/tmp/school-browser/browsers/chromium-1243/chrome-linux64/chrome',args:['--enable-unsafe-swiftshader']});
const output=new URL('../../output/parking-game/',import.meta.url);await fs.mkdir(output,{recursive:true});
const report={checks:[],errors:[]};
try{
  for(const mobile of [false,true]){
    const context=await browser.newContext({viewport:mobile?{width:390,height:700}:{width:1100,height:760},isMobile:mobile,hasTouch:true,deviceScaleFactor:1});
    const page=await context.newPage();page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));
    // Match the existing release harness on CPU-only graphics hosts.
    await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>setTimeout(()=>raf(callback),200);});
    await page.goto((process.env.SCHOOL_TEST_URL||'http://127.0.0.1:8080')+'/?test=1');
    await page.waitForFunction(()=>window.schoolTour?.getState().ready);
    console.log('Loaded',mobile?'mobile':'desktop');
    await page.locator('#시작').click({force:true});console.log('Picker opened');
    await page.waitForFunction(()=>!document.getElementById('캐릭터확인').disabled);
    await page.locator('#캐릭터확인').click({force:true});await page.locator('#캐릭터창').waitFor({state:'hidden'});console.log('Character ready');
    const spawn=await page.evaluate(()=>schoolTour.getState());assert.equal(spawn.position.x,44);assert.equal(spawn.position.y,-11);assert.equal(spawn.yaw,0);
    await page.screenshot({path:new URL(`spawn-${mobile?'mobile':'desktop'}.png`,output).pathname});
    const ball=await page.evaluate(()=>schoolTour.getFootballState()[0]);
    await page.evaluate(p=>{schoolTour.test.setPosition({x:p.x,y:p.y-.85,z:-.3});schoolTour.test.setYaw(0);},ball.position);
    await page.keyboard.down('KeyW');
    try{await page.waitForFunction(()=>schoolTour.getFootballState()[0].kicks>0);}finally{await page.keyboard.up('KeyW');}
    const kicked=await page.evaluate(()=>schoolTour.getFootballState()[0]);assert(kicked.position.y>ball.position.y||kicked.velocity.y>0);
    await page.screenshot({path:new URL(`football-${mobile?'mobile':'desktop'}.png`,output).pathname});
    report.checks.push({name:'outdoor-spawn-and-football',mobile,spawn:spawn.position,kicks:kicked.kicks,forward:true});
    for(const [name,p,yaw] of [['rear',{x:18,y:16.5,z:-.6},-.25],['field',{x:-12.8,y:-52,z:-.6},Math.PI/2]]){
      await page.evaluate(([p,yaw])=>{schoolTour.test.setPosition(p);schoolTour.test.setYaw(yaw);},[p,yaw]);
      await page.waitForTimeout(1500);
      const before=await page.locator('canvas').first().screenshot();await fs.writeFile(new URL(`${name}-${mobile?'mobile':'desktop'}.png`,output),before);
      const stats=await page.evaluate(async encoded=>{
        const c=new Image();c.src='data:image/png;base64,'+encoded;await c.decode();
        const copy=document.createElement('canvas');copy.width=128;copy.height=96;
        const ctx=copy.getContext('2d');ctx.drawImage(c,0,0,128,96);const pixels=ctx.getImageData(0,0,128,96).data,colors=new Set();for(let i=0;i<pixels.length;i+=16)colors.add(pixels.slice(i,i+3).join(','));
        return {colors:colors.size,state:schoolTour.getState()};
      },before.toString('base64'));
      assert(stats.colors>80,`${name} canvas blank`);assert(stats.state.drawCalls>0);
      await page.evaluate(yaw=>schoolTour.test.setYaw(yaw+.45),yaw);await page.waitForTimeout(500);
      assert(!before.equals(await page.locator('canvas').first().screenshot()),'Turning updates rendered scene');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
      report.checks.push({name,mobile,colors:stats.colors,drawCalls:stats.state.drawCalls,turning:true});
      console.log(JSON.stringify(report.checks.at(-1)));
    }
    await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption('1F_NIGHT_DUTY');await page.locator('#방이동').click();await page.waitForTimeout(1200);
    const position=await page.evaluate(()=>schoolTour.getState().position);assert(Math.abs(position.x-46.75)<.1&&Math.abs(position.y-3.62)<.1,'Night-duty room menu destination');
    await page.screenshot({path:new URL(`night-duty-${mobile?'mobile':'desktop'}.png`,output).pathname});
    report.checks.push({name:'night-duty-entry',mobile,position});await context.close();
  }
  assert.deepEqual(report.errors,[]);report.ok=true;
}finally{await browser.close();await fs.writeFile(new URL('checks.json',output),JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
