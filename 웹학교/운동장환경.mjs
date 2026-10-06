import {ROSTRUM_SPAWN} from './구령대배치.mjs';
export const OUTDOOR_SPAWN={...ROSTRUM_SPAWN};
export const OUTDOOR_YAW=Math.PI; // Start on the raised platform facing the field.
// Additional landscaping requested by the user; placement is not surveyed.
export const EXTRA_TREES=[
  ...[-4,7,18,29,40,51,62,73,84].map((x,i)=>({x,y:-75-(i%2)*1.4,scale:.90+(i%3)*.13})),
  ...[-64,-55,-46,-37,-28,-19].map((y,i)=>({x:84,y,scale:.9+(i%3)*.12})),
  ...[6,16,24].map((x,i)=>({x,y:-9.6,scale:.8+i*.1})),
];
export function addTreeColliders(addBox){
  for(const [i,t] of EXTRA_TREES.entries()){
    const b=addBox('추가 운동장 나무 줄기 '+i,[t.x-.17,t.y-.17,-.6,t.x+.17,t.y+.17,2.8*t.scale],[.31,.28,.21],'wall',0);
    b.renderInDetails=true;
  }
}
