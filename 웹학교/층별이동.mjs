// The model has one ground-floor MAIN lobby, not eight separate lobby rooms.
// Upper floors / ANNEX use the corridor in front of the central stair entrance.
export function floorDestination(data,building,floor){
  if(!['MAIN','ANNEX'].includes(building)||!Number.isInteger(floor)||floor<1||floor>4)return null;
  const stair=data.rooms.find(r=>r.id===`${floor}F_${building}_STAIR_${building==='MAIN'?'B':'E'}`);
  if(!stair)return null;
  const b=stair.bounds;
  const point=building==='MAIN'?{x:(b[0]+b[1])/2,y:1.5,z:(floor-1)*data.floorHeight}
    :{x:101.5,y:(b[2]+b[3])/2,z:(floor-1)*data.floorHeight};
  return {point,yaw:building==='MAIN'?Math.PI/2:0,label:`${building==='MAIN'?'본관':'별관'} ${floor}층 중앙현관 앞 복도`};
}
