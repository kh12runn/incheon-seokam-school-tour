// Approved 15-photo set, reviewed 2026-10-06. Existing hall footprint and
// level gate exit are retained; proportions are approximate, not a resurvey.
export const HALL_PHOTO_REFERENCE={sourceRoomId:'1F_MULTIPURPOSE',targetRoomId:'B1_MAIN_HALL',count:15,reviewedAt:'2026-10-06',imageIds:[
 '3d90b0c3-a8ab-4fdb-a247-0315bb25cc16','35919eab-7283-4881-ab20-787a37522004','736435ac-4ca2-4c77-9548-6f97ca7d8837','7e012a65-ba29-49da-8114-3414d3de6ec7','b03363d2-9976-47d3-9d38-8715e27caba6','f0047570-be52-4967-8e10-7bb6d9b49ad8','932e2ee4-a81b-4c9c-b550-2dfe3b7c7109','6397ba9b-0690-4d30-9e90-5f4398a1f770','2249f75d-1f59-433a-a2af-331b408f02fa','3a037faf-6498-4227-ab61-1308c3461f83','d57d567b-6612-490d-ba5e-c76b80768282','1ffabc0c-a552-439c-a0e6-2bddb7e87cb5','b7000d23-9678-45a3-96b8-0e4ab2344e1e','041427f2-cb30-4612-acf8-3fc34ad4f8bb','1df35d4a-7019-4269-8fd2-736cdd6bb976'],features:['주황 세로 골 벽 보호대','목재 체육 바닥·흰 경기선·빨강/남색 보조선','기존 전면 거울','상단 가로창','파란 매트와 이동식 체육망','체육용품 창고·주황 바구니·공·후프'],peopleExcluded:true};
