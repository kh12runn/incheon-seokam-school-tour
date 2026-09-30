import {reversedClassroom} from './교실방향.mjs';
export function teacherOfficeChairs(data,boxes,colliders){
  const result=[];
  for(const room of data.rooms.filter(r=>r.type==='classroom')){
    const [x0,x1,y0,y1,z]=room.bounds,old=boxes.find(b=>b.spaceId===room.id&&/교사용 검정의자$/.test(b.name));
    let x,y,angle;
    if(old){const a=old.bounds;x=(a[0]+a[3])/2;y=(a[1]+a[4])/2;angle=reversedClassroom(room)?Math.PI/2:-Math.PI/2;}
    else if(room.building==='ANNEX'){x=x1-6.04;y=y1-.37;angle=Math.PI;}
    else{x=x0+.55;y=y0+2.35;angle=-Math.PI/2;}
    for(const list of [boxes,colliders]){const kept=list.filter(b=>!(b.spaceId===room.id&&/교사용 (검정의자|의자)/.test(b.name)));list.splice(0,list.length,...kept);}
    // The photographed annex lectern was very close to the board. Shift only
    // its desk/monitor assembly 17cm to leave a non-intersecting chair recess.
    if(room.building==='ANNEX')for(const list of [boxes,colliders])for(let i=0;i<list.length;i++){
      const b=list[i];if(b.spaceId===room.id&&/교탁 (수납장|검정 상판)|듀얼 화면|화면 받침/.test(b.name)){
        const bounds=[...b.bounds];bounds[1]-=.17;bounds[4]-=.17;list[i]={...b,bounds};
      }
    }
    // Previously unfurnished annex rooms receive only this small teaching station.
    if(room.building==='ANNEX'&&!boxes.some(b=>b.spaceId===room.id&&/듀얼 화면 외함/.test(b.name))){
      const add=(name,b,color,solid=false)=>{const item={name:room.name+' 교사자리 '+name,spaceId:room.id,interiorRoom:room.id,floor:parseInt(room.floor),kind:'detail',bounds:b,color};boxes.push(item);if(solid)colliders.push({...item,kind:'furniture'});};
      add('교사용 책상',[x-.90,y1-1.39,z+.05,x+.90,y1-.64,z+.80],[.71,.61,.47],true);
      for(const offset of [-.39,.39]){
        add('듀얼 모니터',[x+offset-.33,y1-1.11,z+1.02,x+offset+.33,y1-1.05,z+1.43],[.12,.16,.17]);
        add('모니터 화면',[x+offset-.29,y1-1.048,z+1.06,x+offset+.29,y1-1.043,z+1.39],[.075,.11,.12]);
        add('화면 지지대',[x+offset-.025,y1-1.09,z+.8,x+offset+.025,y1-1.05,z+1.08],[.34,.39,.38]);
      }
    }
    const pose={roomId:room.id,x,y,z,angle,floor:parseInt(room.floor)};result.push(pose);
    colliders.push({name:room.name+' 바퀴 사무의자 충돌',spaceId:room.id,interiorRoom:room.id,floor:pose.floor,kind:'furniture',bounds:[x-.21,y-.21,z,x+.21,y+.21,z+1.03]});
  }return result;
}
export function exteriorClassSigns(data){
  return data.rooms.filter(r=>r.type==='classroom').map(room=>{
    const [x0,x1,y0,y1,z]=room.bounds,annex=room.building==='ANNEX',north=y0>=3;
    const original=data.boxes.filter(b=>b.spaceId===room.id&&b.name.startsWith('Window_')).sort((a,b)=>annex?a.bounds[1]-b.bounds[1]:a.bounds[0]-b.bounds[0]);
    const pane=original[Math.floor(original.length/2)]?.bounds;
    return {roomId:room.id,text:room.name.replace(/ 교실$/,''),floor:parseInt(room.floor),width:1.02,height:.36,
      x:annex?x0-.145:pane?(pane[0]+pane[3])/2:(x0+x1)/2,
      y:annex?(pane?(pane[1]+pane[4])/2:(y0+y1)/2):north?y1+.145:y0-.145,
      z:z+1.72,angle:annex?-Math.PI/2:north?Math.PI:0};
  });
}
