import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const {spaces}=load('공간자료/spaces.json');
const {folders}=load('공간자료/capture-manifest.json');
assert.equal(spaces.length,133);
assert.equal(spaces.filter(s=>s.type==='classroom').length,41);
assert.equal(folders.length,243);
assert.equal(new Set(folders.map(f=>f.folder)).size,folders.length);
assert.equal(new Set(folders.map(f=>f.captureId)).size,folders.length);
for(const s of spaces) {
  assert(folders.some(f=>f.spaceId===s.id && f.folder+'/'===s.intakeFolder));
}
for(const f of folders) {
  assert(fs.existsSync(path.join(root,f.folder,'촬영안내.md')));
  assert(!f.folder.includes('..'));
  assert(!/[A-Za-z]/.test(f.folder),'English capture folder: '+f.folder);
  if(f.connectsTo) assert(spaces.some(s=>s.id===f.connectsTo && s.type==='stair'));
  for(const id of f.landmarkSpaceIds??[]) assert(spaces.some(s=>s.id===id));
}
const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8'});
const tracked=git(['ls-files','-z']).split('\0').filter(Boolean);
assert.equal(tracked.filter(p=>p.endsWith('/촬영안내.md')).length,243);
for(const p of tracked) {
  assert(!/^(사진보관|참고자료|모델\/백업)\//.test(p),'Private file tracked: '+p);
  if(p.startsWith('촬영사진_넣는곳/')) assert(p.endsWith('/촬영안내.md'),'Raw intake tracked: '+p);
  assert(!/\.(insp|insv|mp4|pem|blend1)$/i.test(p),'Unexpected media/backup: '+p);
  assert(fs.statSync(path.join(root,p)).size<100*1024*1024,'GitHub file too large: '+p);
}
for(const p of ['모델/school_master.blend','공간자료/spaces.json','공간자료/photos.json','공간자료/settings.json']) assert(tracked.includes(p),'Missing '+p);
for(const ext of ['insp','insv','jpg','png','mp4','json','txt']) {
  const sample=spaces.find(s=>s.id==='4F_6-1').intakeFolder+'20260910/test.'+ext;
  assert(git(['check-ignore',sample]).trim(),'Photo not ignored: '+sample);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [,ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if(!/^(https?:|data:|#)/.test(ref)) assert(fs.existsSync(path.join(root,ref)),'Broken site link: '+ref);
}
const release=load('공간자료/release-check.json');
function verifyDirs(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  if(!ent.isDirectory()||ent.name.startsWith('.'))continue;
  assert(!/[A-Za-z]/.test(ent.name),'English directory: '+path.join(dir,ent.name));
  verifyDirs(path.join(dir,ent.name));
}}
verifyDirs(root);
assert(folders.find(f=>f.captureId==='4F_MAIN_STAIR_B').label.startsWith('6-3 교실 앞'));
assert(folders.find(f=>f.captureId==='3F_MAIN_STAIR_B').label.startsWith('5-3 교실 앞'));
assert.equal(release.walkTests.reduce((sum,t)=>sum+t.path_samples,0),3020);
console.log(JSON.stringify({ok:true,spaces:spaces.length,captureFolders:folders.length,trackedFiles:tracked.length,rawMediaExcluded:true,localSiteLinksValid:true,walkSamples:3020}));
