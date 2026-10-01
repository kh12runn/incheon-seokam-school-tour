import {photoRoom} from './사진실내도구.mjs';
import {subtractBox} from './창문배치.mjs';
export const NIGHT_DUTY_ID='1F_NIGHT_DUTY';
export const NIGHT_DUTY_REFERENCE={count:7,reviewedAt:'2026-10-01',approximateDimensions:true,imageIds:['683bc832-bad1-47f7-9bc3-218cf3ffe40d','eab89c13-8a05-4ea2-b00b-c5b0e767a7ca','68f7c686-dc5e-4c2c-9e16-33c143d47d2f','9d76aa60-47f8-4196-90f3-d6b7ff8bdddf','9acfa502-6c84-4897-ac1e-4c0061c5d51b','9c922040-ac78-4cb6-96f0-d78ee886a466','296efc2e-3d88-47b5-9352-a3186960efeb']};
export function nightDutyInterior(data,worldBoxes,worldColliders){
  const room=data.rooms.find(r=>r.id===NIGHT_DUTY_ID);if(!room)return null;
  const {config:c,add,table,cabinet,chair,monitor,finish}=photoRoom(room,worldBoxes,NIGHT_DUTY_REFERENCE);
  finish('wood','#cdc3a7');c.spawn={x:46.75,y:3.62,z:0};
  add('입구 신발 매트',[1.16,.10,.01,2.34,.75,.025],'#71574d','fabric');
  table('업무 책상',2.65,.17,2.05,.66,.74,'#d9d9c9');
  cabinet('업무 서랍',4.25,.23,.40,.50,.70,'#d7d9cc');
  chair('검정 업무 의자',3.52,1.2,0,'#242e30');
  for(let i=0;i<13;i++)add('업무 파일 '+i,[2.72+i*.095,.25,.79,2.78+i*.095,.52,1.13+(i%3)*.04],['#c2c7d4','#eeeadd','#83a6ad'][i%3]);
  monitor('업무 모니터',3.8,.42,.79);
  cabinet('신발장',.18,.38,.69,.39,1.31,'#b29a75',true);
  for(let i=0;i<6;i++)add('신발 '+i,[.23+(i%2)*.28,.39,.15+Math.floor(i/2)*.32,.42+(i%2)*.28,.69,.25+Math.floor(i/2)*.32],i%2?'#dadbd4':'#303937');
  add('청록 우산통',[.30,.47,1.34,.69,.76,1.89],'#207a78');
  for(let i=0;i<5;i++)add('접힌 우산 '+i,[.33+i*.065,.53,1.67,.36+i*.065,.57,2.29-(i%3)*.10],i%2?'#293839':'#999c4c');
  add('소파 갈색 받침',[.17,1.30,.08,.99,3.77,.32],'#655747','wood',true);
  add('소파 회색 좌판',[.20,1.37,.32,1.07,3.70,.49],'#a9aaa0','fabric',true);
  add('소파 회색 등받이',[.17,1.31,.43,.40,3.77,1.02],'#b6b5a9','fabric',true);
  for(const y of [1.28,3.62])add('소파 둥근 팔걸이',[.16,y,.32,1.09,y+.19,.79],'#a6a89c','fabric').shape='sphere';
  for(let i=0;i<3;i++){
    const y=1.46+i*.7;add('소파 노란 방석 '+i,[.40,y,.49,1.01,y+.66,.54],'#c3bd7b','fabric');
    for(let j=0;j<5;j++)add('방석 잎 무늬 '+i+' '+j,[.46+(j%2)*.23,y+.06+Math.floor(j/2)*.19,.54,.66+(j%2)*.23,y+.17+Math.floor(j/2)*.19,.543],'#7b7953','fabric').shape='sphere';
  }
  add('흰 냉장고',[.16,3.94,.02,.85,4.67,1.82],'#e0e4df','paint',true);
  add('냉장고 문 경계',[.855,3.95,1.22,.864,4.65,1.25],'#333f3d');
  for(const z of [1.14,1.30])add('냉장고 손잡이',[.86,4.55,z,.88,4.60,z+.08],'#aab9b4','metal');
  add('벽걸이 에어컨',[.12,3.87,2.29,.38,4.85,2.65],'#e2e4dd');
  add('에어컨 검정 송풍구',[.385,3.96,2.32,.399,4.77,2.39],'#344440');
  add('안쪽 흰 구획',[.12,5.40,0,1.71,5.49,3.10],'#e2e2d8','staff_wall',true);
  add('분홍 내부문',[.47,5.37,.03,1.39,5.40,2.14],'#dcae9e','wood');
  for(const x of [.41,1.39])add('분홍 문틀',[x,5.34,.02,x+.06,5.40,2.22],'#e1b7a5','wood');
  add('분홍 문틀 위',[.41,5.34,2.16,1.45,5.40,2.23],'#e1b7a5','wood');
  add('문 손잡이',[1.25,5.29,.97,1.32,5.37,1.03],'#ad9e62','metal').shape='sphere';
  table('탕비 탁자',.18,4.79,1.18,.43,.72);chair('녹색 탕비 의자',1.27,4.40,Math.PI,'#588576');
  add('전기주전자',[.36,4.86,.78,.63,5.10,1.04],'#333e3b');
  add('보온병',[.77,4.90,.78,.88,5.02,1.11],'#e1e3d6');
  for(let i=0;i<3;i++){
    const x=1.88+i*.64;add('접이식 가림막 '+i,[x,5.37,.07,x+.59,5.42,1.79],'#b69b65','wood',true);
    for(let row=0;row<12;row++)add('가림막 살 '+i+' '+row,[x+.05,5.35,.92+row*.06,x+.54,5.37,.95+row*.06],'#c8b179','wood');
  }
  add('걸린 분홍 수건',[1.98,5.32,.66,2.37,5.34,1.65],'#d9aaa9','fabric');
  add('걸린 남색 외투',[3.24,5.29,.49,3.69,5.33,1.65],'#263a40','fabric');
  for(let i=0;i<3;i++)cabinet('목재 옷장 '+i,4.27,3.32+i*.92,.59,.87,2.12,'#bdab85',false,'west');
  cabinet('안쪽 회청색 수납장',2.37,6.07,1.16,.61,2.30,'#859caa');
  table('낮은 TV장',4.16,1.34,.67,1.67,.46,'#73553a');
  add('TV 검정 틀',[4.26,1.56,.51,4.34,2.72,1.19],'#25352f');
  add('TV 비식별 화면',[4.25,1.60,.56,4.255,2.68,1.14],'#66867d','glass');
  for(let i=0;i<7;i++)add('게시된 안내지 '+i,[4.85,1.30+(i%3)*.44,1.38+Math.floor(i/3)*.38,4.865,1.64+(i%3)*.44,1.70+Math.floor(i/3)*.38],'#e2e3d5');
  add('달력',[.115,2.98,1.47,.129,3.35,2.02],'#e9e9df');
  for(let row=0;row<5;row++)for(let col=0;col<7;col++)add('달력 날짜 칸',[.131,3.01+col*.045,1.52+row*.073,.134,3.037+col*.045,1.552+row*.073],col===0?'#a96c64':'#65746d');
  c.wallFans=[{x:45.26,y:5.24,z:2.33,axis:'x'}];
  const cut=[47.62,2.85,1.12,49.74,3.17,2.55];
  for(const list of [worldBoxes,worldColliders]){
    const next=list.flatMap(b=>b.spaceId===room.id?subtractBox(b,cut):[b]);list.splice(0,list.length,...next);
  }
  add('업무 책상 위 반투명 창',[2.62,.105,1.12,4.74,.125,2.55],'#c9d4c8','glass');
  for(const x of [2.60,3.66,4.73])add('목재 창 세로틀',[x,.09,1.10,x+.045,.16,2.59],'#bfa67d','wood');
  for(const z of [1.10,2.16,2.55])add('목재 창 가로틀',[2.60,.09,z,4.775,.16,z+.04],'#bfa67d','wood');
  c.colliders.push({name:'숙직실 창 충돌',kind:'window_collision',bounds:cut});
  return c;
}
