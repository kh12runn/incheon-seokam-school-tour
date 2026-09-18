import {faceMonitorsTowardBoard} from './모니터방향.mjs';
import {reversedClassroom} from './교실방향.mjs';

// Keep the TV at the teaching/exterior corner, including the reversed 4-3 room.
export function classroomTVPose(room){
  const [x0,x1,y0,y1,z]=room.bounds,north=y0>=3,sign=north?-1:1,dir=reversedClassroom(room)?-1:1;
  // Annex teaching wall is high Y; exterior windows are on low X.
  if(room.building==='ANNEX')return {x:x0+.90,y:y1-.90,z:z+2.255,
    rotation:-3*Math.PI/4,normal:[Math.SQRT1_2,-Math.SQRT1_2]};
  return {x:dir<0?x1-.90:x0+.90,y:(north?y1:y0)+sign*.90,z:z+2.255,
    rotation:Math.atan2(sign,dir)-Math.PI/2,normal:[dir*Math.SQRT1_2,sign*Math.SQRT1_2]};
}

export function classroomDevices(source,rooms){
  const boxes=faceMonitorsTowardBoard(source),result=[];
  for(const box of boxes){
    result.push(box);
    if(!/컴퓨터 모니터$|벽걸이 화면(?: 테두리)?$/.test(box.name))continue;
    const room=rooms.find(r=>r.type==='classroom'&&
      (r.id===box.interiorRoom||r.id===box.spaceId||r.id==='4F_6-4'&&box.name.startsWith('6-4 실내 ')));
    if(!room)continue;
    const prefix=box.name.replace(/컴퓨터 모니터$/,'');
    if(box.name.endsWith('컴퓨터 모니터')&&!boxes.some(b=>b.name.endsWith('두 번째 검정 모니터')&&
      (b.interiorRoom===room.id||b.spaceId===room.id||b.name===prefix+'두 번째 검정 모니터'))){
      const north=room.bounds[2]>=3,dy=(north?1:-1)*.77*(reversedClassroom(room)?-1:1);
      for(const original of [box,boxes.find(b=>b.name===prefix+'모니터 화면')].filter(Boolean)){
        const bounds=[...original.bounds];bounds[1]+=dy;bounds[4]+=dy;
        result.push({...original,bounds,name:prefix+(original===box?'두 번째 검정 모니터':'추가 모니터 화면')});
      }
    }
    if(/벽걸이 화면(?: 테두리)?$/.test(box.name)){
      const pose=classroomTVPose(room),screen=box.name.endsWith('벽걸이 화면');
      const width=screen?1.22:1.33,height=screen ? .68 : .79,depth=screen ? .006 : .17;
      const offset=screen ? .093 : 0,x=pose.x+pose.normal[0]*offset,y=pose.y+pose.normal[1]*offset;
      result[result.length-1]={...box,bounds:[x-width/2,y-depth/2,pose.z-height/2,x+width/2,y+depth/2,pose.z+height/2],rotation:[0,0,pose.rotation],cornerTV:true};
    }
  }
  // Annex rooms did not use the main-building furniture template. Give every
  // classroom the same solid, two-sided casing and inward-facing screen.
  for(const room of rooms.filter(r=>r.type==='classroom'&&r.building==='ANNEX')){
    if(result.some(b=>b.spaceId===room.id&&b.cornerTV))continue;
    const pose=classroomTVPose(room);
    for(const screen of [false,true]){
      const width=screen?1.22:1.33,height=screen?.68:.79,depth=screen?.006:.17,offset=screen?.093:0;
      const x=pose.x+pose.normal[0]*offset,y=pose.y+pose.normal[1]*offset;
      result.push({name:room.name+' 공통 '+(screen?'벽걸이 화면':'벽걸이 화면 테두리'),spaceId:room.id,floor:parseInt(room.floor),kind:'detail',
        bounds:[x-width/2,y-depth/2,pose.z-height/2,x+width/2,y+depth/2,pose.z+height/2],
        color:screen?[.075,.12,.14]:[.12,.14,.15],material:'paint',rotation:[0,0,pose.rotation],cornerTV:true});
    }
  }
  return result;
}
