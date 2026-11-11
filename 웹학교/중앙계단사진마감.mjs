import {subtractBox} from './창문배치.mjs';
import {PHOTO_REFERENCES} from './추가사진근거.mjs';
// User confirmed: uploads labelled MAIN_STAIR_A depict the administrative-office
// central stair B. Never infer target location from these legacy upload folders.
const sources=['1F_MAIN_STAIR_A','2F_MAIN_STAIR_A','3F_MAIN_STAIR_A','4F_MAIN_STAIR_A'];
export const CENTRAL_STAIR_REFERENCE={target:'MAIN_STAIR_B',confirmedByUser:true,photoCount:47,
  sourceRooms:sources,revisions:sources.map(id=>PHOTO_REFERENCES[id].revision),imageIds:sources.flatMap(id=>PHOTO_REFERENCES[id].imageIds),
  firstFloorInferred:false,reviewedAt:'2026-10-02',features:['남색 고무 디딤판','은색 논슬립 모서리','노란 점자블록','하늘색 하부 벽','회백색 상부 벽','금속 세로 난간','목재 벽 손잡이','큰 격자창','1층 계단 작은 작품 모음','난간 주황 안전띠']};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function finishCentralStair(boxes,colliders,stairs){
  return finishStair(boxes,colliders,stairs,{id:'MAIN_STAIR_B',label:'중앙계단',reference:CENTRAL_STAIR_REFERENCE});
}
// The owner requested this finish by analogy to the central stair, not from
// new photographs of stair A. Retain the provenance of that distinction.
export function finishWestStair(boxes,colliders,stairs){
  return finishStair(boxes,colliders,stairs,{id:'MAIN_STAIR_A',label:'6-7 쪽 계단',reference:{target:'MAIN_STAIR_A',styleFrom:'MAIN_STAIR_B',inferred:true,requestedByUser:true,floors:[1,2,3,4]}});
}
function finishStair(boxes,colliders,stairs,{id,label,reference}){
  const stair=stairs.find(s=>s.id===id);if(!stair)return null;
  const rods=[],panels=[],signs=[],artworks=[],added=[],{height:FH,L,T}=stair,W=stair.frame.width,D=stair.frame.depth;
  const [ox,oy]=stair.frame.origin,west=id==='MAIN_STAIR_A';
  const point=(u,v,z)=>[ox+u,oy+v,z];
  const add=(name,b,color,material='paint',floor=1)=>{
    const item={name:label+' 사진참고 '+name,bounds:b,color:rgb(color),material,kind:'finish',floor,centralStairFinish:!west,westStairFinish:west};boxes.push(item);added.push(item);return item;
  };
  const rod=(name,a,b,r,material='metal')=>rods.push({name,a,b,r,material});
  // Keep the original invisible separator collision: neither movement nor support
  // changes. Replace its concrete appearance with the photographed open balusters.
  const spine=boxes.find(b=>b.name===id+' 중앙벽');
  const roofDividerStart=3*FH+1.1;
  if(spine){
    boxes.splice(boxes.indexOf(spine),1);
    if(west&&spine.bounds[2]<0)boxes.push({...spine,bounds:[...spine.bounds.slice(0,5),0]});
    if(spine.bounds[5]>roofDividerStart)boxes.push({...spine,bounds:[...spine.bounds.slice(0,2),roofDividerStart,...spine.bounds.slice(3)]});
  }
  // Split visual side walls at ground level so basement finishes and all
  // original colliders/support surfaces survive untouched.
  if(west)for(const wall of [...boxes])if(wall.name.startsWith(id+' ')&&wall.kind==='wall'&&wall.bounds[2]<0&&wall.bounds[5]>0){
    boxes.splice(boxes.indexOf(wall),1,{...wall,bounds:[...wall.bounds.slice(0,5),0]},{...wall,bounds:[...wall.bounds.slice(0,2),0,...wall.bounds.slice(3)]});
  }
  for(const b of boxes){
    if(!b.name.startsWith(id+' ')||b.bounds[2]>=4*FH)continue;
    if(west&&(b.bounds[5]<=0&&b.kind==='wall'||/(?:디딤판|입구|중간참) -1(?: |$)/.test(b.name)))continue;
    if(b.kind==='step'){
      b.color=rgb('#283e57');b.material='rubber_mat';
      // Clone visual bounds: collision objects may share the original array.
      // Close the small daylight gaps between the existing thin tread meshes.
      b.bounds=[...b.bounds];b.bounds[2]=b.bounds[5]-.17;
    }
    else if(/입구|중간참/.test(b.name)){b.color=rgb('#b8bfbc');b.material='terrazzo';}
    else if(/왼벽|오른벽|뒷벽/.test(b.name)){b.color=rgb('#dfdfd4');b.material='paint';}
  }
  // Three full-height landing windows (1↔2, 2↔3, 3↔4), above the parking exit.
  for(let level=0;level<3;level++){
    const z=level*FH+FH/2,cut=[ox+.16,oy+D-.13,z+.18,ox+W-.16,oy+D+.21,z+3.13];
    const replacements=new Map(boxes.map(b=>[b,b.kind==='wall'?subtractBox(b,cut):[b]]));
    for(const list of [boxes,colliders]){const next=list.flatMap(b=>replacements.get(b)??[b]);list.splice(0,list.length,...next);}
    const glass=add('중간참 격자창 유리 '+level,[ox+.16,oy+D-.015,z+.18,ox+W-.16,oy+D+.015,z+3.13],'#c6dbdf','clear_glass',level+1);
    colliders.push({...glass,kind:'window_collision'});
    for(let col=0;col<=4;col++){const x=ox+.16+col*(W-.32)/4;add('창 세로틀 '+level+' '+col,[x-.022,oy+D-.055,z+.15,x+.022,oy+D+.04,z+3.16],'#a3b0b4','metal',level+1);}
    for(let row=0;row<=4;row++){const h=z+.18+row*2.95/4;add('창 가로틀 '+level+' '+row,[ox+.14,oy+D-.055,h-.022,ox+W-.14,oy+D+.04,h+.022],'#a3b0b4','metal',level+1);}
    for(const h of [.35,.66,1.0])rod('창 안전 가로봉',point(.16,D-.18,z+h),point(W-.16,D-.18,z+h),.022);
    for(const u of [.20,W/2,W-.20])rod('창 안전 세로봉',point(u,D-.18,z+.02),point(u,D-.18,z+1.04),.025);
  }
  const tactile=(u0,u1,v,z,floor)=>{
    add('노란 점자블록 '+floor+' '+u0+' '+v,[ox+u0,oy+v,z+.003,ox+u1,oy+v+.30,z+.009],'#d7a544','tactile_mat',floor);
  };
  // Only floors 1–4 receive this finish; basement/rooftop flights keep theirs.
  for(let level=0;level<4;level++){
    const z=level*FH;
    for(const [u0,u1] of [[.22,2.25],[2.75,4.78]])tactile(u0,u1,.74,z,level+1);
    signs.push({text:(level+1)+'층 · '+(west?'서쪽 계단':'중앙계단'),position:point(.105,.40,z+1.75),rotation:[0,Math.PI/2,0]});
    if(level<2)artworks.push({position:point(.109,1.10,z+2.18),rotation:[0,Math.PI/2,0],width:1.9,height:1.2});
    // Pale-blue lower-wall strips at each corridor landing; no front wall/door added.
    for(const u of [.091,W-.095])panels.push({color:'#adc1d7',points:[point(u,0,z),point(u,L,z),point(u,L,z+1.30),point(u,0,z+1.30)]});
    if(level===3)continue;
    const rise=FH/2;
    for(const [lane,uWall,uRail] of [[0,.092,W/2-.06],[1,W-.092,W/2+.06]]){
      const a=z+(lane?FH:0),b=z+rise;
      panels.push({color:'#adc1d7',points:[point(uWall,L,a-.03),point(uWall,T,b-.03),point(uWall,T,b+1.3),point(uWall,L,a+1.3)]});
      const skirting=uWall+(lane?-.001:.001);
      panels.push({color:'#333d43',points:[point(skirting,L,a-.03),point(skirting,T,b-.03),point(skirting,T,b+.13),point(skirting,L,a+.13)]});
      rod('목재 벽 손잡이',point(lane?W-.16:.16,L,a+.92),point(lane?W-.16:.16,T,b+.92),.029,'wood');
      rod('금속 경사 난간',point(uRail,L,a+.98),point(uRail,T,b+.98),.03);
      rod('주황 안전띠',point(uRail,L+.10,a+.98+(b-a)*.10/(T-L)),point(uRail,L+.29,a+.98+(b-a)*.29/(T-L)),.034,'orange');
      for(let i=0;i<=18;i++){
        const t=i/18,v=L+(T-L)*t,h=a+(b-a)*t;
        rod('세로 난간살',point(uRail,v,h-.06),point(uRail,v,h+.98),.013);
        if(i%3===0){const u=lane?W-.16:.16;rod('벽 손잡이 지지대',point(uWall,v,h+.79),point(u,v,h+.90),.012,'metal');}
      }
      const u0=lane?W/2+.1:.08,u1=lane?W-.08:W/2-.1;
      // Continuous concrete soffit, visual only: original stair support and
      // the ground-floor parking passage retain their existing collision.
      panels.push({color:'#c7c9c2',points:[point(u0,L,a-.16),point(u1,L,a-.16),point(u1,T,b-.16),point(u0,T,b-.16)]});
      for(const u of [u0,u1])panels.push({color:'#c7c9c2',points:[point(u,L,a-.16),point(u,T,b-.16),point(u,T,b),point(u,L,a)]});
      for(let i=0;i<12;i++){
        const v0=L+i*(T-L)/12,v1=L+(i+1)*(T-L)/12,top=z+(lane?rise+(1-i/12)*rise:(i+1)/12*rise),v=lane?v1-.025:v0;
        add('은색 디딤판 모서리 '+level+' '+lane+' '+i,[ox+u0,oy+v,top+.001,ox+u1,oy+v+.025,top+.006],'#c1c7c2','metal',level+1);
        if(i===0||i===11)add('단차 노란 표시 '+level+' '+lane+' '+i,[ox+u0+.02,oy+v,top+.007,ox+u1-.02,oy+v+.048,top+.011],'#b4a168','paint',level+1);
      }
      tactile(u0+.14,u1-.14,T+.11,z+rise,level+1);
    }
    for(const u of [.092,W-.092]){
      panels.push({color:'#adc1d7',points:[point(u,T,z+rise),point(u,D-.09,z+rise),point(u,D-.09,z+rise+1.3),point(u,T,z+rise+1.3)]});
      rod('중간참 목재 손잡이',point(u<1?.16:W-.16,T,z+rise+.92),point(u<1?.16:W-.16,D-.20,z+rise+.92),.029,'wood');
    }
    // Narrow rounded joining rail remains within the old separator footprint.
    rod('난간 끝 연결',point(W/2-.06,L,z+.98),point(W/2+.06,L,z+.98),.032);
    add('중간참 조명 '+level,[ox+1.65,oy+6,z+FH+1.44,ox+3.35,oy+6.35,z+FH+1.48],'#f2f1e4','lamp',level+1);
  }
  if(west){
    const cap=boxes.find(b=>b.name===id+' 최상층 막음');
    if(cap){boxes.splice(boxes.indexOf(cap),1);const z=3*FH;
      rod('4층 끝 안전 난간',point(.10,L,z+1.07),point(W/2-.10,L,z+1.07),.03);
      for(let i=0;i<=12;i++){const u=.10+(W/2-.20)*i/12;rod('4층 끝 난간살',point(u,L,z),point(u,L,z+1.07),.013);}
    }
  }
  return {reference,label,rods,panels,signs,artworks,boxes:added};
}
