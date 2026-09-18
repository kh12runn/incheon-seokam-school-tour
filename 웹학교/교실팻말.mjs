// Door-adjacent projecting signs. Coordinates: x/y horizontal, z height.
export function classroomSignPoses(data){
  return data.rooms.filter(r=>r.type==='classroom').map(room=>{
    const [x0,x1,y0,y1,z]=room.bounds,annex=room.building==='ANNEX',north=y0>=3;
    const door=annex?y0+(y1-y0)*.35:x0+(x1-x0)*.35;
    const point=annex?{x:100.48,y:door+.79,z:z+2.45}
      :{x:door+.79,y:north?y0-.48:y1+.48,z:z+2.45};
    return {roomId:room.id,text:room.name.replace(/ 교실$/,''),floor:parseInt(room.floor),point,
      angle:annex?0:Math.PI/2,width:.48,height:.54,annex,north,
      wall:annex?{x:100.22,y:point.y,z:point.z}:{x:point.x,y:north?y0-.18:y1+.18,z:point.z}};
  });
}
