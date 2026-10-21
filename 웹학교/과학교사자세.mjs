import * as THREE from './외부도구/three.module.js';
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
// Coordinates are metres in the normalized 1.68 m science teacher, before rigging.
// Keep the approved face, clothes, book and UVs; correct only the scanned pose.
export function scienceRestPoint(x,y,z){
  const leg=(1-smooth(.08,.86,y))*smooth(-.025,.075,x);
  x-=.12*leg;
  const angle=-.20*smooth(1.32,1.43,y),c=Math.cos(angle),s=Math.sin(angle);
  const dx=x+.015,dy=y-1.365;
  x=-.015+dx*c-dy*s;y=1.365+dx*s+dy*c;
  // Reduce the lopsided, overly open smile without flattening the cheeks/nose.
  const mx=x+.009,my=y-1.469;
  const mouth=(1-smooth(.027,.052,Math.abs(mx)))*(1-smooth(.012,.034,Math.abs(my)))*smooth(.045,.075,z);
  y-=mouth*(my*.20+mx*.08);
  z-=mouth*.002;
  return [x,y,z];
}
export async function correctScienceRestPose(model){
  if(model.userData.scienceRestPose)return model;
  model.updateMatrixWorld(true);const meshes=[];model.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const point=new THREE.Vector3(),normal=new THREE.Vector3(),jacobian=new THREE.Matrix3(),localNormal=new THREE.Matrix3();
  let deadline=performance.now()+6;
  for(const mesh of meshes){
    const geometry=mesh.geometry.clone(),p=geometry.attributes.position,n=geometry.attributes.normal;
    const world=mesh.matrixWorld.clone(),inverse=world.clone().invert(),toWorldNormal=new THREE.Matrix3().getNormalMatrix(world),toLocalNormal=new THREE.Matrix3().getNormalMatrix(inverse);
    for(let i=0;i<p.count;i++){
      point.fromBufferAttribute(p,i).applyMatrix4(world);const {x,y,z}=point,q=scienceRestPoint(x,y,z);
      p.setXYZ(i,...point.set(...q).applyMatrix4(inverse).toArray());
      if(n){
        // Inverse-transpose Jacobian preserves smooth UV-seam normals after bending.
        const e=.00001,a=scienceRestPoint(x+e,y,z),b=scienceRestPoint(x,y+e,z),d=scienceRestPoint(x,y,z+e);
        jacobian.set((a[0]-q[0])/e,(b[0]-q[0])/e,(d[0]-q[0])/e,(a[1]-q[1])/e,(b[1]-q[1])/e,(d[1]-q[1])/e,(a[2]-q[2])/e,(b[2]-q[2])/e,(d[2]-q[2])/e);
        localNormal.copy(jacobian).invert().transpose();normal.fromBufferAttribute(n,i).applyNormalMatrix(toWorldNormal).applyNormalMatrix(localNormal).applyNormalMatrix(toLocalNormal);n.setXYZ(i,normal.x,normal.y,normal.z);
      }
      if(i%2048===2047&&performance.now()>=deadline){await new Promise(r=>setTimeout(r,0));deadline=performance.now()+6;}
    }
    p.needsUpdate=true;if(n)n.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();mesh.geometry=geometry;
  }
  model.userData.scienceRestPose=true;return model;
}
