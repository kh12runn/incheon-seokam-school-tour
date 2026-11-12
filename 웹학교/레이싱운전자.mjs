import * as THREE from './외부도구/three.module.js';

// Borrow the selected student's scene root. Never reparent or dispose it:
// free exploration owns the avatar and its already-loaded model resources.
export function createRaceDriver(getDriver=()=>null){
 let avatar=null,seated=false;
 const seat=new THREE.Vector3(),rotation=new THREE.Quaternion();
 const faceForward=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
 function release(){
  if(!avatar)return;
  avatar.setSeated(0);avatar.root.visible=false;avatar.root.rotation.x=0;avatar.root.rotation.z=0;
  avatar=null;seated=false;
 }
 function update(carObject,source,dt){
  const current=getDriver?.();
  if(current!==avatar){release();avatar=current;if(avatar)void avatar.load?.().catch(()=>{});}
  if(!avatar||!carObject)return;
  // Loading cannot reveal the avatar after leaving the race: only this
  // synchronous frame path changes visibility or the seated pose.
  if(avatar.modelStatus!=='ready'){avatar.root.visible=false;return;}
  if(!seated){avatar.cancelWave?.();avatar.setCarrying?.(false);avatar.setSeated(1);avatar.setOpacity(1);seated=true;}
  carObject.updateWorldMatrix(true,false);
  // Same offsets as free-driving seat(), converted from its +Y forward
  // physics coordinates to the renderer's -Z forward coordinates.
  seat.set(-.36,source.type==='sports'?-.43:-.10,-.15);carObject.localToWorld(seat);
  carObject.getWorldQuaternion(rotation);rotation.multiply(faceForward);
  avatar.snapHeading(carObject.rotation.y+Math.PI);avatar.update(Math.max(0,dt));
  avatar.root.position.copy(seat);avatar.root.quaternion.copy(rotation);avatar.root.visible=true;
 }
 return {update,release};
}
