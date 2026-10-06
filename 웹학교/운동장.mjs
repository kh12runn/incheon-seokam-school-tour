// Photo-guided details on the existing estimated field layout.
// Keep the single field INSIDE the L-shaped campus, facing classroom windows.
// Only surface appearance is provisional; never move it to the corridor side.
import {ROSTRUM} from './구령대배치.mjs';
export const GOAL_LAYOUT={centreX:(ROSTRUM.left+ROSTRUM.right)/2,north:ROSTRUM.front-4,south:-64,width:7,depth:1.25};
export function outdoorBox(box){
  if(box.name==='SPACE_EXT_PLAYGROUND'){
    return {...box,color:[.57,.43,.28]};
  }
  if(box.name==='SiteGround'){
    return {...box,color:[.4,.46,.34]};
  }
  return box;
}
export function addPlaygroundDetails(addBox){
  const z=-.294,chalk=[.82,.78,.65];
  const {centreX:cx,north,south,width,depth}=GOAL_LAYOUT,left=cx-width/2,right=cx+width/2;
  const line=(name,b)=>addBox('운동장 임시 '+name,b,chalk,'finish',0);
  // A simple, weathered PE field marking; exact markings await site photos.
  for(const x of [cx-22,cx+22])line('세로 경계 '+x,[x,south,z,x+.075,north,z+.008]);
  for(const y of [south,north])line('가로 경계 '+y,[cx-22,y,z,cx+22,y+.075,z+.008]);
  line('중앙선',[cx-22,(south+north)/2,z,cx+22,(south+north)/2+.075,z+.008]);
  // North/south ends (top/bottom in the school plan), facing one another.
  for(const y of [south,north]){
    for(const x of [left,right])addBox('운동장 골대 기둥 '+y+' '+x,[x-.05,y-.05,-.3,x+.05,y+.05,2.1],[.77,.79,.77],'wall',0);
    addBox('운동장 골대 가로대 '+y,[left-.05,y-.05,2.05,right+.05,y+.05,2.15],[.77,.79,.77],'wall',0);
    // Approved September photos: blue lower posts and a dark net.
    for(const x of [left,right])addBox('운동장 사진 골대 파란 하부 '+y+' '+x,[x-.056,y-.056,-.3,x+.056,y+.056,.65],[.12,.3,.63],'finish',0);
    const back=y+(y===south?-depth:depth),net=[.30,.35,.30];
    for(let i=0;i<=28;i++){
      const x=left+i*width/28;
      addBox('운동장 사진 골망 세로 '+y+' '+i,[x-.009,back-.009,-.29,x+.009,back+.009,2.08],net,'finish',0);
      addBox('운동장 사진 골망 윗면 '+y+' '+i,[x-.009,Math.min(y,back),2.07,x+.009,Math.max(y,back),2.088],net,'finish',0);
    }
    for(let i=0;i<=9;i++){
      const h=-.29+i*.26;
      addBox('운동장 사진 골망 가로 '+y+' '+i,[left,back-.009,h,right,back+.009,h+.018],net,'finish',0);
      for(const x of [left,right])addBox('운동장 사진 골망 옆면 '+y+' '+i+' '+x,[x-.009,Math.min(y,back),h,x+.009,Math.max(y,back),h+.018],net,'finish',0);
    }
    const inside=y===south?south+8:north-8;
    for(const x of [cx-12,cx+12])line('골문 구역 옆 '+y+' '+x,[x,Math.min(y,inside),z,x+.075,Math.max(y,inside),z+.008]);
    line('골문 구역 앞 '+y,[cx-12,inside,z,cx+12,inside+.075,z+.008]);
  }
}
