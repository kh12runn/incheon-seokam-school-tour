import * as THREE from './외부도구/three.module.js';

// Approved preview: keep the original face/UVs and tailor only the raised arm.
export function fitStarterGrip(rig){
 const ease=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b),wrist=new THREE.Vector3(.30,.83,.02),roll=Math.PI/2;
 const axis=[[.85,.300,.007],[.925,.287,-.007],[1.025,.273,-.038],[1.125,.252,-.044],[1.225,.232,-.043],[1.325,.212,-.044],[1.43,.205,-.035]];
 rig.root.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  const g=o.geometry,p=g.attributes.position,w=g.attributes.skinWeight,ids=g.attributes.skinIndex;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   if(x>.15&&x<.215&&y>.78&&y<1.0){w.setXYZW(i,1,0,0,0);continue;}
   if(x<.23||y<.81||y>1.10||Math.abs(z)>.12)continue;
   const arm=ids.getZ(i)===8?w.getY(i)+w.getZ(i):0;
   if(arm>.2)w.setXYZW(i,0,w.getY(i)/arm,w.getZ(i)/arm,0);
  }
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i);if(x<=.17||y<=.84||y>=1.43||ids.getY(i)!==7)continue;
   const arm=w.getY(i)+w.getZ(i);if(arm<.01)continue;
   const blend=ease(.84,.90,y)*(1-ease(1.32,1.43,y))*Math.max(ease(.19,.22,x),ease(1.02,1.12,y));
   const target=THREE.MathUtils.lerp(arm,1-Math.pow(1-arm,4),blend);
   w.setXYZW(i,1-target,w.getY(i)*target/arm,w.getZ(i)*target/arm,0);
  }
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(x<.215||y<=.85||y>=1.43||ids.getY(i)!==7)continue;
   const amount=.32*ease(.85,.91,y)*(1-ease(1.28,1.43,y))*ease(.215,.25,x);if(!amount)continue;
   let j=0;while(j<axis.length-2&&y>axis[j+1][0])j++;
   const a=axis[j],b=axis[j+1],t=THREE.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);
   p.setXYZ(i,THREE.MathUtils.lerp(x,THREE.MathUtils.lerp(a[1],b[1],t),amount),y,THREE.MathUtils.lerp(z,THREE.MathUtils.lerp(a[2],b[2],t),amount));
  }
  for(let i=0;i<p.count;i++){
   let x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(x<=.245||y>=.85||y<=.64)continue;
   const t=THREE.MathUtils.clamp((.785-y)/.115,0,1),amount=ease(0,.2,t)*Math.max(ease(.273,.29,x),1-ease(.71,.73,y)),angle=.5-4.1*t,r=Math.max(.018,.031+(x-(.33-.04*t))*.75);
   x=THREE.MathUtils.lerp(x,.285+Math.cos(angle)*r,amount);y=THREE.MathUtils.lerp(y,.755+Math.sin(angle)*r,amount);
   const rotation=roll*(1-ease(.81,.85,y)),dx=x-wrist.x,dz=z-wrist.z;
   p.setXYZ(i,wrist.x+dx*Math.cos(rotation)+dz*Math.sin(rotation),y,wrist.z-dx*Math.sin(rotation)+dz*Math.cos(rotation));
  }
  p.needsUpdate=true;w.needsUpdate=true;g.computeVertexNormals();
 });
}

export function attachStarterFlag(rig,flag){
 flag.position.set(.065,-.405,.035);
 flag.quaternion.setFromEuler(new THREE.Euler(0,Math.PI/2,0)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2));
 rig.bones[8].add(flag);
}
