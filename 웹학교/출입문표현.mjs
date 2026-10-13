import * as THREE from './외부도구/three.module.js';
export function roomDoorVisuals(controller){
  const root=new THREE.Group();root.name='교실 미닫이문 · 특별실 여닫이문';
  const geometry=new THREE.BoxGeometry(1,1,1),wood=new THREE.MeshStandardMaterial({color:'#c4b395',roughness:.78}),metal=new THREE.MeshStandardMaterial({color:'#8d989b',roughness:.35,metalness:.65}),glass=new THREE.MeshStandardMaterial({color:'#c0dce0',transparent:true,opacity:.28,roughness:.12,metalness:.1,depthWrite:false}),trim=new THREE.MeshStandardMaterial({color:'#596967',roughness:.6});
  const records=new Map();
  const part=(parent,x,h,z,w,H,D,material)=>{
    // Keep glass individually depth-sorted; batch opaque parts with byte-identical geometry/material.
    if(material.transparent){const m=new THREE.Mesh(geometry,material);m.position.set(x,h,z);m.scale.set(w,H,D);parent.add(m);return;}
    if(!records.has(material))records.set(material,[]);
    records.get(material).push({parent,local:new THREE.Matrix4().compose(new THREE.Vector3(x,h,z),new THREE.Quaternion(),new THREE.Vector3(w,H,D))});
  };
  const moving=[],groups=[];
  for(const d of controller.doors){
    const group=new THREE.Group();root.add(group);groups.push({group,d});
    const frame=new THREE.Group();frame.position.set(d.x,d.z,-d.y);frame.rotation.y=Math.atan2(d.ty,d.tx);group.add(frame);
    // Jambs lie outside the clear passage, no raised threshold to trip on.
    for(const x of [-.025,d.width+.025])part(frame,x,d.height/2,0,.045,d.height,.16,trim);
    part(frame,d.width/2,d.height+.025,0,d.width+.10,.05,.17,trim);
    if(d.kind==='sliding')part(frame,d.width+.02,d.height+.085,0,d.width*2+.18,.065,.12,metal);
    for(const leaf of d.leaves){
      const pivot=new THREE.Group();pivot.name=d.name;group.add(pivot);const w=leaf.width,h=d.height;
      if(d.glass){
        part(pivot,w/2,h/2,0,w-.09,h-.10,.024,glass);
        for(const x of [.027,w-.027])part(pivot,x,h/2,0,.054,h-.02,.07,metal);
        for(const y of [.045,h-.045])part(pivot,w/2,y,0,w,.075,.07,metal);
        part(pivot,w/2,.94,0,w-.08,.065,.075,metal);
      }else{
        part(pivot,w/2,h/2,0,w,h-.025,.065,wood);
        for(const z of [-.034,.034])part(pivot,w/2,.38,z,w-.16,.53,.008,trim);
      }
      for(const z of [-.075,.075])part(pivot,w-.13,1.03,z,.045,.21,.065,metal);
      moving.push({pivot,leaf});
    }
  }
  const batches=[...records].map(([material,items])=>{const mesh=new THREE.InstancedMesh(geometry,material,items.length);mesh.frustumCulled=false;root.add(mesh);return {mesh,items};}),matrix=new THREE.Matrix4();
  let initialized=false;
  root.userData.update=(p=null,walking=true)=>{
    let dirty=!initialized;
    for(const {group,d} of groups){const visible=walking&&(!p||Math.abs(p.z-d.z)<2.6&&Math.hypot(p.x-d.x,p.y-d.y)<30);if(group.visible!==visible){group.visible=visible;dirty=true;}}
    for(const item of moving){const {pivot,leaf}=item;if(!pivot.parent.visible||item.lastPose===leaf.pose)continue;item.lastPose=leaf.pose;pivot.position.set(leaf.pose.x,leaf.bounds[2]-.015,-leaf.pose.y);pivot.rotation.y=leaf.pose.heading;dirty=true;}
    if(!dirty)return;initialized=true;root.updateMatrixWorld(true);
    for(const {mesh,items} of batches){let count=0;for(const {parent,local} of items)if(parent.parent.visible){matrix.multiplyMatrices(parent.matrixWorld,local);mesh.setMatrixAt(count++,matrix);}mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;}
  };
  root.userData.update();return root;
}
export function doorControls(onAction){
  const button=document.createElement('button');button.id='출입문조작';button.type='button';button.hidden=true;button.setAttribute('aria-label','교실 문 열고 닫기');
  button.setAttribute('aria-keyshortcuts','F');
  button.style.cssText='position:fixed;z-index:24;left:50%;bottom:calc(100px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:65vw;padding:10px 16px;border:1px solid #a7c7c5;border-radius:12px;background:#173a40ed;color:white;font:600 14px sans-serif;touch-action:manipulation;';
  button.addEventListener('pointerdown',e=>e.stopPropagation());button.addEventListener('click',e=>{e.stopPropagation();onAction();});document.body.append(button);
  return {update(controller,p,active){
    const d=active?controller.nearby(p):null;if(button.hidden===!!d)button.hidden=!d;
    if(d){const text=d.blockedByPlayer&&!d.target?'문이 닫힐 수 있도록 한 걸음 비켜 주세요':`${document.body.dataset.touch==='true'?'터치':'F'} · ${d.name} 문 ${d.target?'닫기':'열기'}`;if(button.textContent!==text)button.textContent=text;}
  }};
}
