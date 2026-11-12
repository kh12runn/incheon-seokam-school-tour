import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {createFootballPhysics} from '../축구공물리.mjs';
import {createDriving} from '../운전물리.mjs';
import {Vec3} from '../외부도구/cannon-es.mjs';

// Use the actual boarding flow, raycast wheels, heightfield and school bodies.
// A centre-only walking/candidate probe cannot reproduce a bumper caught before
// its front wheels reach the former 42 cm play-area edge.
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'));
const original=JSON.stringify(data),school=buildWorld(data),physics=createFootballPhysics(school,{count:0}),driving=createDriving(school,physics);
let player={...school.spawn};
const tick=(input={})=>{
 const previous=player;player=driving.update(1/60,player,input);
 physics.update(1/60,player,previous,{canKick:false});driving.sync(1/60);
 if(driving.phase==='driving')player=driving.seat();
};
function board(id){
 const car=driving.cars.find(c=>c.id===id),door=driving.point(car,-car.d.width/2-.62,.35);
 player=school.candidate(door.x,door.y,door.z);assert.ok(player,id+' door must remain accessible');
 assert.ok(driving.enter(player),id+' must board normally');
 for(let i=0;i<160;i++)tick();
 assert.equal(driving.phase,'driving');return car;
}
const results=[];
for(const id of ['field-sedan-black','field-suv-grey']){
 const car=board(id),start={...car.body.position};let airborne=0;
 for(let i=0;i<270&&car.body.position.x< -6;i++){tick({forward:1});if(car.vehicle.numWheelsOnGround<2)airborne++;}
 const end={...car.body.position};
 assert.ok(end.x> -6,id+' must leave the parking apron under forward input: '+JSON.stringify({start,end,speed:driving.getState().speed}));
 assert.ok(Math.abs(end.y-start.y)<1.5,'Ramp may not steer/teleport the vehicle sideways');
 assert.ok(car.body.vectorToWorldFrame(new Vec3(0,0,1)).z>.92,'Vehicle must remain upright');
 assert.ok(airborne<25,'The ramp should keep wheel contact, not launch the car');
 results.push({id,start,end,airborne});driving.cancel();
}
// A parked car in the second row is still a real obstacle. The terrain fix must
// not disable all vehicle/school collision merely to make forward input succeed.
const blocked=board('field-compact-white');for(let i=0;i<210;i++)tick({forward:1});
assert.ok(blocked.body.position.x< -13.8,'A parked vehicle ahead must still stop the car');
assert.ok(Math.abs(driving.getState().speed)<1,'The blocked car must actually stop');
const contacts=physics.world.contacts.filter(c=>c.bi===blocked.body||c.bj===blocked.body);
assert.ok(contacts.some(c=>(c.bi===blocked.body?c.bj:c.bi).vehicleId),'Parked vehicle collision must remain active');
driving.cancel();
for(const y of [-65,-60,-50]){
 let previous=school.floorBelow(-16,y,.6,{ignoreVehicles:true,ignoreDoors:true});
 for(let x=-15.75;x<=-12;x+=.25){const h=school.floorBelow(x,y,.6,{ignoreVehicles:true,ignoreDoors:true});assert.ok(h>=previous-1e-6);assert.ok(h-previous<.07,'The approach must not introduce a new abrupt step');previous=h;}
}
assert.equal(JSON.stringify(data),original,'Source school layout must remain unchanged');
console.log(JSON.stringify({ok:true,actualRaycastDriving:true,localApron:true,parkedCarCollision:true,results},null,2));
