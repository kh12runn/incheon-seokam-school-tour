import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {UPLOADED_CLASSROOM_PROFILES as profiles} from '../업로드교실관찰.mjs';
import {OCT8_CLASSROOM_OBSERVATIONS as added} from '../십월팔일교실관찰.mjs';
import {EXTRA_PHOTO_ROOMS as specials} from '../추가공간사진배치.mjs';
import {OCT8_SPACE_REFERENCES as specialAdded} from '../십월팔일특별실배치.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),ids=new Set([...Object.keys(added),...Object.keys(specialAdded)]);
const current=buildWorld(data),saved=Object.fromEntries(Object.keys(added).map(id=>[id,profiles[id]]));
for(const id of Object.keys(added))delete profiles[id];
for(const id of Object.keys(specialAdded))delete specials[id];
let before;try{before=buildWorld(data);}finally{Object.assign(profiles,saved);Object.assign(specials,specialAdded);}
for(const key of ['classroomInteriors','specialInteriors']){
 const keep=items=>items.filter(c=>!ids.has(c.roomId));
 assert.equal(JSON.stringify(keep(current[key])),JSON.stringify(keep(before[key])),key+' pre-existing interiors unchanged');
}
for(const key of ['data','stairs','surfaces','principalOffice','classroom21','classroom64'])assert.equal(JSON.stringify(current[key]),JSON.stringify(before[key]),key+' preserved');
for(const id of Object.keys(added)){
 const c=current.classroomInteriors.find(c=>c.roomId===id);
 assert.equal(c.profile.sourceRevision,added[id].revision);
 assert.equal(c.profile.photoCount,added[id].count);
 assert(c.boxes.every(b=>b.floor===parseInt(c.room.floor)),id+' correct floor metadata');
}
assert.equal(Object.values(added).reduce((sum,p)=>sum+p.count,0),64);
assert.equal(Object.values(specialAdded).reduce((sum,p)=>sum+p.count,0),17);
console.log(JSON.stringify({ok:true,newSpaces:ids.size,referencePhotos:81,existingInteriorsUnchanged:true,structureAndMovementPreserved:true}));
