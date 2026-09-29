import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.QUIZ_BROWSER?{executablePath:process.env.QUIZ_BROWSER}:{}),args:['--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1100,height:760},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8086')+'/healthz');
  const details=await page.evaluate(async()=>{
    const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{mainClassroomDetails}=await import('/웹학교/본관교실표현.mjs'),{finishMaterial,surfaceKind}=await import('/웹학교/현실재질.mjs');
    const data=await(await fetch('/웹학교/학교구조.json')).json(),world=buildWorld(data),config=world.classroomsMain.rooms.find(r=>r.roomId==='1F_3-4');
    document.body.style.margin='0';document.body.replaceChildren();const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,760);document.body.append(renderer.domElement);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#c6dbe0');scene.add(new THREE.HemisphereLight(0xfff8e7,0x8c9a8c,2.2));const sun=new THREE.DirectionalLight(0xfff4dd,2.1);sun.position.set(6,7,10);scene.add(sun);
    const groups=new Map(),boxes=world.boxes.filter(b=>b.spaceId==='1F_3-4'||b.interiorRoom==='1F_3-4');
    for(const b of boxes){const key=b.color.join(',')+'|'+surfaceKind(b);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);}
    const geometry=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4(),up=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
    for(const items of groups.values()){
      const mesh=new THREE.InstancedMesh(geometry,finishMaterial(items[0]),items.length);
      items.forEach((b,i)=>{const a=b.bounds,q=new THREE.Quaternion();if(b.rotation)q.copy(up).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...b.rotation))).multiply(up.clone().invert());matrix.compose(new THREE.Vector3((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2),q,new THREE.Vector3(a[3]-a[0],a[5]-a[2],a[4]-a[1]));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);
    }
    const detail=mainClassroomDetails(config);scene.add(detail);const camera=new THREE.PerspectiveCamera(76,1100/760,.03,60);
    window.showClass34=rear=>{camera.position.set(rear?2.6:8.85,1.85,rear?3.5:3.3);camera.lookAt(rear?9.8:.1,1.42,3.5);renderer.render(scene,camera);return renderer.info.render.calls;};window.showClass34(false);
    return {boxCount:boxes.length,photoReference:detail.userData.photoReference,fanCount:detail.children.filter(c=>c.name.includes('천장 보호망')).length};
  });
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-class34-preview-'));let drawCalls;
  for(const [name,rear] of [['정면',false],['후면',true]]){drawCalls=await page.evaluate(rear=>window.showClass34(rear),rear);await page.screenshot({path:path.join(output,name+'.png')});}
  assert.equal(details.fanCount,4);assert.equal(details.photoReference.count,6);assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,actualWebGL:true,...details,drawCalls,output}));
}finally{await browser.close();}
