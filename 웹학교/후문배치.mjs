// Looking south at the main building from the rear lot: seven o'clock is
// behind-left (east/north in map coordinates). Vehicles enter facing south.
export const REAR_GATE={x:64,y:24.5,entryYaw:Math.PI,lane:[60,12,-.6,68,34.5,-.58]};
export const rearGatePoint=(x,y,z)=>({x:REAR_GATE.x+y-15,y:REAR_GATE.y-x-21,z});
export function rearGateBounds(b){
 const a=rearGatePoint(b[0],b[1],b[2]),c=rearGatePoint(b[3],b[4],b[5]);
 return [Math.min(a.x,c.x),Math.min(a.y,c.y),a.z,Math.max(a.x,c.x),Math.max(a.y,c.y),c.z];
}
export const isRearGatePart=name=>/^(후문 경비실|경비실|후문 돌 문주|문주 아치|문주 검은|후문 차단기|후문 올린 차단봉|차단봉 빨간|후문 주황 안전봉|안전봉 반사|후문 옆|주차장 화살)/.test(name);
