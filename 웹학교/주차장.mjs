// Simple provisional outdoor parking, behind MAIN (positive y), within SiteGround.
export const PARKING={bounds:[10,12,-.6,62,25,-.58],spaces:16,firstX:13,spacing:2.75};
export function addParking(addBox){
  const box=(name,bounds,color,kind='finish')=>addBox('주차장 '+name,bounds,color,kind,0);
  box('아스팔트',PARKING.bounds,[.19,.20,.21]);
  box('아스팔트 진입로',[-22,12,-.6,10,18.3,-.58],[.19,.20,.21]);
  // Keep the 6.5 m front aisle clear; cars sit only in the marked rear bays.
  for(let i=0;i<=PARKING.spaces;i++){
    const x=PARKING.firstX+i*PARKING.spacing;
    box('주차선 '+i,[x,18.5,-.579,x+.07,24.5,-.571],[.81,.82,.79]);
  }
  box('주차선 뒤',[13,24.43,-.579,57.07,24.5,-.571],[.81,.82,.79]);
  box('뒤 경계석',[10,24.85,-.6,62,25,-.44],[.57,.58,.55],'wall');
  box('안내판 기둥',[10.2,19.3,-.6,10.3,19.4,1.55],[.43,.46,.46],'wall');
  for(const [i,color] of [[2,[.7,.72,.72]],[6,[.19,.25,.30]],[10,[.55,.57,.58]],[13,[.34,.36,.38]]]){
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
