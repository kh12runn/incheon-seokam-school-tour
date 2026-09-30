// Photo-guided west boundary: left when facing MAIN from the playground.
// Bay count and dimensions are estimates; keep the gate slope north of y=-42 clear.
export const PARKING={bounds:[-22,-76,-.6,-9,-42,-.58],spaces:10,firstX:13,spacing:2.75,sign:{x:-16.35,y:-75.75,z:1.3}};
export function addParking(addBox){
  // Retain the existing car geometry in bay-local coordinates, facing the field.
  const box=(name,b,color,kind='finish')=>addBox('주차장 '+name,[3-b[4],b[0]-86,b[2],3-b[1],b[3]-86,b[5]],color,kind,0);
  const ground=addBox('주차장 흙 바닥',PARKING.bounds,[.61,.52,.41],'finish',0);ground.material='soil';
  // Keep the 6.5 m front aisle clear; cars sit only in the marked rear bays.
  for(let i=0;i<=PARKING.spaces;i++){
    const x=PARKING.firstX+i*PARKING.spacing;
    box('주차선 '+i,[x,18.5,-.579,x+.07,24.5,-.571],[.81,.82,.79]);
  }
  box('주차선 뒤',[13,24.43,-.579,40.57,24.5,-.571],[.81,.82,.79]);
  box('뒤 경계석',[10,24.85,-.6,44,25,-.44],[.57,.58,.55],'wall');
  box('안내판 기둥',[10.2,19.3,-.6,10.3,19.4,1.55],[.43,.46,.46],'wall');
  for(const [i,color] of [[2,[.7,.72,.72]],[4,[.19,.25,.30]],[6,[.55,.57,.58]],[9,[.34,.36,.38]]]){
    const x=PARKING.firstX+(i+.5)*PARKING.spacing;
    box('자동차 차체 '+i,[x-.9,19.35,-.32,x+.9,23.55,.28],color,'wall');
    box('자동차 지붕 '+i,[x-.75,20.5,.27,x+.75,22.7,.95],color,'wall');
    box('자동차 유리 앞 '+i,[x-.68,20.47,.36,x+.68,20.51,.83],[.12,.18,.21]);
    box('자동차 유리 뒤 '+i,[x-.68,22.69,.36,x+.68,22.73,.83],[.12,.18,.21]);
    for(const side of [-1,1]){
      box('자동차 유리 옆 '+i+' '+side,[x+side*.76-.015,20.7,.4,x+side*.76+.015,22.5,.84],[.12,.18,.21]);
      for(const y of [20,22.8])box('자동차 바퀴 '+i+' '+side+' '+y,[x+side*.88-.12,y-.3,-.59,x+side*.88+.12,y+.3,-.01],[.07,.075,.075],'wall');
    }
    for(const side of [-1,1])box('자동차 전조등 '+i+' '+side,[x+side*.62-.15,19.32,-.13,x+side*.62+.15,19.35,.06],[.83,.84,.78]);
  }
}
