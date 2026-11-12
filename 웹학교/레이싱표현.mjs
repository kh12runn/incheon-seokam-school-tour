import * as THREE from './외부도구/three.module.js';
import {mergeGeometries} from './외부도구/BufferGeometryUtils.js';
import {parkedCarDetails} from './자동차표현.mjs';
import {TRACK,trackPoint} from './레이싱물리.mjs';

export function disposeRaceTree(root,environment){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material??[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture&&v!==environment)textures.add(v);}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.removeFromParent();
}
export function createRaceVisual(scene){
 const root=new THREE.Group();root.name='운동장 가상 레이싱 트랙';root.position.y=.18;root.visible=false;scene.add(root);
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
 const parts=new Map(),box=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
 function part(m,x,y,z,w,h,d,angle=0){dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.scale.set(w,h,d);dummy.updateMatrix();const g=box.clone().applyMatrix4(dummy.matrix);if(!parts.has(m))parts.set(m,[]);parts.get(m).push(g);}
 function ribbon(a,b,y,m){const points=[],uvs=[],indices=[],steps=384;
  for(let i=0;i<=steps;i++){for(const lane of [a,b]){const p=trackPoint(i/steps*TRACK.length,lane);points.push(p.x,y,p.z);uvs.push(i/steps*TRACK.length*.5,(lane-a)/(b-a));}if(i<steps){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,m);mesh.receiveShadow=true;root.add(mesh);return mesh;
 }
 ribbon(-5.75,-5.25,-.46,chalk);ribbon(5.25,5.75,-.46,chalk);
 const count=Math.ceil(TRACK.length/6),cone=new THREE.CylinderGeometry(.055,.19,.50,12),stripe=new THREE.CylinderGeometry(.095,.133,.14,12);
 for(let i=0;i<count;i++)for(const lane of [-6,6]){
  const p=trackPoint(i/count*TRACK.length,lane);part(mats.dark,p.x,-.445,p.z,.47,.045,.47,p.yaw);
  for(const [geometry,material,y] of [[cone,mats.orange,-.18],[stripe,mats.white,-.085]]){
   const g=geometry.clone().translate(p.x,y,p.z);if(!parts.has(material))parts.set(material,[]);parts.get(material).push(g);
  }
 }
 cone.dispose();stripe.dispose();
 // Two line-marker passes form the finish stripe, using the same powder as the edges.
 for(const s of [-.28,.28]){
  const p=trackPoint(s),g=new THREE.PlaneGeometry(11,.40),uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*5.5);
  const line=new THREE.Mesh(g,chalk);line.rotation.set(-Math.PI/2,0,Math.atan2(p.tx,-p.tz));line.position.set(p.x,-.458,p.z);line.receiveShadow=true;root.add(line);
 }
 const startLine=trackPoint(0);for(const lane of [-6.8,6.8]){const p=trackPoint(0,lane);part(mats.dark,p.x,2.15,p.z,.23,5.2,.23);}
 part(mats.dark,startLine.x,4.6,startLine.z,.24,.62,14.1);
 function sign(text,w,h){const c=document.createElement('canvas');c.width=2048;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#14242d';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#e4bf6a';ctx.font='bold 80px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,c.height/2,c.width-96);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));root.add(mesh);return mesh;}
 const banner=sign('ROCK ON  •  SCHOOL CIRCUIT',13.6,1.1);banner.rotation.y=-Math.PI/2;banner.position.set(startLine.x-.14,4.65,startLine.z);
 for(const [m,geos] of parts){const mesh=new THREE.Mesh(mergeGeometries(geos),m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);geos.forEach(g=>g.dispose());}box.dispose();
 // Recycled obstacle pools: no geometry or texture allocation on lap changes.
 const obstacles=new THREE.Group();root.add(obstacles);const obstaclePool=[];
 const wood=new THREE.MeshStandardMaterial({color:0xc99557,roughness:.65}),metal=new THREE.MeshStandardMaterial({color:0x64757e,metalness:.65,roughness:.35}),paper=new THREE.MeshStandardMaterial({color:0xf3eedb,roughness:.9}),covers=[0xbd4f55,0x267f91,0xcea744].map(color=>new THREE.MeshStandardMaterial({color,roughness:.6}));
 const unit=new THREE.BoxGeometry(1,1,1);
 function piece(g,m,x,y,z,w,h,d){const o=new THREE.Mesh(unit,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;g.add(o);}
 for(let i=0;i<16;i++){
  const item=new THREE.Group(),chair=new THREE.Group(),books=new THREE.Group();item.add(chair,books);obstacles.add(item);
  piece(chair,wood,0,.56,0,.85,.10,.85);piece(chair,wood,0,1.02,.37,.85,.62,.07);
  for(const x of [-.34,.34])for(const z of [-.32,.32])piece(chair,metal,x,.27,z,.055,.54,.055);
  for(let j=0;j<4;j++){const book=new THREE.Group();book.position.y=.07+j*.13;book.rotation.y=j%2?.24:-.13;books.add(book);piece(book,paper,0,0,0,.80,.10,.55);for(const y of [-.058,.058])piece(book,covers[j%3],0,y,0,.86,.018,.59);piece(book,covers[j%3],-.42,0,0,.025,.13,.59);}
  item.visible=false;obstaclePool.push({item,chair,books});
 }
 let fleet=null,preview=null,lastGeneration=0;const target=new THREE.Vector3(),look=new THREE.Vector3();let cameraReady=false;
 function clearCars(){if(fleet){disposeRaceTree(fleet,scene.environment);fleet=null;}if(preview){disposeRaceTree(preview,scene.environment);preview=null;}}
 function garage(car){clearCars();preview=parkedCarDetails({cars:[{...car,x:43,y:-50,z:-.42,yaw:0}],instanced:false,environment:scene.environment});root.add(preview);root.visible=true;cameraReady=false;obstacles.visible=false;}
 function start(race){clearCars();fleet=parkedCarDetails({cars:race.cars.map(c=>({...c.source,id:'race-'+c.id,x:0,y:0,z:0,yaw:0})),environment:scene.environment});root.add(fleet);fleet.traverse(o=>{o.castShadow=false;});lastGeneration=0;cameraReady=false;obstacles.visible=true;root.visible=true;}
 function update(race,dt,camera,elapsed){
  if(!race){if(preview){const car=preview.children[0];car.rotation.y=Math.PI+elapsed*.14;const portrait=innerHeight>innerWidth&&innerWidth<=700;camera.position.set(portrait?54.7:49.5,portrait?4.8:2.9,portrait?61.9:56.6);camera.lookAt(43,.48,50);camera.fov=37;if(!portrait)camera.setViewOffset(innerWidth,innerHeight,innerWidth*.17,0,innerWidth,innerHeight);else camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.25,innerWidth,innerHeight);camera.updateProjectionMatrix();}return;}
  if(camera.view?.enabled)camera.clearViewOffset();
  const state=race.view();
  if(lastGeneration!==state.generation){lastGeneration=state.generation;obstaclePool.forEach(({item,chair,books},i)=>{const o=race.obstacles[i];item.visible=!!o;if(!o)return;const p=trackPoint(o.s,o.lane);item.position.set(p.x,-.42,p.z);item.rotation.y=p.yaw+o.angle;chair.visible=o.kind==='chair';books.visible=!chair.visible;});}
  for(const c of race.cars){const obj=fleet.getObjectByName('race-'+c.id),p=trackPoint(c.s,c.lane);obj.position.set(p.x,-.46+Math.sin(c.spin*2)*Math.min(.012,c.speed*.0005),p.z);obj.rotation.set(0,p.yaw-THREE.MathUtils.clamp(Math.atan2(c.sideSpeed,Math.max(5,c.speed))*.45,-.20,.20),-c.sideSpeed*.010);for(const wheel of obj.userData.wheels){wheel.rotation.x=-c.spin;wheel.rotation.y=wheel.userData.front?c.sideSpeed*.035-p.curve*.9:0;}}
  fleet.userData.instances.update();
  const c=race.player,p=trackPoint(c.s,c.lane),ahead=trackPoint(c.s+9,c.lane*.6),distance=7.7+c.speed*.055;
  target.set(p.x-p.tx*distance,3.25+c.speed*.022,p.z-p.tz*distance);look.set(ahead.x,.50,ahead.z);
  if(!cameraReady){camera.position.copy(target);cameraReady=true;}else camera.position.lerp(target,1-Math.exp(-dt*9));
  camera.lookAt(look);const fov=62+c.speed*.22+(c.boosting?4:0);if(Math.abs(camera.fov-fov)>.02){camera.fov=fov;camera.updateProjectionMatrix();}
 }
 return {root,garage,start,update,hide(){root.visible=false;clearCars();},dispose(){clearCars();disposeRaceTree(root,scene.environment);}};
}
