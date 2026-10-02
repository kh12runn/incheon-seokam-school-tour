import {REAR_EXIT} from './본관출입연결.mjs';
// Owner confirmed 2026-10-02: remove the former rear door, attach the shelter
// to the left return wall when facing it, and face the bins to the right (-X).
export const RECYCLING_REFERENCE={sourceRoomId:'custom_0e69f826066f4770a69c3895f3f58fb9',count:5,ownerConfirmed:true,reviewedAt:'2026-10-02',approximateDimensions:true,
 imageIds:['9babdc5e-9e80-4303-8e8c-e33f6f38fc08','66bd4d8f-3c9e-41ab-8a01-4d8675f77ab7','413f2a5f-2b9b-46eb-a93a-c6fcbac4f6b3','34421cac-ac24-4277-83b9-463c642d4316','c5d76ec5-7a1d-4963-8c9a-50088e81df82'],
 features:['청록 곡면 차양','은색 금속 기둥과 가림판','스테인리스 분리수거함','노란 수거 자루','회색 콘크리트 바닥','빨간 소화기 보관함'],closedExit:REAR_EXIT};
export function addRecyclingShelter(boxes,colliders){
 const added=[],labels=[],rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
 // Facing the former door from parking: left is +X, right is -X.
 // Fit the photographed long shelter along the return wall at X=38.
 const pose={offsetX:41.03,offsetY:3.25,sourceX:25.85,lengthScale:.88};
 const position=(x,y)=>[pose.offsetX-y,pose.offsetY+(x-pose.sourceX)*pose.lengthScale];
 const add=(name,bounds,color,material='paint',solid=false,placed=false)=>{
  if(!placed){const a=position(bounds[0],bounds[1]),b=position(bounds[3],bounds[4]);bounds=[b[0],a[1],bounds[2],a[0],b[1],bounds[5]];}
  const b={name:'후문 분리수거장 '+name,bounds,color:rgb(color),material,kind:'finish',floor:0,recyclingShelter:true};boxes.push(b);added.push(b);if(solid)colliders.push({...b,kind:'wall'});return b;
 };
 add('콘크리트 바닥',[26,3.3,-.62,33.45,5.85,-.592],'#89978e','storage_concrete');
 // Collision-free proxies; the renderer supplies a continuous curved canopy.
 for(let i=0;i<9;i++){const y=3.22+i*.30,t=i/8,z=2.06+.32*Math.sin(t*Math.PI*.85);add('청록 차양 '+i,[25.85,y,z,33.5,y+.32,z+.045],'#398b8b','glass').renderInDetails=true;}
 for(const x of [26,29.65,32.9]){
  add('금속 기둥',[x,5.63,-.6,x+.055,5.69,2.29],'#b1bdb5','metal',true);
  add('차양 가로 지지대',[x,3.23,2.02,x+.045,5.78,2.07],'#8d9f97','metal');
 }
 for(const h of [-.5,.0,.54])add('앞 가림판 가로틀',[26,5.64,h,32.95,5.70,h+.04],'#a4b6a8','metal');
 add('앞 청록 가림판',[26,5.65,-.51,32.9,5.68,.57],'#427a70','paint',true);
 add('서쪽 청록 가림판',[26,3.34,-.51,26.045,5.64,.57],'#427a70','paint',true);
 const types=['일반쓰레기','플라스틱','캔·고철','종이류','병류','비닐류'];
 for(let i=0;i<6;i++){
  const x=26.18+i*1.08;
  add('금속 수거함 '+i,[x,3.36,-.54,x+1.02,4.12,.56],'#a1aaa1','metal',true);
  add('수거함 앞문 '+i,[x+.045,4.12,-.46,x+.975,4.135,.44],'#929d94','metal');
  add('앞문 중앙선 '+i,[x+.50,4.137,-.45,x+.512,4.15,.43],'#5d7268');
  for(const a of [.43,.56])add('문 손잡이 '+i+a,[x+a,4.15,-.15,x+a+.022,4.20,.04],'#cad0c5','metal');
  add('노란 자루 테두리 '+i,[x+.035,3.39,.56,x+.98,4.10,.60],'#b3a74e','fabric');
  add('수거함 열린 입구 '+i,[x+.12,3.48,.599,x+.90,4.01,.605],'#354e3d');
  for(const a of [.10,.88])add('접힌 수거 자루 '+i+a,[x+a,3.43,.58,x+a+.06,4.04,.68],'#c0b252','fabric');
  labels.push({text:types[i],x:x+.51,y:4.155,z:.43,width:.78,height:.16,color:i===0?'#b27253':i===5?'#427d59':'#426a90'});
 }
 add('빨간 소화기함',[26.1,5.87,-.6,26.55,6.27,.36],'#b54838','metal',true);
 add('소화기함 검정 창',[26.15,6.274,-.46,26.51,6.288,.24],'#4d5751','glass');
 add('소화기 본체',[26.27,6.292,-.42,26.40,6.35,.02],'#c66243');
 // Three bays in front of the west-facing shelter, with a clear access strip.
 const parking={spaces:3,bounds:[26.3,4.65,-.6,33.8,9.65,-.58],spacing:2.5,axis:'y'};
 add('주차 바닥',parking.bounds,'#737b78','asphalt',false,true);
 for(let i=0;i<=parking.spaces;i++){
  const x=parking.bounds[0]+i*parking.spacing;
  add('주차 구획선 '+i,[x-.045,4.65,-.576,x+.045,9.65,-.566],'#e4e5da','paint',false,true);
 }
 add('주차 끝선',[26.255,4.605,-.576,33.845,4.695,-.566],'#e4e5da','paint',false,true);
 return {reference:RECYCLING_REFERENCE,boxes:added,labels,pose,parking};
}
