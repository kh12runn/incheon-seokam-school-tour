// Preserve all vertices, textures, shadows and transforms, without recomputing
// authoring-only transforms every frame. Never use on avatars or moving props.
export function freezeStaticTree(root){
  root.updateMatrixWorld(true);let count=0;
  root.traverse(object=>{object.matrixAutoUpdate=false;object.matrixWorldAutoUpdate=false;count++;});
  return count;
}
