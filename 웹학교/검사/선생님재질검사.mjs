import assert from 'node:assert/strict';
import {Group,Mesh,BoxGeometry,MeshStandardMaterial,Texture} from '../외부도구/three.module.js';
import {cleanTeacherTexels,finishTeacherMaterials} from '../선생님재질.mjs';

const w=16,h=16,rgba=new Uint8ClampedArray(w*h*4);
for(let i=0;i<w*h;i++)rgba.set([60,70,80,173],i*4);
rgba.set([255,255,255,173],(5*w+5)*4);
rgba.set([0,0,0,173],(10*w+10)*4);
assert.equal(cleanTeacherTexels(rgba,w,h),2);
assert.deepEqual([...rgba.slice((5*w+5)*4,(5*w+5)*4+4)],[60,70,80,173]);
assert.deepEqual([...rgba.slice((10*w+10)*4,(10*w+10)*4+4)],[60,70,80,173]);
for(let y=0;y<h;y++)for(let x=0;x<w;x++)rgba.set(x<8?[20,25,30,255]:[220,180,150,255],(y*w+x)*4);
const boundary=rgba.slice();assert.equal(cleanTeacherTexels(rgba,w,h),0);assert.deepEqual(rgba,boundary,'Real clothing/skin boundaries stay intact');

const group=new Group(),geometry=new BoxGeometry(),original=new MeshStandardMaterial({metalness:.8,roughness:.1,vertexColors:true});
original.normalMap=new Texture();original.emissive.set('#ffffff');
group.add(new Mesh(geometry,original),new Mesh(geometry,original));
const positions=geometry.attributes.position.array.slice(),normals=geometry.attributes.normal.array.slice();
const result=finishTeacherMaterials(group),material=group.children[0].material;
assert.deepEqual(result,{meshes:2,materials:1});assert.equal(group.children[1].material,material);
assert.notEqual(material,original);assert.equal(original.metalness,.8);assert.equal(original.vertexColors,true);assert(original.normalMap);
assert(material.isMeshPhysicalMaterial);assert.equal(material.specularIntensity,0);assert.equal(material.metalness,0);assert.equal(material.roughness,1);
for(const property of ['normalMap','bumpMap','envMap','specularIntensityMap','clearcoatMap','emissiveMap'])assert.equal(material[property],null,property);
assert.equal(material.clearcoat,0);assert.equal(material.sheen,0);assert.equal(material.transmission,0);assert.equal(material.vertexColors,false);
assert.deepEqual(geometry.attributes.position.array,positions);assert.deepEqual(geometry.attributes.normal.array,normals);
assert(group.children.every(mesh=>mesh.castShadow&&!mesh.receiveShadow));
console.log(JSON.stringify({ok:true,isolatedNoiseRemoved:true,realColorBoundariesPreserved:true,alphaPreserved:true,originalResourcesUnmodified:true,noSpecularReflection:true,noGeometryChanges:true}));
