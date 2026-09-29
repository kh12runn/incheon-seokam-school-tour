import {openClassroomWindows,subtractBox} from './창문배치.mjs';
export const AUDIO_ID='2F_AUDIO_VISUAL';
// West-facing entrance beside stair A: entering toward -X places +Y stage right.
export const AUDIO_ENTRY={bounds:[-3.2,-.10,3.4,0,3.10,6.55],spawn:{x:-.65,y:1.5,z:3.4},yaw:Math.PI/2};
export const AUDIO_REFERENCE={count:6,revision:'6ae6d36e-ee6e-4584-ab60-81e9295fe677',
  imageIds:['2b5b83ac-eb06-4418-a0b5-76dec9be652a','46df32d1-c11d-4fed-ae55-5b2d4112000c','cbd9cb05-b5e3-4e7c-bc22-20a00c69d71a','c8847b21-ff32-43a9-a536-8ee034025e26','9c880966-c789-445b-aa85-ee27bdc55f6f','344f061f-568e-4fb9-91eb-38b912fe4dc8'],
  approximateDimensions:true,seatCountIsApproximate:true,features:['빨간 객석과 아이보리색 등받이','중앙·가로 통로','목재 무대와 회색 배경','하부 목재·상부 회색 흡음벽','창가 블라인드','천장 빔프로젝터·무대 조명','국악기와 이동식 탁자']};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function audioRoomInterior(data,worldBoxes,worldColliders,addBox,surfaces){
  const room=data.rooms.find(r=>r.id===AUDIO_ID);if(!room)return null;
  // Existing auditorium doorway was covered by the neighbouring room's duplicate
  // shared wall/window. Clear only that already-defined doorway, not a new route.
  const doorCut=[-3.16,-1.61,3.4,-2.88,-.49,5.60];
  const replacements=new Map(worldBoxes.map(b=>[b,b.kind==='wall'?subtractBox(b,doorCut):[b]]));
  for(const list of [worldBoxes,worldColliders]){const next=list.flatMap(b=>replacements.get(b)??[b]);list.splice(0,list.length,...next);}
  // Eliminate the dog-leg and second doorway across the entrance bay. Keep
  // the rest of the neighbouring room and both exterior/floor envelopes intact.
  const entryCut=[-3.17,-.10,3.4,-2.88,3.10,6.55];
  const entryParts=new Map(worldBoxes.map(b=>[b,[AUDIO_ID,'2F_KOREAN_CLASS'].includes(b.spaceId)&&b.kind==='wall'?subtractBox(b,entryCut):[b]]));
  for(const list of [worldBoxes,worldColliders]){const next=list.flatMap(b=>entryParts.get(b)??[b]);list.splice(0,list.length,...next);}
  // This is the single main entrance directly beside the stair/corridor.
  const corridorCut=[-.17,.75,3.4,.17,2.25,5.70];
  const corridorParts=new Map(worldBoxes.map(b=>[b,b.spaceId==='2F_KOREAN_CLASS'&&b.kind==='wall'?subtractBox(b,corridorCut):[b]]));
  for(const list of [worldBoxes,worldColliders]){const next=list.flatMap(b=>corridorParts.get(b)??[b]);list.splice(0,list.length,...next);}
  for(const [name,bounds] of [
    ['왼 문틀',[-.12,.70,3.4,.12,.75,5.75]],
    ['오른 문틀',[-.12,2.25,3.4,.12,2.30,5.75]],
    ['윗 문틀',[-.12,.70,5.70,.12,2.30,5.75]],
  ])addBox('시청각실 복도 연결 '+name,bounds,rgb('#967b59'),'wall',2);
  // The room is at the west end of the MAIN wing; reuse the existing west-window
  // cutter without changing its actual building, floor, footprint or entrance.
  openClassroomWindows({...data,rooms:[{...room,type:'classroom',building:'ANNEX'}],boxes:data.boxes.filter(b=>b.spaceId===AUDIO_ID)},worldBoxes,worldColliders,addBox);
  const boxes=[],colliders=[],seats=[],drums=[];
  const add=(name,b,color,material='paint',solid=false)=>{
    const item={name:'시청각실 사진참고 '+name,spaceId:AUDIO_ID,interiorRoom:AUDIO_ID,floor:2,kind:'detail',bounds:[b[0],b[1],3.4+b[2],b[3],b[4],3.4+b[5]],color:rgb(color),material};
    boxes.push(item);if(solid)colliders.push({...item,kind:'furniture'});return item;
  };
  const platform=(name,b,color,material)=>{
    const item=add(name,b,color,material);item.stepSurface=true;
    colliders.push(item);surfaces.push({name:item.name,bounds:item.bounds,height:()=>item.bounds[5]});return item;
  };
  add('회갈색 객석 바닥',[-13.89,-6.89,.001,-3.11,9.89,.007],'#9c9390','terrazzo');
  add('직접 연결 출입부 바닥',[-3.11,-.10,.001,-.10,3.10,.007],'#9c9390','terrazzo');
  add('직접 연결 출입부 천장',[-3.11,-.10,3.10,-.10,3.10,3.12],'#e1dfd7').kind='ceiling';
  add('밝은 천장',[-13.89,-6.89,3.10,-3.11,9.89,3.12],'#e1dfd7').kind='ceiling';
  for(const x of [-13.88,-3.14]){
    const ranges=x< -10?[[-6.87,9.86]]:[[-6.87,-1.7],[-.40,-.10],[3.10,9.86]];
    for(const [lo,hi] of ranges){
      add('하부 목재 벽 '+x+' '+lo,[x,lo,.04,x+.028,hi,.88],'#a18a67','wood');
      add('흡음벽 '+x+' '+lo,[x,lo,2.35,x+.026,hi,3.09],'#b9b5b3','paint');
      if(x> -10)add('출입구측 회색 흡음벽 '+lo,[x,lo,.89,x+.026,hi,2.35],'#b9b5b3');
      for(let y=lo+.03;y<hi;y+=.12)add('목재 세로 이음 '+x+' '+y,[x-.001,y,.05,x+.033,y+.009,.86],'#83785e');
      for(let y=lo+.05;y<hi;y+=1.25)add('흡음벽 흰 이음 '+x+' '+y,[x-.002,y,2.35,x+.034,y+.018,3.09],'#dbdbd4');
    }
  }
  add('뒷벽 목재',[-13.86,-6.875,.04,-3.15,-6.84,.88],'#a18a67','wood');
  add('뒷벽 흡음판',[-13.86,-6.875,.89,-3.15,-6.84,3.09],'#b9b5b3');
  for(let x=-13.8;x< -3.2;x+=1.3)add('뒷벽 흡음판 이음 '+x,[x,-6.833,.91,x+.016,-6.826,3.08],'#dedfd6');
  platform('목재 무대',[-13.80,6.8,0,-3.20,9.82,.36],'#a78c64','room_floor');
  platform('무대 중앙 낮은 단',[-9.25,6.36,0,-7.75,6.8,.18],'#a99570','wood');
  add('무대 전면 은색 모서리',[-13.80,6.78,.35,-3.20,6.82,.365],'#b4b9b0','metal');
  add('무대 배경',[-12.83,9.72,.37,-4.17,9.77,2.99],'#b5b3a4');
  for(const [lo,hi] of [[-13.83,-12.84],[-4.16,-3.17]]){
    add('무대 측면 목재',[lo,9.65,.37,hi,9.73,3.07],'#8d7658','wood');
    for(let x=lo+.03;x<hi;x+=.09)add('무대 목재 세로결 '+x,[x,9.633,.39,x+.017,9.65,3.06],'#665b49');
  }
  // 90 representative seats sized to the existing 11×17 m footprint; not a survey.
  const rows=[5.38,4.32,3.26,.04,-1.04,-2.12,-3.20,-4.28,-5.36];
  for(const [ri,y] of rows.entries())for(const start of [-12.63,-7.09])for(let c=0;c<5;c++){
    const x=start+c*.68,index=seats.length;seats.push({x,y,z:3.4,row:ri});
    colliders.push({name:'시청각실 객석 충돌 '+index,spaceId:AUDIO_ID,floor:2,kind:'furniture',bounds:[x-.29,y-.31,3.4,x+.29,y+.31,4.43]});
  }
  // Window shades sit behind the seating and never cross the exit aisle.
  for(let y=-6.65;y<9.6;y+=2.42){
    add('블라인드 상자 '+y,[-13.84,y,2.29,-13.72,y+2.10,2.36],'#c9d3cf');
    for(let i=0;i<7;i++)add('블라인드 줄 '+y+' '+i,[-13.84,y,1.15+i*.15,-13.81,y+2.10,1.245+i*.15],'#aeb3a4');
  }
  for(const x of [-12.8,-4.2])for(const y of [-5.98,6.12]){
    add('스탠드 에어컨 '+x+' '+y,[x-.23,y-.21,.02,x+.23,y+.21,1.93],'#d4d8d0','paint',true);
    for(let i=0;i<6;i++)add('에어컨 흡입줄 '+i+' '+x+' '+y,[x-.20,y-.225,1.51+i*.045,x+.20,y-.216,1.53+i*.045],'#4b5352');
  }
  for(const x of [-13.7,-3.3])for(const y of [-4,3.65,6.7])add('벽 스피커 '+x+' '+y,[x-.09,y-.20,2.32,x+.09,y+.20,2.79],'#2c3334');
  for(const x of [-11.6,-8.5,-5.4])for(const y of [-5.4,-2.7,0,2.7,5.4,8.1])add('사각 천장등 '+x+' '+y,[x-.24,y-.24,3.065,x+.24,y+.24,3.093],'#eff0e8','lamp');
  add('프로젝터 브래킷',[-8.53,-1.6,2.62,-8.47,-1.54,3.09],'#b3bbb6','metal');
  add('천장 프로젝터',[-8.75,-1.76,2.43,-8.25,-1.35,2.64],'#d9ddd5');
  add('프로젝터 렌즈',[-8.63,-1.346,2.47,-8.48,-1.33,2.59],'#2e4045','glass');
  add('무대 조명 레일',[-12.9,6.15,2.91,-4.1,6.32,3.04],'#343b3c','metal');
  for(let i=0;i<6;i++){
    const x=-12.1+i*1.44;add('무대 스포트 '+i,[x-.12,6.10,2.60,x+.12,6.4,2.84],'#282e2d');
    add('스포트 렌즈 '+i,[x-.09,6.18,2.588,x+.09,6.35,2.6],'#b6c4b8','glass');
  }
  for(const [x,y] of [[-11.9,8.9],[-10.7,9],[-9.5,8.95],[-7.4,9],[-6.1,8.9],[-5,8.8]]){
    drums.push({x,y,z:3.76});colliders.push({name:'시청각실 국악기 충돌 '+x,spaceId:AUDIO_ID,kind:'furniture',bounds:[x-.35,y-.32,3.76,x+.35,y+.32,4.45]});
  }
  add('가로 통로 이동식 탁자 상판',[-12.7,2.00,.76,-11.2,2.50,.81],'#b6a07b','wood',true);
  for(const x of [-12.6,-11.3])add('이동식 탁자 다리 '+x,[x,2.12,.02,x+.055,2.37,.76],'#899595','metal',true);
  return {roomId:AUDIO_ID,room,boxes,colliders,seats,drums,reference:AUDIO_REFERENCE,entryBounds:AUDIO_ENTRY.bounds,spawn:{...AUDIO_ENTRY.spawn},entryYaw:AUDIO_ENTRY.yaw};
}
