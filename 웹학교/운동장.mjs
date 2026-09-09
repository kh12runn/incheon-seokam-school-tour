// Temporary outdoor layout until the user supplies playground photographs.
// Keep the single field INSIDE the L-shaped campus, facing classroom windows.
// Only surface appearance is provisional; never move it to the corridor side.
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
  const line=(name,b)=>addBox('운동장 임시 '+name,b,chalk,'finish',0);
  // A simple, weathered PE field marking; exact markings await site photos.
  for(const x of [16,60])line('세로 경계 '+x,[x,-64,z,x+.075,-16,z+.008]);
  for(const y of [-64,-16])line('가로 경계 '+y,[16,y,z,60,y+.075,z+.008]);
  line('중앙선',[16,-40,z,60,-39.925,z+.008]);
  // North/south ends (top/bottom in the school plan), facing one another.
  for(const y of [-64,-16]){
    for(const x of [34.5,41.5])addBox('운동장 골대 기둥 '+y+' '+x,[x-.05,y-.05,-.3,x+.05,y+.05,2.1],[.77,.79,.77],'wall',0);
    addBox('운동장 골대 가로대 '+y,[34.45,y-.05,2.05,41.55,y+.05,2.15],[.77,.79,.77],'wall',0);
    const inside=y===-64?-56:-24;
    for(const x of [26,50])line('골문 구역 옆 '+y+' '+x,[x,Math.min(y,inside),z,x+.075,Math.max(y,inside),z+.008]);
    line('골문 구역 앞 '+y,[26,inside,z,50,inside+.075,z+.008]);
  }
}
