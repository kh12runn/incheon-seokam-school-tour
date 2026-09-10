// Close the union of room footprints, not each room: shared doors and stair entries stay open.
import {LOBBY_OPEN} from './일층배치.mjs';
export function sealEnvelope(data,addBox){
  const wall=[.86,.87,.84],ceiling=[.93,.93,.89];
  for(let floor=1;floor<=4;floor++){
    const rooms=data.rooms.filter(r=>parseInt(r.floor)===floor);
    const z=(floor-1)*data.floorHeight,top=z+data.floorHeight;
    const xs=[...new Set(rooms.flatMap(r=>r.bounds.slice(0,2)))].sort((a,b)=>a-b);
    const ys=[...new Set(rooms.flatMap(r=>r.bounds.slice(2,4)))].sort((a,b)=>a-b);
    const occupied=(x,y)=>rooms.some(r=>x>r.bounds[0]&&x<r.bounds[1]&&y>r.bounds[2]&&y<r.bounds[3]);
    const cells=new Set();
    for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++)
      if(occupied((xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2))cells.add(i+','+j);
    const segments=new Map();
    const edge=(axis,c,normal,a,b)=>{
      const key=[axis,c,normal].join(',');
      if(!segments.has(key))segments.set(key,[]);segments.get(key).push([a,b]);
    };
    for(const key of cells){const [i,j]=key.split(',').map(Number);
      if(!cells.has((i-1)+','+j))edge('x',xs[i],-1,ys[j],ys[j+1]);
      if(!cells.has((i+1)+','+j))edge('x',xs[i+1],1,ys[j],ys[j+1]);
      if(!cells.has(i+','+(j-1)))edge('y',ys[j],-1,xs[i],xs[i+1]);
      if(!cells.has(i+','+(j+1)))edge('y',ys[j+1],1,xs[i],xs[i+1]);
    }
    for(const [key,ranges] of segments){
      const [axis,cs,ns]=key.split(','),c=Number(cs),n=Number(ns),merged=[];
      for(const range of ranges.sort((a,b)=>a[0]-b[0])){
        const prev=merged.at(-1);if(prev&&Math.abs(prev[1]-range[0])<.001)prev[1]=range[1];else merged.push([...range]);
      }
      const put=(a,b,lo=z-.03)=>{
        if(b<=a)return;
        // Outer backing preserves existing window panes visible from inside. Ends overlap at corners.
        const c0=c+n*.105,c1=c+n*.145;
        const bounds=axis==='x'?[Math.min(c0,c1),a-.15,lo,Math.max(c0,c1),b+.15,top+.02]
          :[a-.15,Math.min(c0,c1),lo,b+.15,Math.max(c0,c1),top+.02];
        addBox(`${floor}층 외피 보강 ${key} ${a} ${lo}`,bounds,wall,'wall',floor);
      };
      for(const [a,b] of merged){
        if(floor===1&&axis==='y'&&c===-7&&a<LOBBY_OPEN.right&&b>LOBBY_OPEN.left){
          put(a,Math.min(b,LOBBY_OPEN.left-.15));put(Math.max(a,LOBBY_OPEN.right+.15),b);put(Math.max(a,LOBBY_OPEN.left-.15),Math.min(b,LOBBY_OPEN.right+.15),LOBBY_OPEN.height);
        }else put(a,b);
      }
    }
    for(const room of rooms){
      if(room.type==='stair')continue; // A slab here would obstruct the staircase.
      const [x0,x1,y0,y1]=room.bounds;
      addBox(`${floor}층 천장 접합 ${room.id}`,[x0-.02,y0-.02,z+3.13,x1+.02,y1+.02,top],ceiling,'ceiling',floor);
    }
  }
}
