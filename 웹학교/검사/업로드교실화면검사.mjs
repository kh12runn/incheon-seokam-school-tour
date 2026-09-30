import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {UPLOADED_CLASSROOM_PROFILES as profiles} from '../업로드교실관찰.mjs';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1000,height:700},hasTouch:true,isMobile:true,deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8086';await page.goto(base+'/healthz');
  await page.evaluate(async()=>{
    const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{uploadedClassroomDetails}=await import('/웹학교/업로드교실표현.mjs'),{finishMaterial,surfaceKind,softEnvironment}=await import('/웹학교/현실재질.mjs');
    const world=buildWorld(await(await fetch('/웹학교/학교구조.json')).json());
    document.body.replaceChildren();document.body.style.margin='0';const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1000,700);document.body.append(renderer.domElement);renderer.toneMapping=THREE.ACESFilmicToneMapping;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#b8d1de');scene.environment=softEnvironment(renderer);scene.add(new THREE.HemisphereLight(0xfff6e5,0xadb5a5,2.0));const light=new THREE.DirectionalLight(0xfff4de,1.7);light.position.set(20,80,50);scene.add(light);
    const camera=new THREE.PerspectiveCamera(82,1000/700,.025,200),geometry=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4();let root=null,active=null;
    window.showClassroom=(id,side)=>{
      const config=world.classroomInteriors.find(r=>r.roomId===id);
      if(active!==id){
        if(root){scene.remove(root);root.traverse(o=>{if(o.geometry&&o.geometry!==geometry)o.geometry.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}
        root=new THREE.Group();scene.add(root);active=id;
        const groups=new Map();for(const b of world.boxes.filter(b=>b.spaceId===id||b.name.includes('Window_'+id))){const key=b.color.join(',')+'|'+surfaceKind(b);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);}
        for(const list of groups.values()){
          const mesh=new THREE.InstancedMesh(geometry,finishMaterial(list[0]),list.length);
          list.forEach((b,i)=>{const a=b.bounds,q=new THREE.Quaternion();if(b.rotation){const up=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);q.copy(up).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...b.rotation))).multiply(up.clone().invert());}matrix.compose(new THREE.Vector3((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2),q,new THREE.Vector3(a[3]-a[0],a[5]-a[2],a[4]-a[1]));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);
        }
        root.add(uploadedClassroomDetails(config));
      }
      const f=config.frame,eye=side==='front'?f.point(7.8,-3.5,1.72):f.point(2.7,-3.8,1.72),target=side==='front'?f.point(.3,-3.5,1.57):f.point(9.7,-3.6,1.5);
      camera.position.set(eye.x,eye.z,-eye.y);camera.lookAt(target.x,target.z,-target.y);renderer.render(scene,camera);
      return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,revision:config.profile.sourceRevision};
    };
  });
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-all-classroom-preview-')),renders=[];
  for(const id of Object.keys(profiles))for(const side of ['front','back']){
    const stats=await page.evaluate(({id,side})=>window.showClassroom(id,side),{id,side});assert.equal(stats.revision,profiles[id].sourceRevision);assert.ok(stats.triangles>100);
    await page.screenshot({path:path.join(output,id+'-'+side+'.png')});renders.push({id,side,...stats});
  }
  console.log(JSON.stringify({stage:'rendered',views:renders.length,output}));
  await page.setViewportSize({width:390,height:700});await page.goto(base+'/?test=1');
  await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:120000});
  await page.locator('#시작').click();await page.locator('#캐릭터확인').click();
  const selected=[];
  for(const id of Object.keys(profiles)){
    await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption(id);await page.locator('#방이동').click({noWaitAfter:true});
    await page.waitForFunction(()=>schoolTour.getState().mode==='walk',null,{timeout:10000});
    const state=await page.evaluate(()=>schoolTour.getState());assert.equal(state.position.z,(parseInt(id)-1)*3.4);selected.push(id);
    if(id==='4F_2-2')await page.screenshot({path:path.join(output,'mobile-annex.png')});
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,actualWebGL:true,views:renders.length,gameRoomTeleports:selected,output}));
}finally{await browser.close();}
