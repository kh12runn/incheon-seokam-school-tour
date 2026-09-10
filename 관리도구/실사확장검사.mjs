// Preparation-stage checks only. No asset conversion, upload, or runtime edits.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {runtimeFiles} from './배포최적화.mjs';
import {buildWorld} from '../웹학교/이동물리.mjs';
import {CLASS64_ID,CLASS64_SPAWN} from '../웹학교/육학년사반.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel));
const json=rel=>JSON.parse(read(rel).toString('utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function filesBelow(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    assert.ok(!entry.isSymbolicLink(),'검사 트리의 심볼릭 링크는 허용하지 않습니다');
    const file=path.join(dir,entry.name);
    return entry.isDirectory()?filesBelow(file):[file];
  });
}
const registry=json('assets/splats/장면목록.json');
const template=json('assets/splats/장면등록서식.json');
assert.equal(registry.enabled,false);
assert.deepEqual(registry.scenes.map(scene=>scene.spaceId),[CLASS64_ID],'사용자가 지정한 6-4 교실만 준비 대상으로 등록');
const pilot=registry.scenes[0];
assert.equal(pilot.enabled,false);
assert.equal(pilot.status,'deferred-photo-finish-instead');
assert.equal(pilot.review.userApprovedSpace,true);
for(const [key,value] of Object.entries(pilot.review))if(key!=='userApprovedSpace')assert.equal(value,false,key);
for(const key of ['source','sog','collision','viewer','viewerVersion'])assert.equal(pilot[key],null,key);
assert.deepEqual(pilot.returnLocation.position,CLASS64_SPAWN);
assert.deepEqual(registry.spaceModes,[{spaceId:CLASS64_ID,displayMode:'mesh',plannedDisplayMode:'hybrid',
  features:{mesh:true,panorama:false,splat:false},splatSceneIds:[pilot.id]}]);
assert.equal(registry.viewer.installedVersion,null);
assert.equal(template.templateOnly,true);
assert.equal(template.enabled,false);
for(const key of ['id','spaceId','source','sourceSha256','sog','collision','viewer','viewerVersion','returnLocation'])assert.equal(template[key],null,key);
assert.equal(template.splatTransform.alignmentStatus,'unverified');
assert.deepEqual(template.splatTransform.position,[0,0,0]);
assert.deepEqual(template.splatTransform.rotation,[0,0,0]);
assert.equal(template.splatTransform.scale,1);
assert.ok(Object.values(template.review).every(value=>value===false));

const preparationFiles=filesBelow(path.join(root,'assets/splats'));
assert.ok(preparationFiles.every(file=>/\.(?:md|json)$/.test(file)||path.basename(file)==='.gitignore'),'실제 Splat/가짜 Viewer를 생성하지 않음');
for(const folder of ['원본보존','웹용경량본','충돌모델','뷰어'])assert.ok(fs.existsSync(path.join(root,'assets/splats/장면준비서식',folder,'안내.md')));
for(const folder of ['원본보존','웹용경량본','충돌모델','뷰어'])assert.ok(fs.existsSync(path.join(root,'assets/splats/6-4 교실',folder,'안내.md')));
for(const name of ['장면준비서식','6-4 교실'])for(const file of ['원본보존/scene.ply','원본보존/scene.spz','원본보존/촬영정보.json','웹용경량본/scene.sog','충돌모델/collision.glb','뷰어/index.html']){
  const check=spawnSync('git',['check-ignore','--no-index','--quiet','assets/splats/'+name+'/'+file],{cwd:root});
  assert.equal(check.status,0,'기본 공개 제외: '+file);
}
assert.ok(read('.railwayignore').toString('utf8').split(/\r?\n/).includes('assets/splats/'));
const runtime=runtimeFiles();
assert.ok(!runtime.some(file=>file.startsWith('assets/')||file.includes('실사보기')||file.includes('실사목록')),'현재 UI/배포 연결 상태 유지');
const modelHash=hash(read('모델/school_master.blend'));
const structure=json('웹학교/학교구조.json');
assert.ok(structure.rooms.some(room=>room.id===CLASS64_ID),'기존 공간 ID 참조');
const world=buildWorld(structure),spawn=pilot.returnLocation.position;
assert.ok(world.candidate(spawn.x,spawn.y,spawn.z),'6-4 기본 복귀점은 현재 물리 세계에서 유효');
assert.equal(structure.sourceHash,modelHash,'Blender 저장본과 웹 추출 기준 일치');
const panoramas=json('웹학교/실사목록.json').photos;
for(const photo of panoramas.filter(p=>p.ready))assert.equal(hash(read(photo.url.replace(/^\.\//,''))),photo.sha256,photo.name+' 보존');

let preservedFiles=null;
if(process.argv[2]){
  const backup=path.resolve(root,process.argv[2]);
  const backupParent=path.join(root,'모델/백업')+path.sep;
  assert.ok(backup.startsWith(backupParent),'학교 로컬 백업만 비교');
  const permittedChanges=new Set(['STATE.md','README.md','.railwayignore','관리도구/verify-project.mjs',
    'index.html','웹학교/게임.mjs','웹학교/육학년사반표현.mjs','웹학교/검사/배포검사.mjs',
    '공간자료/배포검사.json','안내문서/6-4 교실 사진반영.md']);
  preservedFiles=0;
  for(const file of filesBelow(backup)){
    const rel=path.relative(backup,file).split(path.sep).join('/');
    if(permittedChanges.has(rel))continue;
    assert.equal(hash(read(rel)),hash(fs.readFileSync(file)),rel+' 작업 전 백업과 동일');
    preservedFiles++;
  }
}
console.log(JSON.stringify({ok:true,stage:'photo-finish-splat-deferred',registeredScenes:registry.scenes.length,activeScenes:registry.scenes.filter(scene=>scene.enabled).length,
  runtimeFiles:runtime.length,panoramasPreserved:panoramas.filter(p=>p.ready).length,preservedFiles,
  modelHash,baseline:{boxes:structure.boxes.length,labels:structure.labels.length,spaces:structure.rooms.length,
    coordinateSystem:structure.coordinateSystem,floorHeight:structure.floorHeight},
  originalsIgnored:true,railwayUploadExcluded:true},null,2));
