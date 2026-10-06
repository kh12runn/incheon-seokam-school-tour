// 2026-10-06: owner's explicit request to model these private reference photos.
// No original imagery, faces, licence plates, notices or approval mutations.
// Locations use the existing approximate campus geometry, not survey dimensions.
import {STAIR_REAR_EXIT} from './본관출입연결.mjs';
export const OCTOBER_OUTDOOR_PHOTOS={
 front:`a508fc58-1ee7-4a7c-8d34-a717ec676181 a219b561-f968-4271-bf2f-a428c77b1a50 f83d9229-18f5-4b4f-96ef-a4bd2a4ae8cc bdc6d839-a1b0-4503-b3b2-38f4c5e4e95f 8abb8530-2400-4625-8b72-62d4eeee2ffd 8d4a7c0c-77df-4bdb-bd0d-cb79e1226cf6 f0581a33-b4e3-48d9-b1dd-bf3721b8354c dc6adc02-e0f4-4084-b6ee-ca5bd52175bb e3a1932e-4ff6-4d30-8590-786393881dd0 b98a3530-0c9c-4389-9a81-b0abdcbf23d2 9ec27bd3-1709-4be1-a5a2-a08dcc00beab 7b571108-2806-4648-8757-22f63d957073 28919e38-0edf-47d7-8ec1-a58c2035c5e0 4d75d7ac-407d-427a-ab59-71603df18c06 992521dd-098b-46ce-8d2d-76a82ef6f1f1 1f2bf6b4-ac7a-4772-af4c-33d856c0fc1a 0391c9e1-382e-48d2-906d-4d9f55ac6dbb 6a4adf64-a7fc-4dd0-befa-4685cece8838 2f1b8d2a-c59a-4726-867a-fa1ed4a6f160 ea91537d-64d7-42a7-8f28-cad5bc210999 ef85a8db-728b-403b-9fc3-c921ff8a82a0 0a958c3c-0ce9-40e2-ae6e-16f36ae533ef f69622dc-e13f-480e-85f9-fbf5c9b6cd4f 3a48e9de-078f-4425-990e-799126515278 ab32f740-6f1d-44f2-bf69-6e0b66d4b558 731f875b-80b0-4ef9-9798-55b61aa48b24`.split(' '),
 parking:`2d5e0380-ddd6-4c9e-89d4-1ffec1ebf227 b91cd429-d000-475e-81c8-e84b1e5282f3 07eb096f-8b12-4e27-9d7c-a038ba7c7b69 8dbbbc48-87f1-429b-8186-742298b79f1a cea1e3e1-bff0-47ce-b464-51e13f026f8a df7ba637-dc6e-4cbe-99cd-4d66174a9047 a2afd7d8-2831-4c75-a6e0-465a822a9845 b3bee14f-cb60-469c-99d5-10298d8b8f93 8e5cade0-767b-4368-be18-471b73c66ec1 590b0856-b9c0-4555-bb6e-bb72d74db6b1 c2c3f8f6-e350-40cc-a87e-10fdde903166 6a489058-9bac-40da-b2d8-8ff0613a119f 1d63b15e-4cc0-444a-9c80-e1142ee7a8f0 ae845709-bc38-4c92-b318-7ed403585482 5f120b07-87e2-41fd-bcd1-68a0430e9068 bc6d3c60-bf37-4f4e-a15d-fc26f3430787 f32e9c5a-5099-41ce-9388-ba348b6ce604`.split(' '),
 rear:`2d58b506-51ed-4f9e-bddb-3e480452d93b 4bce4881-4703-455f-9eb7-a106ac18d621 7dd09acf-fe38-46b0-b064-b3960429394e e59bde21-6ab5-44ff-81b0-f693c988f3c2 ed9fcba5-75a8-49a9-81b6-731503482f4b b2ad6c2f-6fd1-40ad-8c38-9fe3d9e84d9d`.split(' ')
};
const rgb=h=>h.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255);
OCTOBER_OUTDOOR_PHOTOS.rear.push('e983285c-63e6-4d63-93fd-6b09c372a457','cfc5a97f-e534-45ef-9f60-4b672f5e6665','c0994aa4-5cf5-4ed2-82ee-7fae73b1b84f');
OCTOBER_OUTDOOR_PHOTOS.rostrum=['05a79f85-0780-4e04-bdb2-ebbcc8cc4352','10a7abcc-4830-4b55-a1c3-1e439381c4c9','68853274-9319-4db0-ae03-50f1976fb9f7','9e384553-8228-460d-9abd-e71aa4fa1ed9','5eef94db-ea1a-48ef-89b2-1f89db9dedc0','b7443a35-366f-4920-a6d1-0af2dc45457a','80619d1c-1625-4ba7-bebe-f49915725a91'];
export function addOctoberOutdoorFinish(boxes,colliders,surfaces){
 const add=(name,b,color,material='paint',solid=false,extra={})=>{
  const item={name:'정후문 사진 '+name,bounds:b,color:rgb(color),material,kind:'finish',floor:0,...extra};boxes.push(item);if(solid)colliders.push(item);return item;
 };
 const white='#e4e5df',metal='#9fa9a4',blue='#32567d';
 // Existing rear-lot topology, parking bays and drivable vehicles are retained.
 for(const b of boxes.filter(b=>/^후문 주차장 (아스팔트|진입로)$/.test(b.name))){b.color=rgb('#94968f');b.material='storage_concrete';}
 for(let x=-17;x<61;x+=8)add('주차장 콘크리트 줄눈 '+x,[x,12.05,-.578,x+.023,18.2,-.569],'#696d68');
 for(let x=13;x<60;x+=7)add('주차장 뒤 초록 울타리 기둥 '+x,[x,25.12,-.6,x+.07,25.2,1.38],'#61986b','metal',true);
 for(const z of [-.15,1.27])add('주차장 뒤 울타리 가로대 '+z,[10,25.15,z,62,25.20,z+.065],'#61986b','metal');
 for(let x=10;x<62;x+=.35)add('주차장 뒤 울타리 세로살 '+x,[x,25.16,-.14,x+.032,25.19,1.28],'#789f69','metal');
 // Security booth, raised barrier and masonry gateposts at the existing west
 // mouth of the rear parking lane. No road or gate is placed through classrooms.
 add('후문 경비실',[-20.6,19,-.6,-17.2,21.4,1.92],'#c6c8c3','storage_concrete',true);
 add('경비실 지붕',[-20.8,18.85,1.92,-17,21.55,2.10],'#56646a','metal');
 add('경비실 노란 간판',[-20.8,18.81,1.73,-17,18.86,2.15],'#edc056');
 add('경비실 창틀',[-20.15,18.93,.31,-17.58,19,.1+1.53],white,'metal');
 add('경비실 유리',[-20.07,18.90,.40,-17.66,18.93,1.43],'#345257','glass');
 for(const x of [-19.24,-18.4])add('경비실 창살 '+x,[x,18.875,.4,x+.045,18.90,1.43],white,'metal');
 add('경비실 안내판',[-20.04,18.87,-.37,-17.74,18.90,.17],'#e2e4da');
 for(let i=0;i<4;i++)add('경비실 안내 줄 '+i,[-19.9,18.85,-.26+i*.095,-17.9,18.87,-.24+i*.095],'#6b7b80');
 for(const y of [11.05,18.25]){
  add('후문 돌 문주 '+y,[-21.1,y,-.6,-20.45,y+.68,1.27],'#a7aaa3','storage_concrete',true);
  add('문주 아치 '+y,[-21.1,y,1.08,-20.45,y+.68,1.65],'#a7aaa3','storage_concrete',false,{shape:'sphere'});
  add('문주 검은 안내면 '+y,[-21.115,y+.11,-.37,-21.105,y+.57,1.08],'#313a3a');
 }
 add('후문 차단기',[-18.1,18.18,-.6,-17.65,18.66,.53],'#e9b836','metal',true);
 add('후문 올린 차단봉',[-17.93,18.36,.50,-17.85,18.44,3.02],white,'metal');
 for(let z=.8;z<3;z+=.42)add('차단봉 빨간 표시 '+z,[-17.94,18.35,z,-17.84,18.45,z+.14],'#bb5345');
 for(const y of [12.1,17.9]){
  add('후문 주황 안전봉 '+y,[-18.85,y-.065,-.6,-18.72,y+.065,.28],'#dc643b','paint',true);
  for(const z of [-.34,-.04])add('안전봉 반사띠 '+y+z,[-18.86,y-.075,z,-18.71,y+.075,z+.095],white);
 }
 // White directional arrows on the concrete, without copying vehicle plates.
 for(const x of [-12,4,29]){
  add('주차장 화살표 줄 '+x,[x,14.9,-.568,x+1.25,15.10,-.560],white,'chalk');
  for(let i=0;i<7;i++){const w=.60*(1-i/7);add('주차장 화살촉 '+x+i,[x-.7+i*.1,15-w,-.568,x-.6+i*.1,15+w,-.560],white,'chalk');}
 }
 // Rear building entry: preserve the clear 1.8 m opening under the stair and
 // smooth existing under-stair ramp. Fold the two leaves away from the doorway.
 const {left:L,right:R,y:Y,bottom:B,top:T}=STAIR_REAR_EXIT;
 add('후문 파란 차양',[L-.6,Y+.02,T+.32,R+.6,Y+1.3,T+.61],blue,'metal');
 add('후문 차양 천장',[L-.54,Y+.08,T+.30,R+.54,Y+1.24,T+.32],'#c1c9c5');
 add('후문 현관등',[L+.5,Y+.40,T+.275,R-.5,Y+.8,T+.30],'#f5edda','lamp');
 for(const x of [L-.13,R+.07]){
  add('후문 열린 유리문',[x,Y+.20,B+.07,x+.045,Y+1.02,T-.06],'#d8e2dc','clear_glass',true);
  add('후문 열린 문 하부',[x-.008,Y+.22,B+.08,x,Y+1.0,B+.81],'#a4b4ad');
  for(const z of [B+.05,B+.81,T-.04])add('후문 문 가로틀 '+x+z,[x-.016,Y+.20,z,x+.064,Y+1.04,z+.035],metal,'metal');
  add('후문 손잡이 '+x,[x-.04,Y+.85,B+.81,x+.09,Y+.89,B+1.18],metal,'metal');
 }
 add('후문 점자블록',[L-.1,Y+.28,B+.012,R+.1,Y+.62,B+.023],'#c6ad67','tactile_mat');
 add('후문 먼지매트',[L+.12,Y+.7,B+.012,R-.12,Y+1.13,B+.021],'#655d54','rubber_mat');
 // Shoe rack / umbrella rail occupy the wall edge, not the already narrow aisle.
 for(const z of [B+.05,B+.38,B+.71])add('후문 신발 선반 '+z,[54.76,8.82,z,54.94,9.75,z+.045],'#a38e66','wood');
 for(const y of [8.82,9.72])add('후문 신발장 옆판 '+y,[54.76,y,B,54.94,y+.03,B+.95],'#c5b28b','wood');
 for(let i=0;i<4;i++)add('후문 실내화 '+i,[54.77,8.9+i*.19,B+.43,54.91,9.03+i*.19,B+.50],'#59676b');
 add('후문 창고 살구색 문',[54.87,7.9,B+.02,54.92,8.65,B+1.85],'#d0a18b');
 // Light-blue dado and gently descending handrail from the additional three
 // rear-entry photos. Keep all finishes beyond the clear walking envelope.
 for(let i=0;i<16;i++){
  const y=4.3+i*.34,ground=B*Math.max(0,Math.min(1,(y-4.2)/2.2));
  add('후문 통로 하늘색 하부벽 '+i,[54.88,y,ground,54.905,y+.34,ground+1.04],'#a4b8c8');
  add('후문 통로 스테인리스 손잡이 '+i,[54.80,y,ground+.79,54.845,y+.35,ground+.835],metal,'metal');
 }
 // Blue school facade details seen in the photos; no opaque panel on glazing.
 for(const x of [50.08,54.83])add('후문 계단 외벽 파란 세로띠 '+x,[x,10.13,3.65,x+.085,10.17,12.8],blue,'metal');
 // Upper front approach: small white garden fence and twin-globe lamp, clear of
 // x-axis ramp path y=-13.5, existing car parking and hall doorway.
 for(let x=27;x<36;x+=.5)add('정문 위 화단 흰 울타리 '+x,[x,-18.6,-.3,x+.085,-18.53,.37],white,'paint',true);
 for(const z of [-.05,.23])add('정문 위 울타리 가로대 '+z,[27,-18.62,z,35.6,-18.51,z+.045],white);
 add('정문 위 가로등 기둥',[32.8,-18.75,-.3,32.94,-18.61,3.6],'#535e51','metal',true);
 add('정문 위 가로등 가지',[32.12,-18.73,3.46,33.62,-18.63,3.55],'#535e51','metal');
 for(const x of [32.2,33.35])add('정문 위 둥근 가로등 '+x,[x-.21,-18.9,3.19,x+.21,-18.46,3.61],'#e7eadc','lamp',false,{shape:'sphere'});
 // Rostrum: retain existing platform elevation and safe spawn, but replace the
 // blanket front treads by left/right flights. The photo has a continuous front
 // guard, open rear approach, yellow stair fascia and blue/cream/green canopy.
 for(const list of [boxes,colliders,surfaces]){
  const next=list.filter(b=>!b.name.startsWith('구령대 진입 계단 '));list.splice(0,list.length,...next);
 }
 for(let i=0;i<4;i++){
  const inset=(i+1)*.4,top=.3-i*.2;
  const step=add('구령대 동측 계단 '+i,[50,-12.5,-.6,50+inset,-9.5,top],'#aaa99f','storage_concrete',true,{stepSurface:true});
  surfaces.push({name:step.name,bounds:step.bounds,height:()=>top});
  const rear=add('구령대 뒤 현관 연결 계단 '+i,[38,-9.5,-.65,50,-9.5+inset,top],'#aaa99f','storage_concrete',true,{stepSurface:true});
  surfaces.push({name:rear.name,bounds:rear.bounds,height:()=>top});
 }
 // Follow the original concrete elevation so no new jump lip is introduced.
 add('구령대 상부 바닥',[38,-12.5,.501,50,-9.5,.512],'#b1b0a4','storage_concrete');
 for(const x of [38.16,49.84])for(const y of [-12.28,-9.73])add('구령대 차양 기둥 '+x+y,[x-.045,y-.045,.5,x+.045,y+.045,3.32],metal,'metal',true);
 const stripe=['#1798c9','#169ccc','#dfdcc8','#69b848','#7fc146','#64b242','#e1decf','#219fc8','#189bcb'];
 for(let i=0;i<9;i++){
  const a=37.62+i*12.76/9,b=a+12.76/9;
  add('구령대 줄무늬 차양 '+i,[a,-13.02,3.30,b,-9.05,3.57],stripe[i],'paint',true,{shape:'terrain',heights:[3.57,3.57,3.37,3.37]});
  add('구령대 처마 앞면 '+i,[a,-13.09,3.27,b,-13.01,3.51],stripe[i]);
  add('구령대 처마 윗곡면 '+i,[a,-13.09,3.50,b,-12.79,3.58],stripe[i],'paint',false,{shape:'terrain',heights:[3.51,3.51,3.58,3.58]});
  add('구령대 지붕 아래판 '+i,[a,-12.94,3.28,b-.035,-9.11,3.305],'#d0d1c4','metal');
  add('구령대 지붕 세로보 '+i,[a,-13.02,3.22,a+.045,-9.03,3.31],metal,'metal');
 }
 for(const y of [-12.94,-11.7,-10.4,-9.14])add('구령대 지붕 가로보 '+y,[37.62,y,3.18,50.38,y+.055,3.30],metal,'metal');
 for(const z of [.68,1.51])add('구령대 전면 난간 가로대 '+z,[38,-12.48,z,50,-12.42,z+.045],metal,'metal',true);
 for(let x=38.08;x<50;x+=.22)add('구령대 전면 난간 세로살 '+x,[x,-12.48,.51,x+.03,-12.42,1.54],metal,'metal',true);
 for(const side of [-1,1])for(let i=0;i<9;i++){
  const x=side<0?36.8+i*.14:50+i*.14,z=side<0?-.1+i*.075:.5-i*.075;
  add('구령대 계단 노란 측면 '+side+i,[x,-12.52,-.3,x+.181,-12.49,Math.max(-.27,z)],'#efb52e');
  add('구령대 계단 난간 '+side+i,[x,-12.50,z+.02,x+.025,-12.45,z+1.02],metal,'metal',true);
  add('구령대 계단 손잡이 '+side+i,[x,-12.51,z+.97,x+.19,-12.43,z+1.02],metal,'metal');
 }
 add('구령대 노란 앞띠',[38,-12.535,.32,50,-12.505,.5],'#e3ae28');
 add('구령대 하부 회색 점검문',[43.5,-12.538,-.28,44.5,-12.525,.29],'#9ba19f','metal');
 add('구령대 점검문 손잡이',[44.3,-12.56,-.02,44.35,-12.54,.13],metal,'metal');
 return {photoCounts:Object.fromEntries(Object.entries(OCTOBER_OUTDOOR_PHOTOS).map(([k,v])=>[k,v.length])),approximate:true,originalsPublished:false};
}
