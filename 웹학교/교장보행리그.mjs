import * as THREE from './외부도구/three.module.js';
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
// Same transforms as BufferGeometry.applyMatrix4, but yield between chunks so
// a 300k-vertex teacher does not monopolize a frame during classroom entry.
function* transformGeometry(geometry,matrix){
  const vector=new THREE.Vector3(),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
  for(const name of ['position','normal','tangent']){
    const attribute=geometry.attributes[name];if(!attribute)continue;
    for(let i=0;i<attribute.count;i++){
      vector.fromBufferAttribute(attribute,i);
      if(name==='position')vector.applyMatrix4(matrix);
      else if(name==='normal')vector.applyNormalMatrix(normalMatrix);
      else vector.transformDirection(matrix);
      attribute.setXYZ(i,vector.x,vector.y,vector.z);
      if(i%4096===4095)yield;
    }
    attribute.needsUpdate=true;yield;
  }
  if(geometry.boundingBox!==null){geometry.computeBoundingBox();yield;}
  if(geometry.boundingSphere!==null){geometry.computeBoundingSphere();yield;}
}
// The approved GLBs are unrigged. Bake their original transforms, retain every
// vertex/UV/material, then give limbs soft skin weights for a restrained walk.
function* prepareWalkRig(model,{height=1.83,receiveShadow=true,continuousSleeves=false}={}){
  model.updateMatrixWorld(true);
  // Latest approved single principal has adult proportions, regardless of GLB filename.
  const scale=height/1.83;
  const rig=new THREE.Group(),hip=.90*scale,knee=.46*scale,shoulder=1.43*scale;
  const legX=.095*scale,armX=.24*scale,elbow=shoulder-.27*scale;
  const points=[[0,0,0],[-legX,hip,0],[-legX,knee,0],[legX,hip,0],[legX,knee,0],[-armX,shoulder,0],[-armX,elbow,0],[armX,shoulder,0],[armX,elbow,0]];
  const parents=[-1,0,1,0,3,0,5,0,7],bones=points.map(()=>new THREE.Bone());
  for(let i=0;i<bones.length;i++){
    bones[i].name=['body','leftHip','leftKnee','rightHip','rightKnee','leftArm','leftElbow','rightArm','rightElbow'][i];
    const p=parents[i],origin=p<0?[0,0,0]:points[p];bones[i].position.set(...points[i].map((n,j)=>n-origin[j]));
    (p<0?rig:bones[p]).add(bones[i]);
  }
  rig.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones);
  let vertexCount=0;
  const meshes=[];model.traverse(object=>{if(object.isMesh)meshes.push(object);});
  for(const object of meshes){
    const geometry=object.geometry.clone();yield;
    yield* transformGeometry(geometry,object.matrixWorld);
    const pos=geometry.getAttribute('position');
    const indices=new Uint16Array(pos.count*4),weights=new Float32Array(pos.count*4);
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i)/scale,y=pos.getY(i)/scale,side=x<0?0:1;
      let upper=0,lower=0,amount=0,bend=0;
      // The continuous 6-7 suit includes fingers below the old wrist cutoff.
      // Keep the entire hand on the forearm instead of blending it to the torso.
      const lowerArm=continuousSleeves?smooth(.58,.67,y)*(smooth(.84,.95,y)+(1-smooth(.84,.95,y))*smooth(.235,.255,Math.abs(x))):smooth(.70,.83,y);
      const arm=smooth(.17,.25,Math.abs(x))*(1-smooth(1.41,1.53,y))*lowerArm;
      if(arm>.01){upper=side?7:5;lower=upper+1;amount=arm;bend=1-smooth(1.105,1.215,y);}
      else if(y<.94){upper=side?3:1;lower=upper+1;amount=1-smooth(.80,.94,y);bend=1-smooth(.395,.525,y);}
      indices.set([0,upper,lower,0],i*4);weights.set([1-amount,amount*(1-bend),amount*bend,0],i*4);
      if(i%4096===4095)yield;
    }
    geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    const mesh=new THREE.SkinnedMesh(geometry,object.material);mesh.name=object.name;mesh.castShadow=true;mesh.receiveShadow=receiveShadow;mesh.frustumCulled=false;
    rig.add(mesh);mesh.bind(skeleton);vertexCount+=pos.count;
    yield;
  }
  let blend=0;
  return {root:rig,bones,vertexCount,update(dt,state){
    const target=state.moving?Math.min(1,state.speed/.4):0;
    blend+=(target-blend)*(1-Math.exp(-dt*10));
    const phase=state.phase??0,swing=Math.sin(phase)*.27*blend;
    bones[1].rotation.x=swing;bones[3].rotation.x=-swing;
    bones[2].rotation.x=Math.max(0,-Math.cos(phase))*.38*blend;
    bones[4].rotation.x=Math.max(0,Math.cos(phase))*.38*blend;
    bones[5].rotation.x=-swing*.6;bones[7].rotation.x=swing*.6;
    bones[6].rotation.x=-.08*blend;bones[8].rotation.x=-.08*blend;
    rig.position.y=-hip*(1-Math.cos(swing));rig.rotation.z=Math.sin(phase)*.009*blend;
  }};
}

export function createPrincipalWalkRig(model,options){
  const steps=prepareWalkRig(model,options);let step;do{step=steps.next();}while(!step.done);return step.value;
}
export async function createPrincipalWalkRigAsync(model,options){
  const steps=prepareWalkRig(model,options);let deadline=performance.now()+6;
  while(true){const step=steps.next();if(step.done)return step.value;
    if(performance.now()>=deadline){await new Promise(resolve=>setTimeout(resolve,0));deadline=performance.now()+6;}
  }
}
