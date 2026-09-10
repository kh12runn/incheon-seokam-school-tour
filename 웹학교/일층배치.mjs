// Targeted web correction from the supplied 1F plan. Other rooms remain untouched.
// Measurements are approximate; Blender's exported baseline is preserved.
export const LOBBY_OPEN={left:41,right:49,height:2.95};
export const GROUND_PLAN=[
  {id:'1F_PRINTING',name:'발간실',bounds:[65,68,-7,0,0,3.15],building:'MAIN'},
  {id:'1F_MEAL_CART_STORAGE',name:'배식차보관실',bounds:[68,82,-7,0,0,3.15],building:'MAIN',mergedFrom:['교원휴게실','배식차 보관실']},
  {id:'1F_CAFETERIA',name:'식당',bounds:[82,100,-7,0,0,3.15],building:'EAST_WING'},
  {id:'1F_COOKING',name:'조리실',bounds:[80,100,3,10,0,3.15],building:'EAST_WING',mergedFrom:['영양사실','비품창고','조리실']}
];
export function applyGroundFloorPlan(source){
  if(source.groundPlanVersion===1)return source;
  const ids=new Set([...GROUND_PLAN.map(r=>r.id),'1F_NUTRITION']);
  const rooms=source.rooms.filter(r=>!ids.has(r.id)).map(r=>r.id==='1F_MAIN_LOBBY'?{...r,name:'중앙현관',openLobby:true}:r);
  const boxes=source.boxes.filter(b=>{
    if(ids.has(b.spaceId))return false;
    // Remove the entire corridor-facing partition, lintel and narrow door frame.
    return !(b.spaceId==='1F_MAIN_LOBBY'&&b.kind==='wall'&&b.bounds[1]>=-.2&&b.bounds[4]<=.2);
  });
  const labels=source.labels.filter(l=>!ids.has(l.spaceId)).map(l=>{
    if(l.spaceId!=='1F_MAIN_LOBBY')return l;
    return {...l,text:'중앙현관',...(l.name.startsWith('Sign_')?{position:[45,-7.25,3.04],width:2.1,height:.2,quaternion:[Math.SQRT1_2,0,0,Math.SQRT1_2]}:{})};
  });
  const wall=[.83,.85,.83],frame=[.54,.38,.23];
  for(const item of GROUND_PLAN){
    const room={...item,bounds:[...item.bounds],floor:'1F',type:'special_room'};rooms.push(room);
    const [x0,x1,y0,y1,z,top]=room.bounds,north=y1===0,doorY=north?y1:y0,backY=north?y0:y1;
    const door=x0+(x1-x0)*.35,left=door-.6,right=door+.6;
    const box=(name,bounds,kind='wall',color=wall)=>boxes.push({name:name+'_'+room.id,spaceId:room.id,floor:1,kind,bounds,color,collision:kind==='wall'});
    box('Floor',[x0,y0,z-.2,x1,y1,z],'floor',north?[.76,.74,.67]:[.71,.76,.72]);
    box('Wall_front_left',[x0,doorY-.09,z,left,doorY+.09,top]);
    box('Wall_front_right',[right,doorY-.09,z,x1,doorY+.09,top]);
    box('Lintel',[left,doorY-.09,z+2.25,right,doorY+.09,top]);
    box('Wall_back',[x0,backY-.09,z,x1,backY+.09,top]);
    box('Wall_left',[x0-.09,y0,z,x0+.09,y1,top]);
    box('Wall_right',[x1-.09,y0,z,x1+.09,y1,top]);
    for(const x of [left,right])box('Doorframe_'+x,[x-.0375,doorY-.04,z,x+.0375,doorY+.04,z+2.2],'wall',frame);
    const windowCount=Math.max(1,Math.floor((x1-x0)/2.7)),step=(x1-x0)/windowCount;
    for(let i=0;i<windowCount;i++){
      const y=backY+(north?-.105:.105);
      box('Window_'+i,[x0+i*step+.15,y-.03,z+.975,x0+(i+1)*step-.15,y+.03,z+2.325],'wall',[.35,.59,.69]);
    }
    labels.push({name:'Sign_'+room.id,spaceId:room.id,floor:1,text:room.name,position:[door,doorY+(north?.13:-.13),2.59],quaternion:north?[0,-Math.SQRT1_2,-Math.SQRT1_2,0]:[Math.SQRT1_2,0,0,Math.SQRT1_2],width:Math.min(x1-x0-.2,room.name.length*.28),height:.24});
    labels.push({name:'Label_'+room.id,spaceId:room.id,floor:1,text:room.name,position:[(x0+x1)/2,(y0+y1)/2,.025],quaternion:[0,0,0,1],width:Math.min(x1-x0-.3,room.name.length*.65),height:.8});
  }
  return {...source,groundPlanVersion:1,rooms,boxes,labels};
}
