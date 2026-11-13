import * as THREE from './외부도구/three.module.js';

// One small, reusable draw call per Champion. No spawned objects, timers, lights
// or image downloads, including when the engine idles in the car park/garage.
export const EXHAUST_SPARK_COUNT=28;
export function createExhaustSparks(length){
 const positions=new Float32Array(EXHAUST_SPARK_COUNT*6),colors=new Float32Array(positions.length);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
 geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.5,length/2+.5),1.3);
 const mesh=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
 mesh.name='챔피언 배기 스파크';mesh.userData.exhaust=true;
 mesh.userData.update=time=>{
  for(let i=0;i<EXHAUST_SPARK_COUNT;i++){
   const cycle=(time*2.7+i*.6180339)%1,life=Math.min(1,cycle/.68),active=cycle<.68;
   const side=i%2?-1:1,a=i*2.39996,speed=.32+(i%5)*.07;
   const x=side*.29+Math.sin(a)*life*.13,y=.47+Math.cos(a)*life*.10-.13*life*life,z=length/2+.1+life*speed;
   const n=i*6,streak=active?.035+.055*(1-life):0,brightness=active?(1-life)*1.5:0;
   positions[n]=x;positions[n+1]=y;positions[n+2]=z;
   positions[n+3]=x-Math.sin(a)*streak*.18;positions[n+4]=y+.008;positions[n+5]=z-streak;
   for(let k=0;k<2;k++){const j=n+k*3;colors[j]=brightness;colors[j+1]=brightness*(.43+.4*(1-life));colors[j+2]=brightness*.12;}
  }
  geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
 };
 mesh.userData.update(0);return mesh;
}
export function updateCarEffects(car,time){car?.userData.exhaustSparks?.userData.update(time);}
