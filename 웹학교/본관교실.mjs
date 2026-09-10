import {classroomReferenceInterior} from './교실기본배치.mjs';
import {CLASSROOM_PROFILES} from './교실별특징.mjs';
import {subtractBox} from './창문배치.mjs';
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const CLASS64_ID='4F_6-4';
export function isMainClassroom(room){return room.building==='MAIN'&&room.type==='classroom';}
export function classroomFrame(room){
  const [x0,x1,y0,y1,z]=room.bounds,width=x1-x0,depth=y1-y0;
  const north=y0>=3,corridor=north?y0:y1;
  return {width,depth,north,z,point:(x,y,h=0)=>({x:x0+x*width/10,y:corridor+(north?-1:1)*y*depth/7,z:z+h})};
}
export function mainClassroomsInterior(data,{profiles=CLASSROOM_PROFILES}={}){
  const template=classroomReferenceInterior(data),rooms=[],boxes=[],colliders=[];
  for(const room of data.rooms.filter(r=>isMainClassroom(r)&&r.id!==CLASS64_ID)){
    const profile=profiles[room.id];
    if(!profile)throw new Error('교실별 특징 누락: '+room.id);
    const frame=classroomFrame(room),{width,depth,z}=frame;
    const scale=Math.min(1,width/10),skin=/원목 마루|천장|앞뒤|창 아래|창 위|복도쪽|나무창틀|반투명 복도창|윗창|창 세로틀/;
    // Scale the envelope to the room, but do not double the desk/chair sizes in wide rooms.
    const transform=(b,name)=>{
      const structural=skin.test(name),a=frame.point(b[0]-30,b[1],b[2]-10.2),c=frame.point(b[3]-30,b[4],b[5]-10.2);
      if(!structural&&width>10){
        const sourceCenter=(b[0]+b[3])/2-30,half=(b[3]-b[0])/2;
        let center=room.bounds[0]+sourceCenter*width/10;
        const seat=name.match(/6-4 (?:실내|충돌) (책상|의자|공책|책가방).*?(\d+)$/);
        if(seat){
          const list=['의자','책가방'].includes(seat[1])?template.chairs:template.desks;
          const anchor=list.find(d=>d.id===Number(seat[2])).x-30;
          center=room.bounds[0]+anchor*width/10+(sourceCenter-anchor);
        }
        if(/책장|정리바구니/.test(name)){
          const anchor=b[0]>=37.19?7.2:5.2;
          center=room.bounds[0]+anchor*width/10+(sourceCenter-anchor);
        }
        if(sourceCenter<2.4)center=room.bounds[0]+sourceCenter;
        if(sourceCenter>9.2)center=room.bounds[1]-(10-sourceCenter);
        a.x=center-half;c.x=center+half;
      }
      const bounds=[a.x,Math.min(a.y,c.y),a.z,c.x,Math.max(a.y,c.y),c.z];
      // Keep finishing skins on the inside of the original 18 cm walls.
      bounds[0]=Math.max(room.bounds[0]+.102,bounds[0]);bounds[3]=Math.min(room.bounds[1]-.102,bounds[3]);
      return bounds;
    };
    const repaint=(b)=>{
      if(/하부벽/.test(b.name))return rgb(profile.lowerWall);
      if(/게시판 테두리|앞 안내게시판/.test(b.name))return rgb(profile.accent);
      if(/정리바구니/.test(b.name))return rgb(profile.trayColor);
      const locker=b.name.match(/사물함 문 (\d+)-(\d+)/);
      if(locker){
        const row=Number(locker[1]),col=Number(locker[2]);
        const colored=profile.lockerPattern===0?(row+col)%2===0:profile.lockerPattern===1?row===1:col%3===0;
        return rgb(colored?profile.lowerWall:'#dedcd2');
      }
      if(/의자 좌판|의자 등받이/.test(b.name)&&Number(b.name.match(/\d+$/)?.[0])%5===0)return rgb(profile.accent);
      if(/공책|책장 책/.test(b.name))return rgb(profile.lowerWall);
      return [...b.color];
    };
    const converted=(b,collision=false)=>({...b,
      name:room.name+(collision?' 충돌 ':' 실내 ')+b.name.replace(/^6-4 (실내|충돌) /,''),
      spaceId:room.id,interiorRoom:room.id,floor:parseInt(room.floor),
      bounds:transform(b.bounds,b.name),...(!collision?{color:repaint(b)}:{}),
    });
    const door=frame.point(3.5,0),cut=[door.x-.66,door.y-.8,z,door.x+.66,door.y+.8,z+2.3];
    // Existing doorway stays 1.2 m wide regardless of the room width.
    const roomBoxes=template.boxes.map(b=>converted(b)).flatMap(b=>/복도쪽|나무창틀|반투명 복도창|윗창|창 세로틀/.test(b.name)?subtractBox(b,cut):[b]);
    const roomColliders=template.colliders.map(b=>converted(b,true));
    const seats=list=>list.map(d=>{const p=frame.point(d.x-30,d.y);return {id:d.id,x:p.x,y:p.y};});
    const spawn=frame.point(3.5,-3.5);
    const entry=frame.point(3.5,0);entry.y=1.5;
    const config={roomId:room.id,room,profile,frame,boxes:roomBoxes,colliders:roomColliders,desks:seats(template.desks),chairs:seats(template.chairs),spawn,entry,
      seatCount:24,seatCountIsApproximate:true,furnitureScale:scale,depth};
    rooms.push(config);boxes.push(...roomBoxes);colliders.push(...roomColliders);
  }
  return {rooms,boxes,colliders};
}
