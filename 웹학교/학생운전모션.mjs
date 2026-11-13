import * as THREE from './외부도구/three.module.js';

// Seat coordinates are relative to the car's tyre contact plane. The student
// root stays on that plane; the pose, rather than a lowered standing body,
// places the hips on the cushion and the shoes inside the footwell.
export function createSeatedPose(root,asset,holder){
 const restPosition=holder.position.clone(),restScale=holder.scale.clone();
 const hips=asset.getObjectByName('Hips');
 const limbs=['Left','Right'].flatMap(side=>[
  {kind:'leg',upper:asset.getObjectByName(side+'UpLeg'),lower:asset.getObjectByName(side+'Leg'),end:asset.getObjectByName(side+'Foot'),toe:asset.getObjectByName(side+'ToeBase')},
  {kind:'arm',upper:asset.getObjectByName(side+'Arm'),lower:asset.getObjectByName(side+'ForeArm'),end:asset.getObjectByName(side+'Hand')}
 ]).filter(l=>l.upper&&l.lower&&l.end);
 const saved=new Map(limbs.flatMap(l=>[l.upper,l.lower,l.end]).map(b=>[b,b.quaternion.clone()]));
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),local=new THREE.Vector3(),target=new THREE.Vector3(),joint=new THREE.Vector3(),origin=new THREE.Vector3(),axis=new THREE.Vector3(),bend=new THREE.Vector3(),from=new THREE.Vector3(),to=new THREE.Vector3();
 const rotation=new THREE.Quaternion(),parent=new THREE.Quaternion(),delta=new THREE.Quaternion(),rootRotation=new THREE.Quaternion();
 let applied=false;
 function restore(){if(!applied)return;holder.position.copy(restPosition);holder.scale.copy(restScale);for(const [bone,q] of saved)bone.quaternion.copy(q);applied=false;}
 function aim(bone,child,point,weight){
  bone.getWorldPosition(a);child.getWorldPosition(b);from.copy(b).sub(a).normalize();to.copy(point).sub(a).normalize();
  bone.getWorldQuaternion(rotation);rotation.premultiply(delta.setFromUnitVectors(from,to));bone.parent.getWorldQuaternion(parent).invert();rotation.premultiply(parent);
  bone.quaternion.slerp(rotation,weight);bone.updateWorldMatrix(false,true);
 }
 function apply(weight,type='sedan'){
  if(!hips||weight<=0)return;
  for(const [bone,q] of saved)q.copy(bone.quaternion);applied=true;
  const sports=type==='sports',size=sports?.78:1,hipHeight=sports?.54:.63;
  holder.scale.copy(restScale).multiplyScalar(1+(size-1)*weight);
  root.updateWorldMatrix(true,true);hips.getWorldPosition(local);root.worldToLocal(local);
  holder.position.x-=local.x*weight;holder.position.y+=(hipHeight-local.y)*weight;holder.position.z-=local.z*weight;
  root.updateWorldMatrix(true,true);root.getWorldQuaternion(rootRotation);
  for(const limb of limbs){
   const {upper,lower,end}=limb;upper.getWorldPosition(a);lower.getWorldPosition(b);end.getWorldPosition(c);
   const side=root.worldToLocal(local.copy(a)).x<0?-1:1,leg=limb.kind==='leg';
   target.set(side*(leg?.105:.12),leg?.45:sports?.79:.91,leg?(sports?.39:.48):.63);root.localToWorld(target);
   origin.copy(a);const l1=a.distanceTo(b),l2=b.distanceTo(c),distance=Math.min(l1+l2-.0001,Math.max(Math.abs(l1-l2)+.0001,a.distanceTo(target)));
   axis.copy(target).sub(a).normalize();bend.set(leg?0:side*.3,leg?1:-1,leg?.1:-.2).applyQuaternion(rootRotation);bend.addScaledVector(axis,-bend.dot(axis)).normalize();
   const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
   joint.copy(origin).addScaledVector(axis,along).addScaledVector(bend,height);
   aim(upper,lower,joint,weight);aim(lower,end,target,weight);
   if(leg&&limb.toe){end.getWorldPosition(target);to.set(0,0,1).applyQuaternion(rootRotation);target.add(to);aim(end,limb.toe,target,weight);}
  }
 }
 return {apply,restore};
}
