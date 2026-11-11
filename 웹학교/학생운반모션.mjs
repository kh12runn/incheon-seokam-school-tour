import * as THREE from './외부도구/three.module.js';

// Lightweight two-bone IK layered over the existing idle/run/jump clips.
// The parcel and both hands share one chest-relative frame, including turns
// and the breathing/run bob. No new model, animation asset or render pass.
export function createCarryPose(root,asset){
  const socket=new THREE.Group();socket.name='양손으로 받치는 상자';root.add(socket);
  const chest=asset.getObjectByName('Spine2')??asset.getObjectByName('Spine');
  const arms=['Left','Right'].map(side=>({side,upper:asset.getObjectByName(side+'Arm'),lower:asset.getObjectByName(side+'ForeArm'),hand:asset.getObjectByName(side+'Hand')}));
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),target=new THREE.Vector3(),elbow=new THREE.Vector3(),axis=new THREE.Vector3(),bend=new THREE.Vector3(),from=new THREE.Vector3(),to=new THREE.Vector3();
  const rotation=new THREE.Quaternion(),parentRotation=new THREE.Quaternion(),base=new THREE.Quaternion(),rootRotation=new THREE.Quaternion(),deltaRotation=new THREE.Quaternion();
  const shoulder=new THREE.Vector3(),localShoulder=new THREE.Vector3(),fingerDirection=new THREE.Vector3(),palmNormal=new THREE.Vector3(),handSide=new THREE.Vector3(),handBasis=new THREE.Matrix4();
  let blend=0;
  function aim(bone,child,point,weight){
    bone.getWorldPosition(a);child.getWorldPosition(b);from.copy(b).sub(a).normalize();to.copy(point).sub(a).normalize();
    bone.getWorldQuaternion(rotation);rotation.premultiply(deltaRotation.setFromUnitVectors(from,to));
    bone.parent.getWorldQuaternion(parentRotation).invert();rotation.premultiply(parentRotation);
    base.copy(bone.quaternion);bone.quaternion.copy(base).slerp(rotation,weight);bone.updateWorldMatrix(false,true);
  }
  return {socket,update(dt,carrying){
    blend+=((carrying?1:0)-blend)*(1-Math.exp(-Math.max(0,dt)*18));
    if(blend<.001||!chest)return;
    root.updateWorldMatrix(true,true);chest.getWorldPosition(c);root.worldToLocal(c);
    socket.position.set(c.x,c.y-.055,c.z+.27);socket.rotation.set(0,0,0);socket.updateWorldMatrix(false,false);
    root.getWorldQuaternion(rootRotation);
    for(const arm of arms){
      const {upper,lower,hand}=arm;if(!upper||!lower||!hand)continue;
      upper.getWorldPosition(a);lower.getWorldPosition(b);hand.getWorldPosition(c);
      // Match the actual side in this rig, rather than assuming a naming axis.
      const side=root.worldToLocal(localShoulder.copy(a)).x<0?-1:1;
      target.set(side*.16,-.13,-.035);socket.localToWorld(target);
      shoulder.copy(a);const l1=a.distanceTo(b),l2=b.distanceTo(c),distance=Math.min(l1+l2-.0001,Math.max(Math.abs(l1-l2)+.0001,a.distanceTo(target)));
      axis.copy(target).sub(a).normalize();
      bend.set(side*.55,-1,-.25).applyQuaternion(rootRotation);bend.addScaledVector(axis,-bend.dot(axis)).normalize();
      const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
      elbow.copy(shoulder).addScaledVector(axis,along).addScaledVector(bend,height);
      aim(upper,lower,elbow,blend);aim(lower,hand,target,blend);
      // Fingers curl underneath the lower corners instead of dangling toward
      // the floor. Local +Y is the finger axis in both existing student rigs.
      fingerDirection.set(-side*.8,0,.6).applyQuaternion(rootRotation);palmNormal.set(0,1,0).applyQuaternion(rootRotation);handSide.crossVectors(fingerDirection,palmNormal);
      handBasis.makeBasis(handSide,fingerDirection,palmNormal);rotation.setFromRotationMatrix(handBasis);
      hand.parent.getWorldQuaternion(parentRotation).invert();rotation.premultiply(parentRotation);hand.quaternion.slerp(rotation,blend);hand.updateWorldMatrix(false,true);
    }
  },get blend(){return blend;}};
}
