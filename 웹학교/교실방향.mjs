export const REVERSED_CLASSROOM='4F_4-3';
export const reversedClassroom=room=>room.id===REVERSED_CLASSROOM;
export function reverseClassroom(config){
  if(!reversedClassroom(config.room))return config;
  const {room,frame}=config,[x0,x1,y0,y1]=room.bounds;
  const turn=p=>({...p,x:x0+x1-p.x,y:y0+y1-p.y});
  const shell=/원목 마루|천장|앞뒤|창 아래|창 위|복도쪽|나무창틀|반투명 복도창|윗창|창 세로틀/;
  const rotate=b=>{
    if(shell.test(b.name))return b; // Never rotate doors, windows or the room shell.
    const a=b.bounds;
    return {...b,bounds:[x0+x1-a[3],y0+y1-a[4],a[2],x0+x1-a[0],y0+y1-a[1],a[5]],boardDirection:1,
      ...(b.rotation?{rotation:[b.rotation[0],b.rotation[1],b.rotation[2]+Math.PI]}:{})};
  };
  const spawn=turn(config.spawn);
  return {...config,layoutRotation:Math.PI,architecturalFrame:frame,
    frame:{...frame,point:(...args)=>turn(frame.point(...args))},
    boxes:config.boxes.map(rotate),colliders:config.colliders.map(rotate),
    desks:config.desks.map(turn),chairs:config.chairs.map(turn),spawn,
    // The existing door stays in place; use the clear perimeter aisle to reach
    // the rotated seating block rather than routing straight through a desk.
    entryWaypoints:[{x:config.entry.x,y:y0+.58,z:spawn.z},{x:x1-3.2,y:y0+.58,z:spawn.z},{x:x1-3.2,y:spawn.y,z:spawn.z}],
  };
}
