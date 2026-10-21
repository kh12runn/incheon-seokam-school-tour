import assert from 'node:assert/strict';
import * as T from '../외부도구/three.module.js';
import {scienceRestPoint,correctScienceRestPose} from '../과학교사자세.mjs';
// Shoulder/book region unchanged, right foot brought under its hip, eyes levelled.
assert.deepEqual(scienceRestPoint(.2,1.15,.1),[.2,1.15,.1]);
assert(Math.abs(scienceRestPoint(.22,.04,.03)[0]-.10)<1e-8);
const left=scienceRestPoint(-.09,1.54,.08),right=scienceRestPoint(.01,1.56,.08);
assert(Math.abs(right[1]-left[1])<.002);
const model=new T.Group(),g=new T.SphereGeometry(.09,24,16);g.translate(-.03,1.49,.02);
const m=new T.Mesh(g,new T.MeshStandardMaterial());model.add(m);
const original=g.attributes.position.array.slice(),uv=g.attributes.uv.array.slice();
await correctScienceRestPose(model);assert.notEqual(m.geometry,g);assert.deepEqual(g.attributes.position.array,original);assert.deepEqual(m.geometry.attributes.uv.array,uv);
const p=m.geometry.attributes.position,n=m.geometry.attributes.normal;
for(let i=0;i<p.count;i++){assert(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)));assert(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5);}
const corrected=m.geometry;await correctScienceRestPose(model);assert.equal(m.geometry,corrected);
console.log('Science pose: level eyes, grounded narrower stance, preserved UV/source, finite unit normals, idempotent PASS');
