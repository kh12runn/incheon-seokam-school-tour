import {SAPBroadphase,Body} from './외부도구/cannon-es.mjs';
// School has thousands of static walls but at most a dozen moving balls/cars.
// Do not enumerate static-static pairs. Retain Cannon filtering/narrowphase,
// AABB conservatism, sleeping-body wake-up contacts and the 120 Hz time step.
export class ActiveBodyBroadphase extends SAPBroadphase{
 constructor(world){super(world);this.useBoundingBoxes=true;this.lastComparisons=0;}
 collisionPairs(world,p1,p2){
  if(this.dirty){this.sortList();this.dirty=false;}
  const bodies=this.axisList,awake=b=>!(b.type&Body.STATIC)&&b.sleepState!==Body.SLEEPING;
  this.lastComparisons=0;
  for(let i=0;i<bodies.length;i++){
   const a=bodies[i];if(!awake(a))continue;
   for(let j=0;j<bodies.length;j++){
    const b=bodies[j];if(i===j||(j<i&&awake(b)))continue;
    this.lastComparisons++;
    if(b.aabb.lowerBound.x>a.aabb.upperBound.x)break;
    if(b.aabb.upperBound.x<a.aabb.lowerBound.x||!this.needBroadphaseCollision(a,b))continue;
    this.intersectionTest(i<j?a:b,i<j?b:a,p1,p2);
   }
  }
 }
 aabbQuery(world,aabb,result=[]){
  if(this.dirty){this.sortList();this.dirty=false;}
  for(const b of this.axisList){
   if(b.aabbNeedsUpdate)b.updateAABB();
   if(b.aabb.lowerBound.x>aabb.upperBound.x)break;
   if(b.aabb.upperBound.x>=aabb.lowerBound.x&&b.aabb.overlaps(aabb))result.push(b);
  }
  return result;
 }
}
