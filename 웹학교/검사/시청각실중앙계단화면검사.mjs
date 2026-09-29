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
    const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{audioRoomDetails}=await import('/웹학교/시청각실사진표현.mjs'),{centralStairDetails}=await import('/웹학교/중앙계단사진표현.mjs'),{finishMaterial,surfaceKind,softEnvironment}=await import('/웹학교/현실재질.mjs');
    const world=buildWorld(await(await fetch('/웹학교/학교구조.json')).json()),audio=world.specialInteriors.find(r=>r.roomId==='2F_AUDIO_VISUAL');
    document.body.replaceChildren();document.body.style.margin='0';const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,760);document.body.append(renderer.domElement);renderer.toneMapping=THREE.ACESFilmicToneMapping;
    const scenes=[];
    for(const stair of [false,true]){
      const scene=new THREE.Scene();scene.background=new THREE.Color('#bad2df');scene.environment=softEnvironment(renderer);scene.add(new THREE.HemisphereLight(0xfff8e7,0x9baaa1,2.2));const light=new THREE.DirectionalLight(0xfff5dc,2);light.position.set(stair?49:-17,16,-12);scene.add(light);
      const all=world.boxes.filter(b=>stair?(b.name.startsWith('MAIN_STAIR_B ')||b.centralStairFinish):(b.spaceId===audio.roomId||b.spaceId==='2F_KOREAN_CLASS'||b.name.startsWith('시청각실 복도 연결')||b.name.includes('Window_'+audio.roomId)));
      const groups=new Map(),geometry=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(.5,12,8),matrix=new THREE.Matrix4();
      for(const b of all){const key=b.color.join(',')+'|'+surfaceKind(b)+'|'+(b.shape??'box');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);}
      for(const list of groups.values()){
        const mesh=new THREE.InstancedMesh(list[0].shape==='sphere'?sphere:geometry,finishMaterial(list[0]),list.length);
        list.forEach((b,i)=>{const a=b.bounds;matrix.compose(new THREE.Vector3((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2),new THREE.Quaternion(),new THREE.Vector3(a[3]-a[0],a[5]-a[2],a[4]-a[1]));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);
      }
      scene.add(stair?centralStairDetails(world.centralStairFinish):audioRoomDetails(audio));scenes.push(scene);
    }
    const camera=new THREE.PerspectiveCamera(78,1100/760,.03,90);
    const views={계단옆문에서입장:[0,[.5,5.02,-1.5],[-8.5,4.95,-1.5]],객석에서무대:[0,[-8.5,5.12,5.98],[-8.5,4.86,-8.8]],무대에서객석:[0,[-8.5,5.35,-8.0],[-8.5,4.40,5.5]],중앙계단내려가기:[1,[53.75,5.03,-4.35],[52.9,2.70,-9.8]],중앙계단올라가기:[1,[53.8,3.40,-9.4],[53.55,4.30,-4.22]]};
    window.showPhotoSpace=name=>{const [s,p,t]=views[name];camera.position.set(...p);camera.lookAt(...t);renderer.render(scenes[s],camera);return renderer.info.render.calls;};
  });
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-audio-stair-preview-')),calls={};
  for(const name of ['계단옆문에서입장','객석에서무대','무대에서객석','중앙계단내려가기','중앙계단올라가기']){calls[name]=await page.evaluate(name=>window.showPhotoSpace(name),name);await page.screenshot({path:path.join(output,name+'.png')});}
  await page.setViewportSize({width:390,height:700});
  await page.goto(base+'/?test=1');
  await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:90000});
  await page.locator('#시작').click();await page.locator('#캐릭터확인').click();
  await page.evaluate(()=>document.getElementById('메뉴').click());
  await page.locator('#방선택').selectOption('2F_AUDIO_VISUAL');await page.locator('#방이동').click({noWaitAfter:true});
  await page.waitForFunction(()=>schoolTour.getState().position.z===3.4);
  const state=await page.evaluate(()=>schoolTour.getState());assert.equal(state.position.x,-.65);assert.equal(state.mode,'walk');
  await page.evaluate(()=>schoolTour.test.setPosition({x:53.7,y:3.6,z:3.4}));
  await page.waitForFunction(()=>schoolTour.getState().position.x===53.7);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,actualWebGL:true,gameRoomTeleport:true,centralStairInGame:true,views:5,calls,output}));
}finally{await browser.close();}
