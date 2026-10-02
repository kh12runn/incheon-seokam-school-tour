import {PARKING,REAR_PARKING} from './주차장.mjs';
export const PARKING_DESTINATIONS={rear:{label:'후문 주차장',lot:'rear',bounds:REAR_PARKING.bounds},front:{label:'정문 주차장',lot:'field',bounds:PARKING.bounds}};
// Use the car's live driver-door position, not a hard-coded spot inside its body.
// If a car has been driven away, choose another car still in the selected lot.
export function parkingDestination(world,driving,key){
 const lot=PARKING_DESTINATIONS[key];if(!lot)return null;
 const b=lot.bounds,cars=driving.cars.filter(c=>c.source.lot===lot.lot&&c.body.position.x>b[0]&&c.body.position.x<b[3]&&c.body.position.y>b[1]&&c.body.position.y<b[4]).sort((a,b)=>Number(b.source.type==='sports')-Number(a.source.type==='sports'));
 for(const car of cars){
  const door=driving.point(car,-car.d.width/2-.62,.35),position=world.candidate(door.x,door.y,door.z);
  if(!position||driving.nearby(position)?.id!==car.id)continue;
  return {position,yaw:Math.atan2(position.x-car.body.position.x,car.body.position.y-position.y),label:lot.label,carId:car.id};
 }
 return null;
}
