import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {PRINCIPAL_GREETING,LOBBY_PRINCIPAL_POSITION as npc,principalCanGreet,blocksPrincipal,createLobbyPrincipalState} from '../교장선생님인사.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')));
assert.equal(PRINCIPAL_GREETING,'행복하세요! 9월은 September!');
assert(world.candidate(npc.x,npc.y,npc.z),'현관 NPC 지점은 비어 있음');
assert.equal(world.roomAt(npc).room.id,'1F_MAIN_LOBBY');
const player={x:45,y:-2.8,z:0};
assert(principalCanGreet(player,npc,{colliders:world.colliders}),'현관 접근 인사');
assert(!principalCanGreet({...player,x:40},npc),'멀리서 숨김');
assert(!principalCanGreet({...player,z:3.4},npc),'다른 층 숨김');
assert(!principalCanGreet(player,npc,{active:false}),'메뉴와 항공뷰에서 숨김');
assert(!principalCanGreet(player,npc,{colliders:[{bounds:[45.5,-3,0,45.6,-2,3]}]}),'사이에 벽이 있으면 숨김');
assert(principalCanGreet(player,npc,{colliders:[{bounds:[45.5,-3,-.2,45.6,-2,0]}]}),'바닥은 눈높이 가리지 않음');
assert(blocksPrincipal({x:46.3,y:-2.8,z:0},{x:46.6,y:-2.8,z:0},npc),'몸통 통과 방지');
assert(!blocksPrincipal({x:46.6,y:-2.8,z:0},{x:46.3,y:-2.8,z:0},npc),'NPC에게서 멀어질 수 있음');
assert(!blocksPrincipal({x:46.3,y:-2.8,z:3.4},{x:46.6,y:-2.8,z:3.4},npc),'다른 층 충돌 없음');
const state=createLobbyPrincipalState(),initial=state.getState();
state.update(.05,player,true);assert.deepEqual(state.getState(),initial,'메뉴 일시정지');
for(let i=0;i<100;i++)state.update(.05,player);
assert.deepEqual(state.getState().position,npc,'통행을 막지 않는 고정 위치');
assert(Math.abs(state.getState().heading-Math.PI*1.5)<.01,'다가온 학생 방향으로 회전');
// Main entrance stays freely traversable to either side of the greeter.
let p={x:45,y:1,z:0};for(let i=0;i<30;i++){const next=world.move(p,0,-.2);assert(!blocksPrincipal(p,next,npc));p=next;}
assert(p.y< -4.9,'중앙현관 통로 유지');
console.log({ok:true,lobbyPlacement:true,nearGreeting:true,wallOcclusion:true,otherFloorHidden:true,bodyCollision:true,entranceClear:true});
