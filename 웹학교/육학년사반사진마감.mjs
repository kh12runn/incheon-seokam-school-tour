// Photo UV overlays ONLY for 4F_6-4. No collision/layout/shared-material mutations.
// Sources are the two existing privacy-edited derivatives, not raw INSP or a splat.
import * as THREE from './외부도구/three.module.js';
export const PHOTO_URLS=[
  new URL('./사진마감/6-4 교실/참고사진_1.jpg',import.meta.url),
  new URL('./사진마감/6-4 교실/참고사진_2.jpg',import.meta.url)
];
// Pixel coordinates on 1774 x 887 panoramas, TL/TR/BL/BR. Restricted to observed
// surfaces; never project the full panorama (including foreground furniture) onto walls.
export const PHOTO_PATCHES={
  floor:{photo:0,quad:[[300,725],[340,725],[296,766],[339,766]]},
  desk:{photo:0,quad:[[905,702],[1000,690],[922,742],[1028,728]]},
  ceiling:{photo:0,quad:[[752,110],[1040,114],[757,224],[1032,228]]},
  lowerWall:{photo:0,quad:[[346,501],[391,501],[346,535],[391,535]]},
  chalk:{photo:1,quad:[[1641,403],[1737,407],[1641,488],[1737,493]]},
  rearDisplay:{photo:1,quad:[[757,443],[980,440],[757,488],[980,488]]},
  frontDisplay:{photo:0,quad:[[900,433],[934,433],[900,476],[934,476]]}
};
export function photoSurfaces(){
  const out=[];
  const add=(name,patch,origin,u,v)=>out.push({name,patch,spaceId:'4F_6-4',origin,u,v});
  // Tile only clean floor/ceiling samples; source viewpoints are approximate.
  for(let x=0;x<12;x++)for(let y=0;y<6;y++)
    add('마루 '+x+'-'+y,'floor',[30.16+x*.805,-6.84+y*1.11,10.218],[.805,0,0],[0,1.11,0]);
  for(let x=0;x<8;x++)for(let y=0;y<6;y++)
    add('흡음 천장 '+x+'-'+y,'ceiling',[30.16+x*1.208,-.18-y*1.11,13.323],[1.208,0,0],[0,-1.11,0]);
  add('앞 하부벽','lowerWall',[30.148,-6.84,10.34],[0,6.66,0],[0,0,.90]);
  add('뒤 하부벽','lowerWall',[39.852,-.18,10.34],[0,-6.66,0],[0,0,.90]);
  add('창 아래 벽','lowerWall',[39.82,-6.846,10.34],[-9.64,0,0],[0,0,.76]);
  // Split around the existing door; do not fill windows or passages.
  for(const [x,width] of [[30.18,2.64],[34.18,5.64]])
    add('복도 아래 벽 '+x,'lowerWall',[x,-.154,10.34],[width,0,0],[0,0,.87]);
  add('녹색 칠판','chalk',[30.262,-5.68,11.16],[0,4.59,0],[0,0,1.40]);
  add('뒤 게시판 실제 배치','rearDisplay',[39.698,-.77,11.62],[0,-5.50,0],[0,0,1.12]);
  add('앞 게시판 실제 배치','frontDisplay',[30.272,-.895,11.32],[0,.57,0],[0,0,1.08]);
  const rows=[-5.75,-5.03,-3.72,-3.0,-1.69,-.97];
  for(let row=0;row<4;row++)for(let col=0;col<6;col++){
    const x=34.15+row*1.15,y=rows[col];
    add('책상 상판 '+(row*6+col+1),'desk',[x-.282,y-.328,10.991],[.564,0,0],[0,.656,0]);
  }
  add('교탁 상판','desk',[30.76,-5.54,11.052],[.93,0,0],[0,1.83,0]);
  // Only the beige door leaves; ivory leaves and the separate metal latches stay intact.
  for(let row=0;row<3;row++)for(let col=0;col<8;col++)if((row+col)%2===0)
    add('사물함 목재문 '+row+'-'+col,'desk',[39.272,-6.36+col*.705+.675,10.28+row*.35],[0,-.675,0],[0,0,.325]);
  return out;
}

// Bake only mesh UV coordinates, not a new bitmap. Vertex subdivision approximates
// the selected curved panoramic patches without changing the source photographs.
export function photoGeometry(surfaces){
  const positions=[],uvs=[];
  for(const surface of surfaces){
    const quad=PHOTO_PATCHES[surface.patch].quad;
    const vertex=(u,v)=>{
      const p=surface.origin.map((value,i)=>value+surface.u[i]*u+surface.v[i]*v);
      positions.push(p[0],p[2],-p[1]);
      const top=quad[0].map((value,i)=>value*(1-u)+quad[1][i]*u);
      const bottom=quad[2].map((value,i)=>value*(1-u)+quad[3][i]*u);
      uvs.push((bottom[0]*(1-v)+top[0]*v)/1774,1-(bottom[1]*(1-v)+top[1]*v)/887);
    };
    const n=4;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const a=x/n,b=y/n,c=(x+1)/n,d=(y+1)/n;
      vertex(a,b);vertex(c,b);vertex(c,d);vertex(a,b);vertex(c,d);vertex(a,d);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}

export function createClass64PhotoFinish({loadTexture=url=>new THREE.TextureLoader().loadAsync(url)}={}){
  const group=new THREE.Group();group.name='6-4 전용 사진 UV 마감';
  const surfaces=photoSurfaces(),meshes=[];
  const state={status:'idle',loaded:0,failed:0,surfaces:surfaces.length,method:'photo-uv',roomId:'4F_6-4'};
  let pending=null;
  for(let photo=0;photo<PHOTO_URLS.length;photo++){
    const geometry=photoGeometry(surfaces.filter(s=>PHOTO_PATCHES[s.patch].photo===photo));
    const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92,metalness:0});
    const mesh=new THREE.Mesh(geometry,material);mesh.name='6-4 사진 '+(photo+1);mesh.receiveShadow=true;mesh.visible=false;
    group.add(mesh);meshes.push(mesh);
  }
  function load(){
    if(pending)return pending;
    state.status='loading';
    pending=Promise.all(PHOTO_URLS.map(async(url,i)=>{
      try{
        const texture=await loadTexture(url.href);
        texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
        meshes[i].material.map=texture;meshes[i].material.needsUpdate=true;meshes[i].visible=true;state.loaded++;
      }catch{state.failed++;} // Original mesh remains visible; loading failure never blocks gameplay.
    })).then(()=>{state.status=state.failed?(state.loaded?'partial':'error'):'ready';});
    return pending;
  }
  return {group,load,getState:()=>({...state})};
}
