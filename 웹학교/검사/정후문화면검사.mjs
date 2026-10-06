import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {ROSTRUM} from '../구령대배치.mjs';
import {REAR_GATE} from '../후문배치.mjs';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:750}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8080')+'/healthz');
 await page.evaluate(async()=>{
  const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{createGateTerrain}=await import('/웹학교/다목적실표현.mjs'),{finishMaterial,surfaceKind,softEnvironment}=await import('/웹학교/현실재질.mjs'),{exteriorRenderBox,exteriorSkins}=await import('/웹학교/외관사진디자인.mjs');
  const world=buildWorld(await(await fetch('/웹학교/학교구조.json')).json());
  document.body.replaceChildren();document.body.style.margin='0';const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,750);renderer.toneMapping=THREE.ACESFilmicToneMapping;document.body.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#b9d4df');scene.environment=softEnvironment(renderer);scene.add(new THREE.HemisphereLight(0xfff6e7,0x909684,2));const sun=new THREE.DirectionalLight(0xfff6e7,2);sun.position.set(30,80,40);scene.add(sun);
  const geometry=new THREE.BoxGeometry(),sphere=new THREE.SphereGeometry(.5,14,10),matrix=new THREE.Matrix4(),groups=new Map();
  for(const b of [...world.boxes.map(exteriorRenderBox).filter(Boolean),...exteriorSkins(world.boxes,world.data)]){
   if(b.shape==='terrain'||b.renderInDetails)continue;const key=b.color.join(',')+'|'+surfaceKind(b)+'|'+b.shape;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);
  }
  for(const list of groups.values()){
   const mesh=new THREE.InstancedMesh(list[0].shape==='sphere'?sphere:geometry,finishMaterial(list[0]),list.length);
   list.forEach((b,i)=>{const a=b.bounds;matrix.compose(new THREE.Vector3((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2),new THREE.Quaternion().setFromEuler(new THREE.Euler(...(b.rotation??[0,0,0]))),new THREE.Vector3(a[3]-a[0],a[5]-a[2],a[4]-a[1]));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);
  }
  scene.add(createGateTerrain(world.boxes));
  const {campusEntranceDetails}=await import('/웹학교/정후문입체표현.mjs');scene.add(campusEntranceDetails(world.boxes));
  const camera=new THREE.PerspectiveCamera(80,1100/750,.03,400);
  window.renderGate=(eye,target)=>{camera.position.set(eye[0],eye[2],-eye[1]);camera.lookAt(target[0],target[2],-target[1]);renderer.render(scene,camera);return renderer.info.render.triangles;};
 });
 const out=await fs.mkdtemp(path.join(os.tmpdir(),'school-gates-'));
 const cy=(ROSTRUM.front+ROSTRUM.rear)/2;
 const views={frontLower:[[-16,-13.5,-1.65],[20,-13.5,.4]],frontGate:[[-10,-13.7,-1.65],[-21,-12.5,-1.9]],frontUpper:[[31,-13.5,1.5],[-16,-13.5,-2]],frontRed:[[-12,-19,-1.3],[24,-20,1]],rearGate:[[-12,15,1.2],[-20,17,.8]],rearDoor:[[53.7,16,1.2],[53.7,9,.5]],rearInside:[[53.7,7,-.6+1.58],[53.7,12,.8]],rostrumFront:[[44,ROSTRUM.front-10,2],[44,cy,2.2]],rostrumBack:[[46,-8,2],[44,cy,2.1]],rostrumSide:[[34,ROSTRUM.front-4,2.6],[44,cy,2.2]],rostrumField:[[44,ROSTRUM.front+.9,ROSTRUM.top+1.58],[44,-43,.3]]};
 views.rearGate=[[REAR_GATE.x,31,1.25],[REAR_GATE.x,12,1.1]];
 views.rearGateFromParking=[[40,17,2],[REAR_GATE.x,REAR_GATE.y,1]];
 for(const [name,[eye,target]] of Object.entries(views)){assert(await page.evaluate(([a,b])=>window.renderGate(a,b),[eye,target])>1000);await page.screenshot({path:path.join(out,name+'.png')});}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,views:Object.keys(views),errors,output:out}));
}finally{await browser.close();}
