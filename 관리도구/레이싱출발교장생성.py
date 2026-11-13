"""Standing race-starter derivative of the approved office principal.
Run in a separate Blender --background --factory-startup process.
The office source model is read only; face UVs, materials and full body retained.
"""
import bpy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '웹학교/캐릭터모델/교장선생님-귀여운.glb'
TARGET = ROOT / '웹학교/캐릭터모델/레이싱/교장선생님-출발.glb'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
total = sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
for obj in objects:
    bpy.context.view_layer.objects.active = obj
    if total > 85000:
        modifier = obj.modifiers.new('출발 심판 전용 경량화', 'DECIMATE')
        modifier.ratio = 85000 / total
        modifier.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.name = '교장선생님-출발-' + obj.name
for image in bpy.data.images:
    if image.type != 'IMAGE' or not image.size[0]:
        continue
    w, h = image.size
    if max(w, h) > 2048:
        factor = 2048 / max(w, h)
        image.scale(max(1, round(w*factor)), max(1, round(h*factor)))
bpy.ops.object.select_all(action='DESELECT')
for obj in objects:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(TARGET), export_format='GLB', use_selection=True,
    export_image_format='JPEG', export_jpeg_quality=92, export_normals=True,
    export_tangents=False, export_animations=False, export_cameras=False,
    export_lights=False, export_extras=False)
print('STARTER_RESULT ' + json.dumps({'bytes': TARGET.stat().st_size, 'source': SOURCE.name,
    'triangles': sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)}))
