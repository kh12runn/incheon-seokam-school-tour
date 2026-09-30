import {openClassroomWindows} from './창문배치.mjs';
export const INDIVIDUAL_REFERENCES={
 '1F_INDIVIDUAL_4':{count:6,revision:'bd9d7057-4a10-4b90-938f-103e92f5d1f9',features:['연두 사다리꼴 개별 책상','긴 목재 활동탁자','흰 유리 교구장','사진 장식 갈색 수납장','흰 칠판 중앙 검정 화면','회색 콤비블라인드와 냉장고']},
 '1F_INDIVIDUAL_5':{count:12,revision:'b43f2e8c-5cb1-41fc-a53a-c8e9782f45b3',features:['연두 모둠형 책상','작품이 붙은 흰 수납벽','창가 긴 교사용 책상','대형 검정 복합기','전면 목재 테두리 흰 칠판','작은 책장과 세로 거울']},
};
export function individualLearningRooms(data,worldBoxes,worldColliders,addBox){
 return Object.entries(INDIVIDUAL_REFERENCES).flatMap(([id,reference])=>{
  const room=data.rooms.find(r=>r.id===id);if(!room)return [];
  openClassroomWindows({...data,rooms:[{...room,type:'classroom'}],boxes:data.boxes.filter(b=>b.spaceId===id)},worldBoxes,worldColliders,addBox);
  const four=id.endsWith('_4'),length=room.bounds[3]-room.bounds[2],front=room.bounds[3],boxes=[],colliders=[],chairs=[],tops=[],posters=[];
  const point=(u,v,h=0)=>({x:100-v,y:front-u,z:h});
  const bounds=([u,v,h,U,V,H])=>[100-V,front-U,h,100-v,front-u,H];
  const add=(name,b,color,material='paint',solid=false)=>{
   const item={name:room.name+' '+name,spaceId:id,interiorRoom:id,floor:1,kind:'detail',bounds:bounds(b),material,color:[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255)};boxes.push(item);if(solid)colliders.push({...item,kind:'furniture'});return item;
  };
  const chair=(u,v,angle=0)=>{chairs.push({u,v,angle});colliders.push({name:room.name+' 연두 의자 '+chairs.length,spaceId:id,interiorRoom:id,floor:1,kind:'furniture',bounds:bounds([u-.25,v-.26,0,u+.25,v+.26,.91])});};
  function table(u,v,w=1.15,d=.65,green=true){
   if(green)tops.push({u,v,w,d});else add('목재 활동탁자 '+u+v,[u-d/2,v-w/2,.70,u+d/2,v+w/2,.75],'#b99f78','wood');
   colliders.push({name:room.name+' 책상 충돌 '+u+v,spaceId:id,interiorRoom:id,floor:1,kind:'furniture',bounds:bounds([u-d/2,v-w/2,0,u+d/2,v+w/2,.75])});
   for(const du of [-d*.35,d*.35])for(const dv of [-w*.39,w*.39]){
    add('책상 철제 다리 '+u+v+du+dv,[u+du-.023,v+dv-.023,.04,u+du+.023,v+dv+.023,.71],'#a7b6ae','metal');
    add('책상 초록 발 '+u+v+du+dv,[u+du-.028,v+dv-.028,.015,u+du+.028,v+dv+.028,.14],green?'#7f9d44':'#5c6865');
   }
  }
  add('회색 바닥',[.10,.10,.001,length-.10,7.90,.009],'#a4aaa4','terrazzo');
  add('흰 천장',[.10,.10,3.10,length-.10,7.90,3.12],'#e4e7df').kind='ceiling';
  add('전면 흰 칠판',[.12,1.25,1.02,.17,6.70,2.48],'#ecede2');
  for(const h of [.96,2.48])add('칠판 목재 테두리 '+h,[.13,1.18,h,.21,6.77,h+.055],four?'#c8cfbf':'#865b3e','wood');
  add('칠판 아래 수납장',[.14,1.16,.02,.63,6.82,.85],'#e0e4d7','paint',true);
  for(let i=0;i<9;i++)add('앞 수납장 경계 '+i,[.633,1.2+i*.61,.04,.644,1.214+i*.61,.80],'#b0baad');
  if(four)add('칠판 중앙 화면',[.22,3.58,1.26,.27,5.23,2.22],'#1c2a2e');
  else add('전면 창가 TV',[.24,6.20,1.95,.32,7.47,2.70],'#1c2a2e');
  for(let i=0;i<(four?3:7);i++)posters.push({u:.23,v:1.63+i*(four?.51:.62),h:1.53+(i%2)*.32,side:'front',kind:i%2?'art':'flower'});
  // Windows and roller blinds remain tied to the original west facade.
  for(let i=0;i<Math.floor(length/1.7);i++){
   const u=.3+i*1.7;
   add('창가 롤블라인드 '+i,[u,7.82,2.02,Math.min(u+1.6,length-.2),7.85,2.77],four?'#999f98':'#d2d6cb','fabric');
   if(four)for(let j=0;j<5;j++)add('콤비블라인드 띠 '+i+j,[u,7.81,2.06+j*.13,Math.min(u+1.6,length-.2),7.82,2.11+j*.13],'#b8bfb6','fabric');
  }
  add('창가 교사용 책상',[1.22,6.65,.70,3.57,7.51,.76],'#bba17d','wood',true);
  add('교사용 책상 가림판',[1.30,6.69,.18,3.49,6.73,.69],'#a7b1a8','metal');
  for(let i=0;i<2;i++){
   const u=1.57+i*.76;
   add('교사용 검정 모니터 '+i,[u,7.12,.99,u+.63,7.17,1.40],'#243236');
   add('모니터 받침 '+i,[u+.27,7.08,.76,u+.34,7.22,1.0],'#64736b','metal');
  }
  add('창가 냉장고',[3.94,7.12,.02,4.59,7.80,2.16],'#e7e8df','paint',true);
  add('냉장고 경계',[3.95,7.105,1.39,4.58,7.125,1.42],'#939e98');
  add('창가 복합기',[4.92,6.96,.02,5.82,7.78,1.20],four?'#a6b4ac':'#29373a','paint',true);
  add('복합기 스캐너',[4.98,7.05,1.20,5.78,7.69,1.30],'#87978e');
  // Keep the corridor doorway and a continuous 1.3m-side access aisle clear.
  if(four){
   for(const u of [2.30,3.75,5.20])for(const v of [2.55,4.62]){table(u,v);chair(u+.65,v);}
   table(7.04,4.2,4.7,.64,false);for(let i=0;i<4;i++)chair(7.65,2.45+i*1.16);
   add('갈색 사진 장식 수납장',[.96,.16,.02,3.52,.77,2.44],'#9b6543','wood',true);
   for(let i=0;i<8;i++)posters.push({u:1.08+(i%4)*.60,v:.782,h:.52+Math.floor(i/4)*.93,side:'corridor',kind:'landscape'});
  }else{
   for(const u of [2.55,4.90]){
    for(const v of [2.80,4.35]){table(u,v,1.40,1.0);chair(u+.83,v);chair(u-.83,v,Math.PI);}
    add('모둠 중앙 작은 수납',[u-.37,3.50,.02,u+.37,3.66,.66],'#bba783','wood',true);
   }
  }
  // Rear cabinets differ: glazed teaching aids in room 4, pupil artwork on solid
  // doors in room 5. Render generic drawings, never faces, pupil names or records.
  for(let i=0;i<8;i++){
   const v=.38+i*.89;
   add('뒤 흰 교구장 '+i,[length-.67,v,.02,length-.13,v+.85,2.74],'#e0e6dc','paint',true);
   if(four){
    add('교구장 유리문 '+i,[length-.685,v+.05,.89,length-.669,v+.80,2.21],'#96b3a6','glass');
    for(let j=0;j<3;j++)for(let k=0;k<3;k++)add('교구 정리함 '+i+j+k,[length-.705,v+.10+k*.22,1.0+j*.38,length-.685,v+.25+k*.22,1.23+j*.38],['#b5c878','#cda5ad','#a1b7d0'][k]);
   }else posters.push({u:length-.69,v:v+.425,h:1.42,side:'rear',kind:i%2?'flower':'art'});
   add('교구장 손잡이 '+i,[length-.712,v+.65,.47,length-.69,v+.67,.65],'#809589','metal');
  }
  add('복도 낮은 책장',[four?3.88:.72,.16,.02,four?4.96:1.69,.69,1.02],'#bdac89','wood',true);
  for(let i=0;i<9;i++){const u=(four?3.92:.76)+i*.1;add('책장 색색 책 '+i,[u,.696,.54,u+.06,.72,.88],['#a0b897','#ae95a0','#a4b5cc','#d4b575'][i%4]);}
  if(!four){
   add('복도 세로 거울 테두리',[2.0,.11,.86,2.46,.15,2.10],'#6c5949','wood');
   add('복도 세로 거울',[2.04,.152,.90,2.42,.162,2.06],'#bccfc9','metal');
   for(let i=0;i<6;i++)posters.push({u:2.90+(i%3)*.45,v:.13,h:1.43+Math.floor(i/3)*.60,side:'corridor',kind:'art'});
  }
  for(const u of [1.0,length*.52,length-1.4])for(const v of [2.4,5.5])add('긴 천장등 '+u+v,[u-.36,v-.20,3.025,u+.36,v+.20,3.075],'#eef4e8','lamp');
  add('천장 에어컨',[length/2-.50,3.5,2.97,length/2+.50,4.5,3.085],'#d6dece');
  const doorU=four?5.85:4.55,spawn=point(doorU,.9);
  return [{roomId:id,room,boxes,colliders,chairs,tops,posters,point,spawn,entryYaw:Math.PI/2,reference:{...reference,approximateDimensions:true,peopleExcluded:true},layout:four?'individual-and-long-table':'group-tables'}];
 });
}
