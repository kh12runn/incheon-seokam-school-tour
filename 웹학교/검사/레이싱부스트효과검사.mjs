import assert from 'node:assert/strict';
import * as T from '../외부도구/three.module.js';
import {createBoostFlames} from '../레이싱부스트효과.mjs';
import {CAR_DIMENSIONS} from '../주차장.mjs';
globalThis.document={createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})};
const parent=new T.Group(),fleet=new T.Group(),effect=createBoostFlames(parent),cars=[];parent.add(fleet);
for(let i=0;i<6;i++){
 const type=['sports','sedan','suv','compact'][i%4],obj=new T.Group();obj.name='race-'+i;obj.position.set(i*10,.2,i*-4);obj.rotation.set(.08,i*Math.PI/3,-.04,'YXZ');fleet.add(obj);
 cars.push({id:i,source:{type},dimensions:CAR_DIMENSIONS[type],boosting:true,finish:null,speed:18});
}
effect.update(cars,fleet,.1,1);assert.equal(effect.getState().activeCars,6);assert.equal(effect.getState().drawCalls,2);
const ribbons=effect.group.getObjectByName('배기구 화염'),matrix=new T.Matrix4(),local=new T.Vector3(),world=new T.Vector3(),inverse=new T.Matrix4();
for(let i=0;i<6;i++){
 const car=cars[i],obj=fleet.children[i];inverse.copy(obj.matrix).invert();
 for(let j=0;j<6;j++){
  ribbons.getMatrixAt(i*6+j,matrix);world.set(0,0,0).applyMatrix4(matrix);local.copy(world).applyMatrix4(inverse);
  assert(Math.abs(local.z-(car.dimensions.length/2+.08))<.00001,'jet starts behind bumper, for every heading/type');
  assert(Math.abs(Math.abs(local.x)-car.dimensions.width*.29)<.00001,'paired rear nozzles');
  local.set(0,0,1).applyMatrix4(matrix).applyMatrix4(inverse);assert(local.z>car.dimensions.length/2+1,'flame points backwards');
 }
}
const ids=effect.group.children.map(o=>[o.uuid,o.geometry.uuid,o.material.uuid]);
for(let i=0;i<500;i++)effect.update(cars,fleet,1/60,i/60);
assert.deepEqual(effect.group.children.map(o=>[o.uuid,o.geometry.uuid,o.material.uuid]),ids,'no growing mesh/geometry allocations');
cars.forEach(c=>c.boosting=false);for(let i=0;i<15;i++)effect.update(cars,fleet,1/60,10+i/60);assert.equal(effect.getState().visible,false,'release extinguishes flame');
cars[0].boosting=true;effect.update(cars,fleet,.1,11);assert(effect.getState().playerVisible);effect.update(cars,fleet,.016,11,{paused:true});assert.equal(effect.getState().visible,false);
effect.update(cars,fleet,.1,12);effect.clear();assert.equal(effect.getState().ribbons,0);
effect.dispose();assert.equal(effect.group.parent,null);
console.log(JSON.stringify({ok:true,vehicles:6,allRearNozzles:true,boundedDrawCalls:2,releasePauseReset:true,resourcesReused:true}));
