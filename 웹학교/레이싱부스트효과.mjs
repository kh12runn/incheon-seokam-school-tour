import * as THREE from './외부도구/three.module.js';

// Two shared draw calls, bounded instances, no lights, downloads or per-frame
// geometry allocation. Local +Z is behind every school vehicle.
export function createBoostFlames(parent,{capacity=6}={}){
 const group=new THREE.Group();group.name='차량 부스트 화염';group.visible=false;parent.add(group);
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=128;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(64,128);
 for(let y=0;y<128;y++)for(let x=0;x<64;x++){
  const t=1-y/127,u=(x-31.5)/31.5,center=Math.sin(t*11)*t*.12,width=(.3+.55*Math.sin(Math.PI*t))*(1-t)**.55;
  const edge=Math.max(0,1-Math.abs(u-center)/Math.max(.001,width));
  const alpha=edge**1.5*(1-t)**.35*Math.min(1,.35+t*25);
  const color=t<.15?[125+130*t/.15,205+50*t/.15,255]:t<.45?[255,255-50*(t-.15)/.3,220-190*(t-.15)/.3]:[255,205-155*(t-.45)/.55,30-25*(t-.45)/.55];
  const i=(y*64+x)*4;pixels.data[i]=color[0];pixels.data[i+1]=color[1];pixels.data[i+2]=color[2];pixels.data[i+3]=Math.round(alpha*255);
 }
 ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
 const geometry=new THREE.PlaneGeometry(1,1).rotateX(Math.PI/2).translate(0,0,.5);
 const ribbons=new THREE.InstancedMesh(geometry,material,capacity*6);ribbons.name='배기구 화염';ribbons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);ribbons.frustumCulled=false;group.add(ribbons);
 const sparkGeometry=new THREE.OctahedronGeometry(1,0),sparkMaterial=new THREE.MeshBasicMaterial({color:0xffb44b,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 const sparks=new THREE.InstancedMesh(sparkGeometry,sparkMaterial,capacity*16);sparks.name='부스트 불꽃 입자';sparks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);sparks.frustumCulled=false;group.add(sparks);
 const local=new THREE.Object3D(),matrix=new THREE.Matrix4(),intensities=new Map();let activeCars=0;
 ribbons.count=sparks.count=0;
 function clear(){group.visible=false;ribbons.count=sparks.count=0;activeCars=0;intensities.clear();}
 function update(cars,fleet,dt,time,{paused=false,phase='racing'}={}){
  if(paused||phase!=='racing'||!fleet){clear();return;}
  ribbons.count=sparks.count=0;activeCars=0;
  for(let i=0;i<Math.min(cars.length,capacity);i++){
   const car=cars[i],target=car.boosting&&car.finish===null?1:0;
   const intensity=target?Math.min(1,(intensities.get(car.id)??0)+dt*14):Math.max(0,(intensities.get(car.id)??0)-dt*8);
   intensities.set(car.id,intensity);if(intensity<.01)continue;
   const vehicle=fleet.getObjectByName('race-'+car.id);if(!vehicle?.visible)continue;
   vehicle.updateMatrix();activeCars++;
   const rear=car.dimensions.length/2+.08,height=car.source.type==='sports'?.35:.31;
   for(const side of [-1,1]){
    const x=side*car.dimensions.width*.29;
    const flicker=.88+.12*Math.sin(time*37+car.id*2+side)+.07*Math.sin(time*61+side);
    const length=(1.05+Math.min(1,Math.abs(car.speed)/24)*.65)*intensity*flicker;
    for(let k=0;k<3;k++){
     local.position.set(x,height,rear);local.rotation.set(0,0,k*Math.PI/3+Math.sin(time*18+side)*.08);local.scale.set(.60*intensity*flicker,1,length*(1-k*.08));local.updateMatrix();
     matrix.multiplyMatrices(vehicle.matrix,local.matrix);ribbons.setMatrixAt(ribbons.count++,matrix);
    }
    for(let k=0;k<8;k++){
     const age=(time*2.6+k*.137+car.id*.17)%1,spread=(k%3-1)*.21*age;
     local.position.set(x+spread,height+Math.sin(age*Math.PI)*.18+((k%2)-.5)*.10,rear+age*2.8);
     local.rotation.set(age*3,k*.8,0);const size=.032*(1-age)*intensity;local.scale.set(size,size,size*(2.5+age*2));local.updateMatrix();
     matrix.multiplyMatrices(vehicle.matrix,local.matrix);sparks.setMatrixAt(sparks.count++,matrix);
    }
   }
  }
  group.visible=activeCars>0;
  if(group.visible){ribbons.instanceMatrix.needsUpdate=true;sparks.instanceMatrix.needsUpdate=true;}
 }
 return {group,update,clear,getState:()=>({activeCars,playerVisible:group.visible&&(intensities.get(0)??0)>=.01,ribbons:ribbons.count,sparks:sparks.count,visible:group.visible,drawCalls:group.visible?2:0}),
  dispose(){clear();group.removeFromParent();geometry.dispose();material.dispose();texture.dispose();sparkGeometry.dispose();sparkMaterial.dispose();ribbons.dispose();sparks.dispose();}};
}
