import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {buildWorld} from '../이동물리.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'웹학교','실사목록.json'),'utf8'));
const rows=JSON.parse(fs.readFileSync(path.join(root,'사진보관','변환본','4층_직접변환','변환기록.json'),'utf8'));
const data=JSON.parse(fs.readFileSync(path.join(root,'웹학교','학교구조.json'),'utf8')),world=buildWorld(data);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(manifest.photos.length,9);assert.equal(rows.length,9);
for(const p of manifest.photos){
  assert(p.ready);assert.equal(p.width,p.height*2);assert.equal(hash(path.resolve(root,p.url)),p.sha256);
  assert(world.candidate(p.position.x,p.position.y,p.position.z),p.name+' return position');
}
assert.equal(new Set(manifest.photos.map(p=>p.sha256)).size,9);
for(const row of rows)assert.equal(hash(path.join(root,row.source)),row.sha256,'Original changed: '+row.no);
const report={ok:true,photos:9,distinctPhotos:9,panoramaRatio:'2:1',originalHashesUnchanged:9,validModelReturnPositions:9,processing:'Local template reprojection and built-in image_gen photographer removal; not calibrated optical flow or 3DGS',visualReview:'All nine generated outputs inspected; no photographer fragments seen. Small lens seam/AI reconstruction differences remain possible.'};
fs.writeFileSync(path.join(root,'공간자료','실사파일검사.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