export function addHallPhotoFinish(boxes,colliders,floorHeight){
 const z=-floorHeight,orange=[.91,.30,.08],white=[.88,.90,.87],blue=[.035,.13,.52],steel=[.63,.69,.68];
 const config={reference:HALL_PHOTO_REFERENCE,hoops:[]};
 const add=(name,b,color=white,material='paint',solid=false,extra={})=>{
  const item={name:'다목적실 사진 '+name,spaceId:'B1_MAIN_HALL',floor:0,basement:true,kind:'finish',material,color,bounds:b.map((v,i)=>i===2||i===5?v+z:v),...extra};
  boxes.push(item);if(solid)colliders.push(item);return item;
 };
 for(const b of boxes.filter(b=>b.spaceId==='B1_MAIN_HALL'&&b.kind==='floor')){b.material='control_wood';b.color=[.64,.49,.31];}
 for(let i=boxes.length-1;i>=0;i--)if(boxes[i].spaceId==='B1_MAIN_HALL'&&/강당 (조명틀|천장등)/.test(boxes[i].name))boxes.splice(i,1);
 for(const x of [-15.3,-12.6,-9.9,-7.2])for(const y of [-4.6,-.8,3,6.8])add('사각 LED 천장등',[x-.23,y-.23,3.05,x+.23,y+.23,3.085],[1,.98,.91],'lamp');
 function padding(axis,start,end,fixed){
  const bound=(a,b,h,H,depth)=>axis==='x'?[fixed-depth,a,h,fixed+depth,b,H]:[a,fixed-depth,h,b,fixed+depth,H];
  add('주황 충격 보호벽',bound(start,end,.08,1.95,.025),orange,'rubber_mat');
  for(let a=start;a<end;a+=.095)add('보호벽 세로 골',bound(a,Math.min(a+.035,end),.09,1.94,.047),[.79,.18,.035],'rubber_mat');
  add('보호벽 상단 마감',bound(start,end,1.95,1.99,.05),[.68,.21,.07],'wood');
 }
 padding('x',-6.8,9.7,-16.88);padding('x',-2.2,.25,-5.12);padding('x',2.75,9.7,-5.12);
 padding('y',-16.8,-12.3,-6.88);padding('y',-9.7,-7.75,-6.88);
 // Flush lines never become collision steps. The centre stays open for play.
 const stripe=(name,x,y,X,Y,color=white)=>add(name,[x,y,.009,X,Y,.013],color);
 for(const x of [-15.4,-11,-8.6])stripe('흰 코트 세로선',x,-4.5,x+.035,7.8);
 for(const y of [-4.5,-.1,3.3,7.8])stripe('흰 코트 가로선',-15.4,y,-8.56,y+.035);
 stripe('빨간 세로선',-15.85,-5.4,-15.82,8.45,[.62,.08,.04]);
 stripe('남색 세로선',-8.13,-1.7,-8.10,8.45,blue);
 for(const y of [-5.4,8.42])stripe('빨간 가로선',-15.85,y,-8.10,y+.03,[.62,.08,.04]);
 // High windows are glazed recesses: retain the wall collision/outside terrain.
 for(let y=-5.8;y<8.8;y+=1.6){
  add('상단 창틀',[-16.84,y,2.23,-16.77,y+1.38,2.92],steel,'metal');
  add('상단 창 유리',[-16.76,y+.055,2.29,-16.745,y+1.325,2.86],[.36,.57,.58],'glass');
  add('상단 창 중간틀',[-16.73,y+.66,2.25,-16.69,y+.70,2.90],steel,'metal');
 }
 // Storage fits in the entry-side corner, away from the hall and gate routes.
 add('교구실 흰 칸막이',[-7.7,-6.85,0,-7.58,-4.95,3.10],white,'paint',true);
 add('교구실 출입문 옆벽',[-7.7,-3.55,0,-7.58,-2.3,3.10],white,'paint',true);
 add('교구실 출입문 상부',[-7.7,-4.95,2.4,-7.58,-3.55,3.10],white);
 add('교구실 안쪽벽',[-7.7,-2.4,0,-5.15,-2.28,3.10],white,'paint',true);
 add('열린 교구실 목재문',[-7.55,-3.65,.05,-6.45,-3.58,2.39],[.72,.54,.35],'wood',true);
 for(const y of [-4.96,-3.57])add('교구실 문틀',[-7.73,y,0,-7.55,y+.06,2.46],[.62,.43,.28],'wood');
 add('교구실 문 위틀',[-7.73,-4.96,2.4,-7.55,-3.51,2.46],[.62,.43,.28],'wood');
 // The shelf and basket bodies share compact batched geometry.
 for(const y of [-6.58,-5.3,-4.02])for(const x of [-5.65,-5.22])add('선반 다리',[x,y,.04,x+.035,y+.035,2.15],steel,'metal');
 for(let level=0;level<4;level++){
  const h=.14+level*.48;add('교구 선반',[-5.7,-6.58,h,-5.18,-3.96,h+.035],white,'metal');
  for(let n=0;n<4;n++){
   const y=-6.50+n*.62;add('주황 교구 바구니',[-5.64,y,h+.05,-5.22,y+.50,h+.34],[.95,.53,.08],'paint',true);
   for(let i=0;i<4;i++)add('바구니 격자',[-5.655,y+.06+i*.10,h+.1,-5.643,y+.075+i*.10,h+.29],[.65,.32,.04]);
  }
 }
 for(let n=0;n<9;n++)config.hoops.push({x:-5.43,y:-5.5+(n%3)*.12,z:z+2.16+n*.025,color:['#e86fa1','#d3cf27','#2983b4'][n%3]});
 for(let n=0;n<5;n++){
  const x=-6.95+(n%2)*.49,y=-6.1+Math.floor(n/2)*.5;
  add('교구 공',[x,y,.06,x+.42,y+.42,.48],n%2?[.60,.28,.09]:[.04,.30,.70],'rubber_mat',true,{shape:'sphere'});
 }
 for(let n=0;n<10;n++)add('쌓은 파란 체육 매트',[-8.40,-6.2,.10+n*.19,-7.78,-4.98,.27+n*.19],blue,'rubber_mat',true);
 for(let n=0;n<3;n++)add('매트 계단',[-9.35+n*.26,-6.2,.04,-9.09+n*.26,-5.00,.23+n*.22],blue,'rubber_mat',true);
 for(const [x,y] of [[-16.05,7.1],[-5.88,7.8]]){
  add('스탠드 냉난방기',[x,y,.02,x+.58,y+.55,2.1],white,'paint',true);
  for(let i=0;i<8;i++)add('냉난방기 송풍구',[x+.025,y-.012,1.32+i*.067,x+.55,y,1.345+i*.067],[.29,.35,.33]);
 }
 // Stored nets against the far wall do not span the walking/play area.
 for(const y of [3.8,6.0]){
  for(const end of [y,y+1.7]){add('체육망 지주',[-16.42,end,.08,-16.38,end+.045,1.6],steel,'metal',true);add('체육망 받침',[-16.67,end-.12,.025,-16.12,end+.16,.1],[.2,.3,.26],'metal',true);}
  for(let h=.4;h<1.62;h+=.16)add('체육망 가로줄',[-16.405,y,h,-16.393,y+1.75,h+.012],[.29,.34,.30]);
  for(let t=y;t<y+1.75;t+=.16)add('체육망 세로줄',[-16.405,t,.4,-16.393,t+.012,1.6],[.29,.34,.30]);
 }
 add('입구 녹색 매트',[-6.30,.48,.012,-5.15,2.52,.024],[.12,.46,.26],'rubber_mat');
 add('정문 출구 녹색 매트',[-12.05,-6.80,.012,-9.95,-5.95,.024],[.12,.46,.26],'rubber_mat');
 return config;
}
