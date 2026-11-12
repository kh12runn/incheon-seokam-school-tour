"""Create race-only seated upper-body derivatives; never edit approved NPCs.

Run with Blender --background --factory-startup --python this_file -- [driver ID].
Faces, hair, clothing colours and texture UVs come from the approved teacher GLBs.
The lower body is hidden by the car and omitted. Arms use the same soft weighting
as the school's procedural teacher rig, baked into a stationary steering pose.
"""
import bpy
import bmesh
import json
import math
import sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '웹학교' / '캐릭터모델'
OUTPUT = SOURCE / '레이싱'
MODELS = [
    ('teacher-6-1', '6-1-담임선생님.glb', 1.79),
    ('teacher-6-2', '6-2-담임선생님.glb', 1.512),
    ('teacher-6-3', '6-3-담임선생님.glb', 1.79),
    ('teacher-6-4', '6-4-담임선생님.glb', 1.78),
    ('teacher-6-5', '6-5-담임선생님.glb', 1.512),
    ('teacher-6-6', '6-6-담임선생님.glb', 1.82),
    ('teacher-6-7', '6-7-담임선생님.glb', 1.76),
    ('teacher-science', '과학선생님.glb', 1.68),
    ('office-cute', '교장선생님-귀여운.glb', 1.83),
]

def smooth(a, b, v):
    t = np.clip((v-a)/(b-a), 0, 1)
    return t*t*(3-2*t)

def rotate_x(vertices, point, angle):
    result = vertices.copy()
    y = vertices[:,1]-point[1]
    z = vertices[:,2]-point[2]
    result[:,1] = y*math.cos(angle)-z*math.sin(angle)+point[1]
    result[:,2] = y*math.sin(angle)+z*math.cos(angle)+point[2]
    return result

def enforce_total_budget():
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
    triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
    if triangles<=52000: return
    # Hair and clothing may be separate meshes. Their combined budget must
    # remain bounded rather than multiplying a per-mesh target by that count.
    for obj in objects:
        modifier=obj.modifiers.new('전체 운전자 삼각형 한도','DECIMATE')
        modifier.ratio=50000/triangles;modifier.use_collapse_triangulate=True
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)

def create(identifier, filename, height):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for data in list(bpy.data.meshes):
        if not data.users: bpy.data.meshes.remove(data)
    for data in list(bpy.data.materials):
        if not data.users: bpy.data.materials.remove(data)
    for data in list(bpy.data.images):
        if not data.users: bpy.data.images.remove(data)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE / filename))
    objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for obj in objects:
        obj.select_set(True)
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    minima=[]
    maxima=[]
    for obj in objects:
        coords=np.empty(len(obj.data.vertices)*3,dtype=np.float32)
        obj.data.vertices.foreach_get('co',coords)
        coords=coords.reshape(-1,3)
        minima.append(coords.min(axis=0));maxima.append(coords.max(axis=0))
    low=np.min(minima,axis=0);high=np.max(maxima,axis=0)
    center=(low+high)*.5;center[2]=low[2]
    scale=height/(high[2]-low[2])
    body_scale=height/1.83
    for obj in objects:
        mesh=obj.data
        coords=np.empty(len(mesh.vertices)*3,dtype=np.float32)
        mesh.vertices.foreach_get('co',coords)
        coords=(coords.reshape(-1,3)-center)*scale
        # Blender glTF import maps glTF +Y up to +Z, +Z facing to -Y.
        x=coords[:,0]/body_scale;y=coords[:,2]/body_scale
        continuous=identifier=='teacher-6-7'
        lower=(smooth(.58,.67,y)*(smooth(.84,.95,y)+(1-smooth(.84,.95,y))*smooth(.235,.255,np.abs(x)))) if continuous else smooth(.70,.83,y)
        arm=smooth(.17,.25,np.abs(x))*(1-smooth(1.41,1.53,y))*lower
        elbow=1-smooth(1.105,1.215,y)
        upper_pose=rotate_x(coords,(0,0,1.43*body_scale),-.94)
        lower_pose=rotate_x(rotate_x(coords,(0,0,1.16*body_scale),-.58),(0,0,1.43*body_scale),-.94)
        posed=coords*(1-arm[:,None])+upper_pose*(arm*(1-elbow))[:,None]+lower_pose*(arm*elbow)[:,None]
        mesh.vertices.foreach_set('co',posed.astype(np.float32).reshape(-1))
        mesh.update()
        bm=bmesh.new();bm.from_mesh(mesh)
        bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.z < .68*body_scale],context='VERTS')
        bm.to_mesh(mesh);bm.free();mesh.update()
        if not mesh.polygons:
            bpy.data.objects.remove(obj,do_unlink=True);continue
        # QEM keeps silhouette/curvature detail (eyes, nose, hair); the original
        # photo/vertex colours still supply the teacher's facial appearance.
        triangles=sum(len(p.vertices)-2 for p in mesh.polygons)
        target=42000 if identifier!='office-cute' else 22000
        ratio=min(1,target/max(triangles,1))
        if ratio<.99:
            modifier=obj.modifiers.new('운전자 전용 경량화','DECIMATE')
            modifier.ratio=ratio;modifier.use_collapse_triangulate=True
            bpy.context.view_layer.objects.active=obj
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.name=identifier+'-운전자'
    enforce_total_budget()
    # Cabin views only need a compact atlas; original NPC textures remain intact.
    for image in bpy.data.images:
        if image.type!='IMAGE' or not image.size[0] or not image.size[1]: continue
        w,h=image.size
        limit=1024
        if max(w,h)>limit:
            factor=limit/max(w,h);image.scale(max(1,round(w*factor)),max(1,round(h*factor)))
        image.file_format='JPEG'
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type=='MESH': obj.select_set(True)
    OUTPUT.mkdir(parents=True,exist_ok=True)
    target=OUTPUT/(identifier+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,
        export_image_format='JPEG',export_jpeg_quality=88,export_normals=True,
        export_tangents=False,export_animations=False,export_cameras=False,
        export_lights=False,export_extras=False)
    triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')
    print('RACE_DRIVER_RESULT '+json.dumps({'id':identifier,'bytes':target.stat().st_size,'triangles':triangles,'height':height}),flush=True)

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if args and args[0]=='--refine':
    for identifier in args[1:]:
        bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
        target=OUTPUT/(identifier+'.glb')
        bpy.ops.import_scene.gltf(filepath=str(target));enforce_total_budget()
        bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',export_image_format='AUTO',export_animations=False)
        print('RACE_DRIVER_REFINED '+identifier+' '+str(target.stat().st_size),flush=True)
else:
    for config in MODELS:
        if not args or config[0] in args: create(*config)
