import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {CLASS_TEACHERS} from '../담임선생님.mjs';
import {createTeacherWalk,createTeacherWalkAsync} from '../선생님교실산책.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),{interactiveDoors:true}),results=[];
for(const config of CLASS_TEACHERS){
 const sync=createTeacherWalk(world,config);let ticks=0,yields=0;
 const asyncWalk=await createTeacherWalkAsync(world,config,{clock:()=>ticks++*.1,yieldWork:async()=>{yields++;},planningBudgetMs:.5});
 assert(yields>5,'Graph preparation must yield to rendering');
 assert.deepEqual(asyncWalk.getState().position,sync.getState().position);
 assert.equal(asyncWalk.getState().navigationNodes,sync.getState().navigationNodes,'same reachable safe graph');
 for(let i=0;i<6000;i++){
  const state=asyncWalk.update(1/60,null);assert(world.candidate(state.position.x,state.position.y,state.position.z),'never cross furniture');
 }
 const state=asyncWalk.getState();assert(state.distance>10,'time slicing must not strand the teacher');assert(state.planningSlices>state.replans,'replanning must also be sliced');
 results.push({id:config.id,yields,nodes:state.navigationNodes,distance:state.distance,planningSlices:state.planningSlices});
}
const controller=new AbortController();controller.abort();await assert.rejects(createTeacherWalkAsync(world,CLASS_TEACHERS[0],{signal:controller.signal}));
console.log(JSON.stringify({ok:true,results}));
