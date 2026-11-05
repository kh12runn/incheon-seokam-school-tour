// Finish existing geometry only. Never add a collision slab over a doorway,
// stairwell or roof opening. Reviewed photo finishes take precedence.
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const ivory=rgb('#e5e2d8'),blue=rgb('#aebed0'),stone=rgb('#bcb7a6');
export function circulationFinish(box){
  if(box.material||box.interiorRoom||/사진|신발장|창틀|알루미늄|유리/.test(box.name))return box;
  const stair=/^(MAIN|ANNEX)_STAIR_[A-Z] /.test(box.name);
  const corridor=/CORRIDOR|CONNECTOR|B1_MAIN_FOYER/.test(box.spaceId??box.name);
  const corner=/외피 보강/.test(box.name)&&(
    box.bounds[0]<.2&&box.bounds[3]>.0&&box.bounds[1]>=-.2&&box.bounds[4]<=3.2||
    box.bounds[1]<-72.8&&box.bounds[4]>-73.2&&box.bounds[0]>=99.8);
  if(!stair&&!corridor&&!corner)return box;
  if(stair&&box.kind==='step'){
    // Treads are 12 cm deep but rise ~14 cm: extend only their underside so
    // light cannot leak through the small riser gaps. Walking physics stays.
    const bounds=[...box.bounds];bounds[2]-=.035;
    return {...box,bounds,color:stone,material:'terrazzo',completionFinish:true};
  }
  const ceiling=box.kind==='ceiling'||/지붕/.test(box.name);
  const floor=['floor','slab'].includes(box.kind)&&!ceiling;
  const wall=box.kind==='wall'||corner;
  if(!ceiling&&!floor&&!wall)return box;
  return {...box,color:floor?stone:stair&&/중앙벽|최상층 막음/.test(box.name)?blue:ivory,
    material:floor?'terrazzo':ceiling?'staff_ceiling':'paint',completionFinish:true};
}

// End caps can span both a classroom and its corridor in the exported model.
// Coat just the corridor-facing portion of an EXISTING wall, in the same
// three bands as the adjacent photographed corridor. Window/door cuts survive.
export function circulationEndCaps(boxes,data){
  const result=[];
  for(const wall of boxes){
    const match=wall.name.match(/^([1-4])층 외피 보강 ([xy]),(-?[\d.]+),(-?1) /);if(!match)continue;
    const floor=+match[1],axis=match[2]==='x'?0:1,span=1-axis,n=+match[4],edge=+match[3],a=wall.bounds,z=(floor-1)*data.floorHeight;
    for(const room of data.rooms.filter(r=>r.floor===floor+'F'&&r.type==='corridor')){
      if(axis!==(room.building==='MAIN'?0:1))continue;
      const b=room.bounds,side=axis===0?[b[0],b[1]]:[b[2],b[3]];
      if(Math.abs(edge-side[n<0?0:1])>.01)continue;
      const range=span===0?[b[0],b[1]]:[b[2],b[3]],lo=Math.max(a[span],range[0]),hi=Math.min(a[span+3],range[1]);if(hi-lo<.05)continue;
      const main=room.building==='MAIN',face=a[axis+(n>0?0:3)]-n*.006;
      for(const [bottom,top,color] of [[0,.13,rgb(main?'#758f90':'#292e2c')],[.13,main?.86:1.03,main?[.46,.63,.67]:blue],[main?.86:1.03,3.13,main?[.78,.78,.73]:ivory]]){
        const low=Math.max(a[2],z+bottom),high=Math.min(a[5],z+top);if(high<=low)continue;
        const bounds=[...a];bounds[span]=lo;bounds[span+3]=hi;bounds[axis]=Math.min(face,face-n*.008);bounds[axis+3]=Math.max(face,face-n*.008);bounds[2]=low;bounds[5]=high;
        result.push({name:'복도 끝 연결 마감 '+room.id+' '+wall.name+' '+bottom,bounds,color,material:'paint',kind:'finish',floor,completionFinish:true});
      }
    }
  }
  return result;
}
