import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1100,height:760},hasTouch:true,isMobile:true,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8086';await page.goto(base+'/healthz');
  await page.evaluate(async()=>{
    const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{broadcastRoomDetails}=await import('/웹학교/방송실사진표현.mjs'),{finishMaterial,surfaceKind,softEnvironment}=await import('/웹학교/현실재질.mjs');
    const world=buildWorld(await(await fetch('/웹학교/학교구조.json')).json()),room=world.specialInteriors.find(r=>r.roomId==='2F_BROADCAST');
    document.body.replaceChildren();document.body.style.margin='0';const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,760);document.body.append(renderer.domElement);renderer.toneMapping=THREE.ACESFilmicToneMapping;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#bad2df');scene.environment=softEnvironment(renderer);scene.add(new THREE.HemisphereLight(0xfff8e7,0x9baaa1,2.2));const light=new THREE.DirectionalLight(0xfff5dc,2);light.position.set(62,13,12);scene.add(light);
    const all=world.boxes.filter(b=>b.spaceId===room.roomId||b.name.includes('Window_'+room.roomId));
    const groups=new Map(),geometry=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4();
    for(const b of all){const key=b.color.join(',')+'|'+surfaceKind(b);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);}
    for(const list of groups.values()){
      const mesh=new THREE.InstancedMesh(geometry,finishMaterial(list[0]),list.length);
      list.forEach((b,i)=>{const a=b.bounds;matrix.compose(new THREE.Vector3((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2),new THREE.Quaternion(),new THREE.Vector3(a[3]-a[0],a[5]-a[2],a[4]-a[1]));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);
    }
    scene.add(broadcastRoomDetails(room));const camera=new THREE.PerspectiveCamera(78,1100/760,.03,80);
    const views={조정실입구:[58.8,5.04,.73,57.8,4.70,5.8],음향장비:[58.0,5.04,1.55,59.92,4.75,4],조정실창가:[59.07,5.04,6.5,58.4,4.85,1],관찰창:[59.07,5.04,3.4,62.3,4.8,4.2],스튜디오:[63.5,5.04,6.3,61.65,4.7,1.4]};
    window.showBroadcast=name=>{const a=views[name];camera.position.set(...a.slice(0,3));camera.lookAt(...a.slice(3));renderer.render(scene,camera);return renderer.info.render.calls;};
  });
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-broadcast-preview-')),calls={};
  for(const name of ['조정실입구','음향장비','조정실창가','관찰창','스튜디오']){calls[name]=await page.evaluate(name=>window.showBroadcast(name),name);await page.screenshot({path:path.join(output,name+'.png')});}
  await page.setViewportSize({width:390,height:700});await page.goto(base+'/?test=1');
  await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:90000});
  await page.locator('#시작').click();await page.locator('#캐릭터확인').click();
  await page.evaluate(()=>document.getElementById('메뉴').click());
  await page.locator('#방선택').selectOption('2F_BROADCAST');await page.locator('#방이동').click({noWaitAfter:true});
  await page.waitForFunction(()=>schoolTour.getState().position.z===3.4);
  const state=await page.evaluate(()=>schoolTour.getState());assert.equal(state.position.x,58.8);assert.equal(state.position.y,-.7);assert.equal(state.mode,'walk');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,actualWebGL:true,gameRoomTeleport:true,views:5,calls,output}));
}finally{await browser.close();}
