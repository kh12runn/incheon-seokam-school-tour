import * as THREE from './외부도구/three.module.js';
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
// The approved GLBs are unrigged. Bake their original transforms, retain every
// vertex/UV/material, then give limbs soft skin weights for a restrained walk.
export function createPrincipalWalkRig(model){
  model.updateMatrixWorld(true);
  // Latest approved single principal has adult proportions, regardless of GLB filename.
  const rig=new THREE.Group(),hip=.90,knee=.46,shoulder=1.43;
  const legX=.095,armX=.24,elbow=shoulder-.27;
  const points=[[0,0,0],[-legX,hip,0],[-legX,knee,0],[legX,hip,0],[legX,knee,0],[-armX,shoulder,0],[-armX,elbow,0],[armX,shoulder,0],[armX,elbow,0]];
  const parents=[-1,0,1,0,3,0,5,0,7],bones=points.map(()=>new THREE.Bone());
  for(let i=0;i<bones.length;i++){
    bones[i].name=['body','leftHip','leftKnee','rightHip','rightKnee','leftArm','leftElbow','rightArm','rightElbow'][i];
    const p=parents[i],origin=p<0?[0,0,0]:points[p];bones[i].position.set(...points[i].map((n,j)=>n-origin[j]));
    (p<0?rig:bones[p]).add(bones[i]);
  }
  rig.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones);
  let vertexCount=0;
  model.traverse(object=>{
    if(!object.isMesh)return;
    const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld),pos=geometry.getAttribute('position');
    const indices=new Uint16Array(pos.count*4),weights=new Float32Array(pos.count*4);
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),side=x<0?0:1;
      let upper=0,lower=0,amount=0,bend=0;
      const arm=smooth(.17,.25,Math.abs(x))*(1-smooth(shoulder-.02,shoulder+.10,y))*smooth(hip-.2,hip-.07,y);
      if(arm>.01){upper=side?7:5;lower=upper+1;amount=arm;bend=1-smooth(elbow-.055,elbow+.055,y);}
      else if(y<hip+.04){upper=side?3:1;lower=upper+1;amount=1-smooth(hip-.10,hip+.04,y);bend=1-smooth(knee-.065,knee+.065,y);}
      indices.set([0,upper,lower,0],i*4);weights.set([1-amount,amount*(1-bend),amount*bend,0],i*4);
    }
    geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    const mesh=new THREE.SkinnedMesh(geometry,object.material);mesh.name=object.name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
    rig.add(mesh);mesh.bind(skeleton);vertexCount+=pos.count;
  });
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
