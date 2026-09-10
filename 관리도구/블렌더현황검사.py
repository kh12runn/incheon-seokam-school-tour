"""Read-only inspection. Run with Blender --background --disable-autoexec.
Never saves the loaded .blend, exports geometry, or changes scene data.
"""
import bpy
import json
from collections import Counter

scenes = []
for scene in bpy.data.scenes:
    meshes = [obj for obj in scene.objects if obj.type == 'MESH']
    materials = {slot.material for obj in meshes for slot in obj.material_slots if slot.material}
    scenes.append({
        'name': scene.name,
        'objects': len(scene.objects),
        'types': dict(Counter(obj.type for obj in scene.objects)),
        'units': scene.unit_settings.system,
        'unitScale': scene.unit_settings.scale_length,
        'collections': [child.name for child in scene.collection.children],
        'meshesWithUV': sum(bool(obj.data.uv_layers) for obj in meshes),
        'meshesWithMultipleUV': sum(len(obj.data.uv_layers) > 1 for obj in meshes),
        'imageTextureNodes': sum(
            node.type == 'TEX_IMAGE'
            for mat in materials if mat.node_tree
            for node in mat.node_tree.nodes
        ),
        'spaceTaggedObjects': sum(bool(obj.get('spaceId')) for obj in scene.objects),
        'collisionTaggedObjects': sum(bool(obj.get('collision')) for obj in scene.objects),
    })
print('SCHOOL_INSPECTION ' + json.dumps({
    'blenderVersion': bpy.app.version_string,
    'readOnly': True,
    'scenes': scenes,
    'imageCount': len(bpy.data.images),
}, ensure_ascii=False))
