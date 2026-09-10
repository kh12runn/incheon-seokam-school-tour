// Blender x/y/z coordinates. A padded camera boom cannot cross walls or glazing.
export function segmentBox(start,end,bounds,padding=0){
  let lo=0,hi=1;
  for(let axis=0;axis<3;axis++){
    const key=['x','y','z'][axis],d=end[key]-start[key],min=bounds[axis]-padding,max=bounds[axis+3]+padding;
    if(Math.abs(d)<1e-9){if(start[key]<min||start[key]>max)return Infinity;continue;}
    let a=(min-start[key])/d,b=(max-start[key])/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return Infinity;
  }
  return lo;
}
export function createCameraCollision(boxes,radius=.16){
  const size=4,grid=new Map();
  for(const box of boxes){const b=box.bounds;
    for(let x=Math.floor((b[0]-radius)/size);x<=Math.floor((b[3]+radius)/size);x++)for(let y=Math.floor((b[1]-radius)/size);y<=Math.floor((b[4]+radius)/size);y++){
      const key=x+','+y;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(box);
    }
  }
  return (target,desired)=>{
    const nearby=new Set();
    for(let x=Math.floor(Math.min(target.x,desired.x)/size);x<=Math.floor(Math.max(target.x,desired.x)/size);x++)for(let y=Math.floor(Math.min(target.y,desired.y)/size);y<=Math.floor(Math.max(target.y,desired.y)/size);y++)for(const b of grid.get(x+','+y)??[])nearby.add(b);
    let fraction=1;
    for(const b of nearby)fraction=Math.min(fraction,segmentBox(target,desired,b.bounds,radius));
    const length=Math.hypot(desired.x-target.x,desired.y-target.y,desired.z-target.z);
    const safe=Math.max(0,Math.min(1,fraction-(fraction<1?.035/Math.max(length,.01):0)));
    return {x:target.x+(desired.x-target.x)*safe,y:target.y+(desired.y-target.y)*safe,z:target.z+(desired.z-target.z)*safe,distance:length*safe,blocked:safe<1};
  };
}
export function thirdPersonDesired(target,yaw,pitch,distance){
  const elevation=Math.max(-.13,Math.min(1.03,.25-pitch)),horizontal=Math.cos(elevation)*distance;
  return {x:target.x+Math.sin(yaw)*horizontal+Math.cos(yaw)*.18,y:target.y-Math.cos(yaw)*horizontal+Math.sin(yaw)*.18,z:target.z+Math.sin(elevation)*distance};
}
