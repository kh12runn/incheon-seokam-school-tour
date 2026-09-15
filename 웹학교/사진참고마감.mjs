// Approximate, editable geometry based on the 6-1 corridor reference; NOT stitched photography.
import {windowBays} from './창문배치.mjs';
export function addFourthFloorFinish(data,addBox){
  addMainFloorFinish(data,addBox,4);
}
export function addLowerMainFloorFinish(data,addBox){
  for(const floor of [1,2,3])addMainFloorFinish(data,addBox,floor);
}
function addMainFloorFinish(data,addBox,floor){
  const z=(floor-1)*data.floorHeight,wood=[.48,.32,.19],blue=[.46,.63,.67],white=[.78,.78,.73];
  const endX=103;
  const box=(name,b,color,kind='finish')=>addBox(`${floor}층 사진참고 `+name,b,color,kind,floor);
  box('복도 바닥',[0,0,z+.001,endX,3,z+.009],[.47,.48,.44]);
  box('교실쪽 노란선',[0,.16,z+.010,endX,.23,z+.014],[.93,.75,.13]);
  // Terrazzo tile joints; ceiling panel joints and rectangular fluorescent fixtures.
  for(let x=0;x<endX-.01;x+=.6)box('바닥 줄눈 '+x,[x,.24,z+.010,x+.009,3,z+.012],[.37,.39,.34]);
  for(let y=.6;y<3;y+=.6)box('바닥 가로줄 '+y,[0,y,z+.010,endX,y+.009,z+.012],[.37,.39,.34]);
  for(let x=0;x<endX-.02;x+=1.2)box('천장 이음 '+x,[x,0,z+3.112,x+.012,3,z+3.13],[.65,.67,.64],'ceiling');
  for(const y of [1,2])box('천장 가로이음 '+y,[0,y,z+3.112,endX,y+.012,z+3.13],[.65,.67,.64],'ceiling');
  for(let x=3;x<endX-.65;x+=5){
    box('조명틀 '+x,[x-.65,1.15,z+3.04,x+.65,1.85,z+3.115],[.69,.71,.69],'ceiling');
    box('형광등 '+x,[x-.57,1.22,z+3.025,x+.57,1.78,z+3.045],[1,.99,.9],'ceiling');
  }
  // Photo reference: pale aluminium window crossbars, only on facade bays.
  for(const [start,end] of windowBays(data,floor))for(let x=start;x<end-.3;x+=2){
    const b=Math.min(x+2,end);
    box('창가 유리 '+x,[x,2.96,z+.97,b,2.98,z+2.67],[.54,.65,.67]);
    for(const h of [.94,1.73,2.67])box('창가 알루미늄 가로틀 '+x+' '+h,[x-.03,2.91,z+h,b+.03,2.96,z+h+.045],[.76,.78,.77]);
    for(const u of [x-.03,b])box('창가 알루미늄 세로틀 '+u,[u,2.91,z+.94,u+.035,2.96,z+2.715],[.76,.78,.77]);
  }
  // Finish actual north partitions (including the right-hand research rooms),
  // following their existing door gaps rather than painting a wall over a door.
  for(const wall of data.boxes.filter(b=>b.floor===floor&&b.kind==='wall'&&
    b.bounds[1]>=2.8&&b.bounds[4]<=3.2&&b.bounds[0]>=0&&b.bounds[3]<=103&&
    /^(Wall_|Lintel_|[1-4]F_NorthSill)/.test(b.name))){
    const b=wall.bounds;
    for(const [lo,hi,color] of [[0,.86,blue],[.86,3.13,white]]){
      const bottom=Math.max(b[2],z+lo),top=Math.min(b[5],z+hi);
      if(top>bottom)box('북측 '+wall.name+' '+lo,[b[0],2.85,bottom,b[3],2.875,top],color);
    }
  }
  // Only south-facing MAIN rooms: never repaint the ANNEX or cover the lobby.
  for(const room of data.rooms.filter(r=>r.floor===floor+'F'&&r.building!=='ANNEX'&&
    ['classroom','special_room'].includes(r.type)&&r.bounds[3]===0&&r.bounds[0]>=0)){
    const [x0,x1]=room.bounds,door=x0+(x1-x0)*.35,left=door-.68,right=door+.68;
    for(const [a,b] of [[x0,left-.06],[right+.06,x1]]){
      box(room.name+' 하부벽',[a,.105,z,b,.135,z+.86],blue);
      box(room.name+' 흰벽',[a,.105,z+.86,b,.13,z+2.95],white);
      box(room.name+' 걸레받이',[a,.136,z,b,.153,z+.12],blue);
    }
    // Frames do not close the usable door opening.
    for(const x of [left-.06,right])box(room.name+' 문틀 '+x,[x,.135,z,x+.06,.19,z+2.29],wood);
    box(room.name+' 문틀 상부',[left-.06,.135,z+2.25,right+.06,.19,z+2.32],wood);
    const a=right+.25,b=x1-.3;
    if(b>a){
      box(room.name+' 복도창',[a,.14,z+1.05,b,.16,z+2.22],[.76,.83,.81]);
      for(const h of [1.02,2.22])box(room.name+' 창 가로틀 '+h,[a-.04,.16,z+h,b+.04,.21,z+h+.05],wood);
      for(let x=a;x<=b;x+=(b-a)/3)box(room.name+' 창 세로틀 '+x,[x-.025,.16,z+1.02,x+.025,.21,z+2.27],wood);
    }
  }
  for(const cabinet of shoeCabinets(data,floor)){
    const {x,y,width,depth,name,north}=cabinet,b=x+width,back=north?y+depth-.025:y;
    box(name+' 신발장 뒷판',[x,back,z+.08,b,back+.025,z+1.01],[.25,.16,.09],'wall');
    for(let row=0;row<=3;row++){
      const h=.08+row*.30;
      box(name+' 신발장 선반 '+row,[x,y,z+h,b,y+depth,z+h+.03],wood,'wall');
    }
    for(let column=0;column<=7;column++){
      const u=x+column*.39;
      box(name+' 신발장 칸막이 '+column,[u,y,z+.08,u+.03,y+depth,z+1.01],wood,'wall');
    }
    box(name+' 신발장 받침',[x+.05,y+.06,z,b-.05,y+depth-.06,z+.08],[.2,.15,.1],'wall');
  }
}

// Exactly one 7-column × 3-row unit per MAIN classroom on floors 3 and 4.
// All cabinets face the corridor from the actual window bays. Pack nearby units
// with gaps when a classroom is opposite a staircase, never on the classroom side.
export function shoeCabinets(data,floor){
  if(![3,4].includes(floor))return [];
  const width=7*.39+.03,slots=windowBays(data,floor).flatMap(([a,b])=>{
    const count=Math.floor((b-a-.4)/(width+.65)),result=[];
    for(let i=0;i<count;i++)result.push(a+.2+i*(width+.65));return result;
  });
  const rooms=data.rooms.filter(r=>r.building==='MAIN'&&r.floor===floor+'F'&&r.type==='classroom').sort((a,b)=>a.bounds[0]-b.bounds[0]);
  return rooms.map(r=>{
    const center=(r.bounds[0]+r.bounds[1])/2;
    slots.sort((a,b)=>Math.abs(a+width/2-center)-Math.abs(b+width/2-center));
    const x=slots.shift();if(x===undefined)throw new Error('창가 신발장 공간 부족: '+r.name);
    return {roomId:r.id,name:r.name,columns:7,rows:3,north:true,width,depth:.42,x,y:2.38};
  });
}
