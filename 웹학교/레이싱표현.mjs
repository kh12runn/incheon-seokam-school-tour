import * as THREE from './외부도구/three.module.js';
import {mergeGeometries} from './외부도구/BufferGeometryUtils.js';
import {parkedCarDetails} from './자동차표현.mjs';
import {updateCarEffects} from './차량배기스파크.mjs';
import {RACE_PASSAGES,getRaceCourse} from './레이싱코스.mjs';
import {createRaceDriver} from './레이싱운전자.mjs';
import {createRaceTeachers} from './레이싱교사.mjs';
import {createBoostFlames} from './레이싱부스트효과.mjs';
import {createWorldRoad} from './레이싱입체표현.mjs';
import {createRaceStarter} from './레이싱출발심판.mjs';

export function disposeRaceTree(root,environment,preserveMaterials=new Set()){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material??[])){if(preserveMaterials.has(m))continue;materials.add(m);for(const v of Object.values(m))if(v?.isTexture&&v!==environment)textures.add(v);}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.removeFromParent();
}
export function createRaceVisual(scene,{getDriver}={}){
 const originalFog=scene.fog?{near:scene.fog.near,far:scene.fog.far}:null;
 function raceAtmosphere(){if(scene.fog){scene.fog.near=1200;scene.fog.far=2200;}}
 const root=new THREE.Group();root.name='운동장 가상 레이싱 트랙';root.position.y=.18;root.visible=false;scene.add(root);
 const driver=createRaceDriver(getDriver);
 const teachers=createRaceTeachers(scene);
 const starter=createRaceStarter(scene);
 const boostFlames=createBoostFlames(root);
 const ground=p=>(p.height??-.30)-root.position.y;
 const mats={white:new THREE.MeshStandardMaterial({color:0xf5f0e4,roughness:.88}),orange:new THREE.MeshStandardMaterial({color:0xe57632,roughness:.84}),dark:new THREE.MeshStandardMaterial({color:0x172530,roughness:.68})};
 // Only powder markings overlay the school's existing dirt. No replacement ground.
 // A single small reusable texture gives the line a dense center and scattered grains.
 const powder=document.createElement('canvas');powder.width=512;powder.height=128;
 const ctx=powder.getContext('2d'),grain=ctx.createImageData(512,128);let seed=183;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<128;y++)for(let x=0;x<512;x++){
  const i=(y*512+x)*4,edge=Math.abs((y-63.5)/63.5),waviness=.035*Math.sin(x*.061)+.025*Math.sin(x*.137);
  const density=Math.max(0,Math.min(1,(.82+waviness-edge)/.30)),noise=random();
  const alpha=edge<.62+waviness?(.54+.42*noise)*(noise<.07?.15:1):noise<density*.75?.25+.5*random():0;
  grain.data[i]=250;grain.data[i+1]=249;grain.data[i+2]=241;grain.data[i+3]=Math.round(alpha*255);
 }
 ctx.putImageData(grain,0,0);const chalkMap=new THREE.CanvasTexture(powder);chalkMap.wrapS=THREE.RepeatWrapping;chalkMap.colorSpace=THREE.SRGBColorSpace;chalkMap.anisotropy=4;
 const chalk=new THREE.MeshStandardMaterial({map:chalkMap,roughness:1,transparent:true,depthWrite:false,alphaTest:.025});
 const courseMaterials=new Set([chalk,...Object.values(mats)]);
 let course=null,trackLayer=null,mapPreview=false,previewTurn=0,previewZoom=1,previewTilt=.78,manualUntil=0,previewClock=0,previewInside=false,viewCamera=null,originalFar=500,originalNear=.045;
 function setCourse(next=getRaceCourse(1)){
 raceAtmosphere();
 if(course===next)return false;
 if(trackLayer)disposeRaceTree(trackLayer,scene.environment,courseMaterials);
 course=next;const TRACK=course,trackPoint=course.trackPoint;
 trackLayer=new THREE.Group();trackLayer.name='라운드별 분필 코스';trackLayer.userData.courseId=course.id;root.add(trackLayer);root.userData.courseId=course.id;root.userData.courseLength=course.length;
 if(course.elevated)trackLayer.add(createWorldRoad(course,root.position.y));
 const parts=new Map(),box=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
 function part(m,x,y,z,w,h,d,angle=0){dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.scale.set(w,h,d);dummy.updateMatrix();const g=box.clone().applyMatrix4(dummy.matrix);if(!parts.has(m))parts.set(m,[]);parts.get(m).push(g);}
 function ribbon(side,m){const points=[],uvs=[],indices=[],steps=Math.max(384,Math.ceil(TRACK.length*2));
  for(let i=0;i<=steps;i++){const s=i/steps*TRACK.length,halfWidth=(trackPoint(s).width??TRACK.width)/2;for(const edge of [-.25,.25]){const p=trackPoint(s,side*halfWidth+edge);points.push(p.x,ground(p)+.02,p.z);uvs.push(s*.5,(edge+.25)/.5);}if(i<steps){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,m);mesh.name=side<0?'왼쪽 분필 경계':'오른쪽 분필 경계';mesh.receiveShadow=true;trackLayer.add(mesh);return mesh;
 }
 ribbon(-1,chalk);ribbon(1,chalk);
 // Small powder chevrons show the route without influencing the steering.
 const arrows=[];
 for(let s=18;s<TRACK.length;){const p=trackPoint(s);for(const side of [-1,1]){
  const ax=p.x-p.tx*.40-p.tz*side*.65,az=p.z-p.tz*.40+p.tx*side*.65,bx=p.x+p.tx*.65,bz=p.z+p.tz*.65;
  const dx=bx-ax,dz=bz-az,g=new THREE.PlaneGeometry(Math.hypot(dx,dz),.28);g.rotateX(-Math.PI/2);g.rotateY(-Math.atan2(dz,dx));g.translate((ax+bx)/2,ground(p)+.024,(az+bz)/2);arrows.push(g);
 }s+=(p.width??TRACK.width)<8?12:30;}
 if(arrows.length){const mesh=new THREE.Mesh(mergeGeometries(arrows),chalk);mesh.name='진행 방향 분필 화살표';mesh.receiveShadow=true;trackLayer.add(mesh);arrows.forEach(g=>g.dispose());}
 const count=Math.ceil(TRACK.length/6),cone=new THREE.CylinderGeometry(.055,.19,.50,12),stripe=new THREE.CylinderGeometry(.095,.133,.14,12),placedCones=[];
 for(let i=0;i<count;i++)for(const side of [-1,1]){
  const s=i/count*TRACK.length,halfWidth=(trackPoint(s).width??TRACK.width)/2,p=trackPoint(s,side*(halfWidth+.5)),floor=ground(p);
  // Shared medians of the outbound/inbound passage need one set of cones.
  if(placedCones.some(q=>(q.x-p.x)**2+(q.z-p.z)**2<.55**2&&Math.abs(q.y-floor)<.25))continue;
  placedCones.push({x:p.x,z:p.z,y:floor});part(mats.dark,p.x,floor+.035,p.z,.47,.045,.47,p.yaw);
  for(const [geometry,material,y] of [[cone,mats.orange,floor+.30],[stripe,mats.white,floor+.395]]){
   const g=geometry.clone().translate(p.x,y,p.z);if(!parts.has(material))parts.set(material,[]);parts.get(material).push(g);
  }
 }
 cone.dispose();stripe.dispose();
 // Two line-marker passes form the finish stripe, using the same powder as the edges.
 for(const s of [-.28,.28]){
  const p=trackPoint(s),width=p.width??TRACK.width,g=new THREE.PlaneGeometry(width,.40),uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*width/2);
  g.rotateX(-Math.PI/2);g.rotateY(p.yaw);
  const line=new THREE.Mesh(g,chalk);line.name='출발선';line.position.set(p.x,ground(p)+.022,p.z);line.receiveShadow=true;trackLayer.add(line);
 }
 const startLine=trackPoint(0),startWidth=startLine.width??TRACK.width;for(const lane of [-startWidth/2-1.3,startWidth/2+1.3]){const p=trackPoint(0,lane);part(mats.dark,p.x,ground(p)+2.63,p.z,.23,5.2,.23);}
 part(mats.dark,startLine.x,ground(startLine)+5.08,startLine.z,.24,.62,startWidth+3.1,startLine.yaw+Math.PI/2);
 function sign(text,w,h){const c=document.createElement('canvas');c.width=2048;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#14242d';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#e4bf6a';ctx.font='bold 80px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,c.height/2,c.width-96);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));trackLayer.add(mesh);return mesh;}
 const banner=sign('ROCK ON  •  '+course.name,startWidth+2.6,1.1);banner.name='코스 출발 현수막';banner.rotation.y=startLine.yaw;banner.position.set(startLine.x-startLine.tx*.14,ground(startLine)+5.13,startLine.z-startLine.tz*.14);
 for(const [m,geos] of parts){const mesh=new THREE.Mesh(mergeGeometries(geos),m);mesh.castShadow=true;mesh.receiveShadow=true;trackLayer.add(mesh);geos.forEach(g=>g.dispose());}box.dispose();
 return true;
 }
 // Recycled obstacle pools: no geometry or texture allocation on lap changes.
 const obstacles=new THREE.Group();obstacles.name='라운드 장애물 풀';root.add(obstacles);const obstaclePool=[];
 const wood=new THREE.MeshStandardMaterial({color:0xc99557,roughness:.65}),metal=new THREE.MeshStandardMaterial({color:0x64757e,metalness:.65,roughness:.35}),paper=new THREE.MeshStandardMaterial({color:0xf3eedb,roughness:.9}),covers=[0xbd4f55,0x267f91,0xcea744].map(color=>new THREE.MeshStandardMaterial({color,roughness:.6}));
 const unit=new THREE.BoxGeometry(1,1,1);
 function piece(g,m,x,y,z,w,h,d){const o=new THREE.Mesh(unit,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;g.add(o);}
 for(let i=0;i<16;i++){
  const item=new THREE.Group(),chair=new THREE.Group(),books=new THREE.Group();item.name='레이스 장애물 '+i;item.add(chair,books);obstacles.add(item);
  piece(chair,wood,0,.56,0,.85,.10,.85);piece(chair,wood,0,1.02,.37,.85,.62,.07);
  for(const x of [-.34,.34])for(const z of [-.32,.32])piece(chair,metal,x,.27,z,.055,.54,.055);
  for(let j=0;j<4;j++){const book=new THREE.Group();book.position.y=.07+j*.13;book.rotation.y=j%2?.24:-.13;books.add(book);piece(book,paper,0,0,0,.80,.10,.55);for(const y of [-.058,.058])piece(book,covers[j%3],0,y,0,.86,.018,.59);piece(book,covers[j%3],-.42,0,0,.025,.13,.59);}
  item.visible=false;obstaclePool.push({item,chair,books});
 }
 // Preserve every original book/chair part and material, but submit six GPU
 // batches instead of a draw call for each tiny part. Transforms change per lap.
 const obstacleBatches=new Map(),obstacleMatrix=new THREE.Matrix4(),itemInverse=new THREE.Matrix4();
 for(const material of [wood,metal,paper,...covers]){
  const mesh=new THREE.InstancedMesh(unit,material,16*12);mesh.name='장애물 반복 부품';mesh.castShadow=true;mesh.receiveShadow=true;mesh.count=0;obstacles.add(mesh);
  obstacleBatches.set(material,mesh);
 }
 for(const entry of obstaclePool){
  entry.item.updateMatrixWorld(true);itemInverse.copy(entry.item.matrixWorld).invert();entry.parts=[];
  for(const [kind,group] of [['chair',entry.chair],['books',entry.books]]){
   group.traverse(o=>{if(o.isMesh)entry.parts.push({kind,material:o.material,matrix:new THREE.Matrix4().multiplyMatrices(itemInverse,o.matrixWorld)});});group.clear();
  }
 }
 function updateObstacleBatches(){
  for(const mesh of obstacleBatches.values())mesh.count=0;
  for(const entry of obstaclePool){if(!entry.item.visible)continue;entry.item.updateMatrix();
   for(const part of entry.parts){if((part.kind==='chair')!==entry.chair.visible)continue;const mesh=obstacleBatches.get(part.material);obstacleMatrix.multiplyMatrices(entry.item.matrix,part.matrix);mesh.setMatrixAt(mesh.count++,obstacleMatrix);}
  }
  for(const mesh of obstacleBatches.values()){mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
 }
 let fleet=null,preview=null,previewSource=null,lastGeneration=0,lastReset=0;const target=new THREE.Vector3(),look=new THREE.Vector3(),smoothLook=new THREE.Vector3();let cameraReady=false,cameraYaw=0;
 function clearCars({keepTeacherCache=false}={}){starter.hide();boostFlames.clear();driver.release();teachers.clear({keepCache:keepTeacherCache});if(fleet){disposeRaceTree(fleet,scene.environment);fleet=null;}if(preview){disposeRaceTree(preview,scene.environment);preview=null;}}
 function garage(car,nextCourse){mapPreview=false;setCourse(nextCourse);if(!preview||previewSource!==car){clearCars();previewSource=car;preview=parkedCarDetails({cars:[{...car,x:43,y:-50,z:-.42,yaw:0}],instanced:false,environment:scene.environment});root.add(preview);cameraReady=false;}preview.visible=true;root.visible=true;obstacles.visible=false;}
 function previewCourse(next){setCourse(next);mapPreview=true;previewClock=0;previewZoom=1;previewTurn=0;previewTilt=.78;manualUntil=0;clearCars({keepTeacherCache:true});root.visible=true;obstacles.visible=false;cameraReady=false;}
 function start(race){setCourse(race.course);clearCars({keepTeacherCache:true});fleet=parkedCarDetails({cars:race.cars.map(c=>({...c.source,id:'race-'+c.id,x:0,y:0,z:0,yaw:0})),environment:scene.environment});root.add(fleet);fleet.traverse(o=>{o.castShadow=false;});teachers.start(race.cars);starter.show(race.course);lastGeneration=-1;cameraReady=false;obstacles.visible=true;root.visible=true;}
 function update(race,dt,camera,elapsed,currentState){
  if(!viewCamera){viewCamera=camera;originalFar=camera.far;originalNear=camera.near;}
  if(race||!mapPreview)camera.near=originalNear;
  const desiredFar=mapPreview&&!race?2200:originalFar;if(camera.far!==desiredFar){camera.far=desiredFar;camera.updateProjectionMatrix();}
  const undergroundGuide=trackLayer?.getObjectByName('지하 코스 안내선');if(undergroundGuide)undergroundGuide.visible=mapPreview&&!race;
  if(!race&&mapPreview){
   previewClock+=dt;if(camera.view?.enabled)camera.clearViewOffset();
   const b=course.bounds,cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2,span=Math.max(b.maxX-b.minX,b.maxZ-b.minZ);
   const cinema=performance.now()>manualUntil&&previewClock%24>14,highlight=course.highlights[Math.floor(previewClock/24)%course.highlights.length];
   camera.near=cinema?.15:2;
   const p=cinema?course.trackPoint(highlight.at*course.length):{x:cx,z:cz,height:(b.maxY??8)*.35};
   const portrait=innerHeight>innerWidth,radius=(cinema?43:span*.87)*previewZoom*(portrait?Math.max(1.2,1/camera.aspect):1),turn=previewTurn+previewClock*.085;
   target.set(p.x+Math.cos(turn)*radius*Math.cos(previewTilt),p.height+radius*Math.sin(previewTilt),p.z+Math.sin(turn)*radius*Math.cos(previewTilt));
   look.set(p.x,p.height,p.z);
   const inside=cinema&&p.tunnel;if(inside){const s=highlight.at*course.length+(previewClock%24-19)*3,a=course.trackPoint(s),b=course.trackPoint(s+10);target.set(a.x,a.height+2.2,a.z);look.set(b.x,b.height+2,b.z);}
   if(inside!==previewInside){cameraReady=false;previewInside=inside;}
   if(!cameraReady){camera.position.copy(target);smoothLook.copy(look);cameraReady=true;}else{camera.position.lerp(target,1-Math.exp(-dt*2));smoothLook.lerp(look,1-Math.exp(-dt*2));}
   camera.lookAt(smoothLook);camera.fov=55;camera.setViewOffset(innerWidth,innerHeight,portrait?0:-innerWidth*.08,innerHeight*(portrait?.12:.015),innerWidth,innerHeight);camera.updateProjectionMatrix();return;
  }
  if(!race){if(preview){const car=preview.children[0];car.rotation.y=Math.PI+elapsed*.14;updateCarEffects(car,elapsed);driver.update(car,previewSource,dt);const portrait=innerHeight>innerWidth&&innerWidth<=700;camera.position.set(portrait?54.7:49.5,portrait?4.8:2.9,portrait?61.9:56.6);camera.lookAt(43,.48,50);camera.fov=37;if(!portrait)camera.setViewOffset(innerWidth,innerHeight,innerWidth*.17,0,innerWidth,innerHeight);else camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.25,innerWidth,innerHeight);camera.updateProjectionMatrix();}return;}
  if(camera.view?.enabled)camera.clearViewOffset();
  const trackPoint=race.course.trackPoint;
  const state=currentState??race.view();
  starter.update(state);
  if(lastGeneration!==state.generation){lastGeneration=state.generation;obstaclePool.forEach(({item,chair,books},i)=>{const o=race.obstacles[i];item.visible=!!o;if(!o)return;const p=trackPoint(o.s,o.lane);item.position.set(p.x,ground(p)+.06,p.z);item.rotation.y=p.yaw+o.angle;chair.visible=o.kind==='chair';books.visible=!chair.visible;});updateObstacleBatches();}
  for(const c of race.cars){const obj=fleet.getObjectByName('race-'+c.id),height=c.height??trackPoint(c.s).height??-.30,speed=Math.abs(c.speed),finished=c.id&&c.finish!=null;obj.visible=!finished;obj.scale.setScalar(finished?0:1);obj.position.set(c.x,height-root.position.y+.02+Math.sin(c.spin*2)*Math.min(.012,speed*.0005),c.z);obj.rotation.order='YXZ';obj.rotation.set(c.pitch??0,c.yaw,THREE.MathUtils.clamp(c.steering*c.speed*.006,-.055,.055));for(const wheel of obj.userData.wheels){wheel.rotation.x=-c.spin;wheel.rotation.y=wheel.userData.front?c.steering:0;}}
  for(const obj of fleet.children)if(obj.visible)updateCarEffects(obj,elapsed);
  fleet.userData.instances.update();
  boostFlames.update(race.cars,fleet,dt,elapsed,state);
  driver.update(fleet.getObjectByName('race-'+race.player.id),race.player.source,state.paused?0:dt);
  teachers.update(race.cars,fleet,camera);
  const c=race.player,speed=Math.abs(c.speed),height=c.height??trackPoint(c.s).height??-.30;
  const insideTunnel=course.elevated&&(trackPoint(c.s).tunnel||trackPoint(c.s-8).tunnel||height<0);
  let passageBlend=0;
  for(const b of race.course.elevated?[]:RACE_PASSAGES){const dx=Math.max(b.minX-c.x,0,c.x-b.maxX),dz=Math.max(b.minZ-c.z,0,c.z-b.maxZ);passageBlend=Math.max(passageBlend,Math.max(0,1-Math.hypot(dx,dz)/7));}
  let distance=THREE.MathUtils.lerp(7.7+speed*.055,4.6,passageBlend);
  if(insideTunnel)distance=4.7;
  if(lastReset!==c.resetSerial){lastReset=c.resetSerial;cameraReady=false;}
  // Follow the driver's real heading. Never look ahead along the route: even
  // against a boundary, steering and camera remain under the driver's control.
  cameraYaw=cameraReady?cameraYaw+Math.atan2(Math.sin(c.yaw-cameraYaw),Math.cos(c.yaw-cameraYaw))*(1-Math.exp(-dt*7)):c.yaw;
  const fx=-Math.sin(cameraYaw),fz=-Math.cos(cameraYaw);
  for(const b of race.course.elevated?[]:RACE_PASSAGES)if(c.x>b.minX&&c.x<b.maxX&&c.z>b.minZ&&c.z<b.maxZ&&Math.abs(fx)>.001){
   // Side walls shorten the chase distance; the driver's heading is unchanged.
   const toWall=fx>0?(c.x-b.minX-.35)/fx:(b.maxX-c.x-.35)/-fx;distance=Math.max(1.7,Math.min(distance,toWall));
  }
  target.set(c.x-fx*distance,height+THREE.MathUtils.lerp(3.55+speed*.022,2.38,passageBlend),c.z-fz*distance);look.set(c.x+fx*5,height+.8,c.z+fz*5);
  if(insideTunnel){const behind=course.nearestTrack(target.x,target.z,c.s-distance),lane=THREE.MathUtils.clamp(behind.lane,-course.width/2+1.5,course.width/2-1.5);target.set(behind.x+behind.nx*lane,behind.height+2.25,behind.z+behind.nz*lane);const ahead=trackPoint(c.s+5);look.y=ahead.height+1;}
  for(const b of race.course.elevated?[]:RACE_PASSAGES)if(target.x>b.minX&&target.x<b.maxX&&target.z>b.minZ&&target.z<b.maxZ)target.y=Math.min(target.y,b.ceiling-.25);
  if(state.phase==='countdown'&&state.countdown>.65&&starter.getState().status==='ready')starter.focus(target,look);
  if(!cameraReady){camera.position.copy(target);smoothLook.copy(look);cameraReady=true;}else{camera.position.lerp(target,1-Math.exp(-dt*9));smoothLook.lerp(look,1-Math.exp(-dt*11));}
  if(insideTunnel){const behind=course.nearestTrack(camera.position.x,camera.position.z,c.s-distance);camera.position.y=THREE.MathUtils.clamp(camera.position.y,behind.height+1.7,behind.height+3);}
  for(const b of race.course.elevated?[]:RACE_PASSAGES)if(camera.position.x>b.minX&&camera.position.x<b.maxX&&camera.position.z>b.minZ&&camera.position.z<b.maxZ)camera.position.y=Math.min(camera.position.y,b.ceiling-.25);
  camera.lookAt(smoothLook);const fov=62+speed*.22+(c.boosting?4:0);if(Math.abs(camera.fov-fov)>.02){camera.fov=fov;camera.updateProjectionMatrix();}
 }
 return {root,garage,start,update,setCourse,previewCourse,prepareStarter:starter.prepare,starterState:starter.getState,orbit(dx,dy,zoom=1){previewTurn-=dx*.006;previewTilt=THREE.MathUtils.clamp(previewTilt+dy*.003,.25,1.3);previewZoom=THREE.MathUtils.clamp(previewZoom*zoom,.4,2);manualUntil=performance.now()+12000;},teacherState:teachers.getState,boostState:boostFlames.getState,hide(){root.visible=false;clearCars();if(originalFog&&scene.fog)Object.assign(scene.fog,originalFog);if(viewCamera){viewCamera.far=originalFar;viewCamera.near=originalNear;viewCamera.updateProjectionMatrix();}},dispose(){clearCars();starter.dispose();boostFlames.dispose();teachers.dispose();disposeRaceTree(root,scene.environment);if(!trackLayer){courseMaterials.forEach(m=>m.dispose());chalkMap.dispose();}}};
}
