import {subtractBox} from './창문배치.mjs';
export const ANNEX_PHOTO_REFERENCE={count:5,direction:'지도 위에서 아래로',floors:[1,2,3,4],method:'사진 관찰 기반 경량 3D 마감'};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export function addAnnexCorridorFinish(data,boxes,colliders,addBox){
  for(let floor=1;floor<=4;floor++){
    const z=(floor-1)*data.floorHeight;
    const add=(name,b,color,material='paint',solid=false)=>{
      const item=addBox(`${floor}층 별관 사진마감 ${name}`,b,rgb(color),solid?'wall':'finish',floor);
      item.material=material;return item;
    };
    add('테라조 바닥',[100.01,-73,z+.002,102.99,-.01,z+.009],'#bcb7a6','terrazzo');
    for(let y=-72.6;y<0;y+=.6)add('바닥 줄눈 '+y,[100.02,y,z+.010,102.98,y+.009,z+.012],'#89887c');
    for(let x=100.6;x<103;x+=.6)add('바닥 세로 줄눈 '+x,[x,-73,z+.010,x+.009,-.01,z+.012],'#89887c');
    // The first photos show terrazzo at the connector; a brown textured mat
    // starts beyond the upper stair and continues down the classroom corridor.
    add('갈색 미끄럼방지 매트',[100.24,-72.9,z+.014,102.68,-19.1,z+.024],'#aa9270','rubber_mat');
    for(let y=-71.7;y<-19.5;y+=1.4){
      for(const x of [100.40,101.96])add('파란 보행 표시 '+x+' '+y,[x,y,z+.026,x+.52,y+.045,z+.028],'#3d7fac');
    }
    for(let y=-68;y<-20;y+=8)for(const [x,sign] of [[100.72,1],[102.13,-1]]){
      add('노란 화살표 줄기 '+x+' '+y,[x-.025,y-.22,z+.029,x+.025,y+.22,z+.031],'#d6c254');
      for(const side of [-1,1]){
        const b=add('노란 화살표 날개 '+x+' '+y+' '+side,[x+side*.065-.017,y+sign*.17-.10,z+.029,x+side*.065+.017,y+sign*.17+.10,z+.031],'#d6c254');
        b.rotation=[0,0,side*sign*Math.PI/4];
      }
    }
    add('창가 하부 파란 벽',[102.83,-73,z+.01,102.865,-.05,z+.96],'#aebed0');
    add('창가 위 흰벽',[102.83,-73,z+2.66,102.865,-.05,z+3.13],'#e5e2d8');
    add('창가 검정 걸레받이',[102.81,-73,z,102.865,-.05,z+.13],'#292e2c');
    // Coat only existing west-side wall segments, leaving all classroom and
    // stair door gaps exactly where they were in the exported layout.
    for(const wall of data.boxes.filter(b=>b.floor===floor&&b.kind==='wall'&&/^(Wall_|Lintel_)/.test(b.name)&&
      b.bounds[0]>=99.8&&b.bounds[3]<=100.2&&b.bounds[1]<0&&b.bounds[4]<=0)){
      const a=wall.bounds;
      for(const [lo,hi,color] of [[0,.13,'#292e2c'],[.13,1.03,'#aebed0'],[1.03,3.13,'#e5e2d8']]){
        const bottom=Math.max(a[2],z+lo),top=Math.min(a[5],z+hi);
        if(top>bottom)add(wall.name+' 벽 '+lo,[100.105,a[1],bottom,100.14,a[4],top],color);
      }
      if(a[2]<z+.1&&a[4]-a[1]>2.3&&a[4]<-19){
        const lo=a[1]+.28,hi=a[4]-.28;
        add(wall.name+' 교실 창틀',[100.15,lo,z+1.13,100.185,hi,z+2.78],'#e7e5da');
        add(wall.name+' 교실 반투명 창',[100.19,lo+.07,z+1.20,100.198,hi-.07,z+2.69],'#bfcac5','glass');
        for(const h of [1.13,2.30,2.72])add(wall.name+' 흰 가로틀 '+h,[100.20,lo,z+h,100.235,hi,z+h+.05],'#e7e5da');
        for(let y=lo;y<hi;y+=.8)add(wall.name+' 흰 세로틀 '+y,[100.20,y,z+1.13,100.235,Math.min(hi,y+.045),z+2.78],'#e7e5da');
      }
    }
    const panes=data.boxes.filter(b=>b.floor===floor&&b.name.startsWith(floor+'F_EastGlass')&&b.bounds[1]<-.15);
    const cuts=panes.map(p=>[102.79,p.bounds[1],p.bounds[2],103.25,Math.min(-.15,p.bounds[4]),p.bounds[5]]);
    // Existing east glazing/backing becomes an actual view opening with a
    // separate collision pane. No cuts touch the horizontal main corridor.
    for(const list of [boxes,colliders]){
      const next=list.flatMap(b=>{
        if(b.bounds[3]<102.79||b.bounds[0]>103.25||b.bounds[1]>=-.15||b.bounds[5]<z||b.bounds[2]>z+3.2)return [b];
        let parts=[b];for(const cut of cuts)parts=parts.flatMap(p=>subtractBox(p,cut));return parts;
      });list.splice(0,list.length,...next);
    }
    for(const cut of cuts){
      const [,lo,bottom,,hi,top]=cut;
      add('창가 투명 유리 '+lo,[102.99,lo,bottom,103.015,hi,top],'#dce8e1','clear_glass',true);
      for(const h of [bottom-.04,bottom+.68,top-.04])add('붉은 창 가로틀 '+lo+' '+h,[102.86,lo,h,102.97,hi,h+.075],'#914b3b','metal');
      for(const y of [lo,(lo+hi)/2,hi-.06])add('붉은 창 세로틀 '+y,[102.86,y,bottom,102.97,y+.06,top],'#914b3b','metal');
      add('회색 창턱 '+lo,[102.69,lo-.01,bottom-.07,103.01,hi+.01,bottom-.025],'#92998e','terrazzo');
      add('스테인리스 창 안전봉 '+lo,[102.63,lo,z+1.23,102.67,hi,z+1.27],'#aab1ae','metal',true);
    }
    for(let y=-72;y<-.5;y+=1.2)add('천장 패널 이음 '+y,[100.03,y,z+3.11,102.97,y+.009,z+3.13],'#aaa99e');
    for(const x of [100.8,101.6,102.4])add('천장 세로 이음 '+x,[x,-73,z+3.11,x+.008,-.02,z+3.13],'#aaa99e');
    for(let y=-70;y<-1;y+=5){
      add('사각 조명틀 '+y,[101.17,y-.36,z+3.05,101.83,y+.36,z+3.12],'#d1d1c6');
      add('사각 조명 '+y,[101.23,y-.30,z+3.045,101.77,y+.30,z+3.05],'#fff8e7','lamp');
    }
    // Colour accents at the connector/stair zone, not a change to stair geometry.
    for(const [a,b,color] of [[-13,-10,'#d7ba74'],[-19,-16,'#879e69']])
      add('연결부 창가 색벽 '+a,[102.75,a,z+.13,102.80,b,z+2.95],color);
    const rooms=data.rooms.filter(r=>r.floor===floor+'F'&&r.building==='ANNEX'&&['classroom','special_room'].includes(r.type));
    for(const room of rooms){
      const [,,a,b]=room.bounds,door=a+(b-a)*.35;
      for(const y of [door-.69,door+.62])add(room.name+' 살구색 문틀 '+y,[100.15,y,z,100.205,y+.07,z+2.32],'#cda582');
      const start=(a+b)/2-1.2,end=start+2.4;
      add(room.name+' 낮은 수납장 뒷판',[102.79,start,z+.06,102.83,end,z+.96],'#a3947d','wood',true);
      for(let row=0;row<=3;row++)add(room.name+' 수납장 선반 '+row,[102.39,start,z+.06+row*.29,102.83,end,z+.085+row*.29],'#c2b198','wood',true);
      for(let col=0;col<=7;col++){const y=start+col*2.4/7;add(room.name+' 수납장 칸 '+col,[102.39,y,z+.06,102.83,y+.025,z+.955],'#c2b198','wood',true);}
      const binY=end+.18;
      add(room.name+' 초록 우산꽂이',[102.4,binY,z+.02,102.82,binY+.44,z+.56],'#719a75','paint',true);
      for(let i=0;i<3;i++)add(room.name+' 노란 우산 '+i,[102.49+i*.085,binY+.10,z+.36,102.52+i*.085,binY+.16,z+.78],'#cbb842');
    }
  }
}
