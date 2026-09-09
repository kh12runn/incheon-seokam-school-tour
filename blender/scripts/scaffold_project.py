"""Create the data files and photo folders for the Seokam virtual school."""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def photo_folder(floor: str, category: str, leaf: str) -> str:
    if floor == "EXTERIOR":
        return f"photos/raw/exterior/{leaf}/"
    if floor == "UNKNOWN":
        return f"photos/raw/TODO_unresolved/{leaf}/"
    return f"photos/raw/{floor}/{category}/{leaf}/"


def make_space(
    identifier: str,
    name: str,
    kind: str,
    floor: str,
    building: str,
    category: str,
    leaf: str,
    *,
    layout_status: str = "observed",
    notes: str = "",
) -> dict:
    prefix = {
        "classroom": "ROOM",
        "special_room": "SPECIAL",
        "corridor": "CORRIDOR",
        "stair": "STAIR",
        "toilet": "TOILET",
        "entrance": "ENTRANCE",
        "exterior": "EXTERIOR",
    }.get(kind, "SPACE")
    return {
        "id": identifier,
        "name": name,
        "type": kind,
        "floor": floor,
        "building": building,
        "blenderObject": f"{prefix}_{identifier}",
        "photoFolder": photo_folder(floor, category, leaf),
        "displayMode": "hybrid",
        "dimensionsStatus": "estimated",
        "layoutStatus": layout_status,
        "notes": notes,
    }


spaces: list[dict] = []

# Classroom floor assignments follow the labels and floor bands in the supplied
# composite layout. They are not measurements or architectural room polygons.
classrooms = {
    "1F": {
        "MAIN": ["3-1", "3-2", "3-3", "3-4"],
        "ANNEX": ["1-1", "1-2", "1-3", "1-4", "1-5", "1-6"],
    },
    "2F": {
        "MAIN": ["3-5", "3-6"],
        "ANNEX": ["2-1", "2-2", "2-3", "2-4", "2-5", "2-6"],
    },
    "3F": {
        "MAIN": ["5-1", "5-2", "5-3", "5-4", "5-5", "5-6", "5-7", "4-5", "4-6"],
        "ANNEX": ["3-7"],
    },
    "4F": {
        "MAIN": ["6-1", "6-2", "6-3", "6-4", "6-5", "6-6", "6-7", "4-1", "4-2", "4-3"],
        "ANNEX": ["4-4", "4-7", "4-8"],
    },
}
for floor, buildings in classrooms.items():
    for building, labels in buildings.items():
        for label in labels:
            spaces.append(make_space(
                f"{floor}_{label}", f"{label} 교실", "classroom", floor, building,
                "classrooms", label,
            ))

specials = [
    ("1F", "MAIN", "STORAGE_1", "창고 1"),
    ("1F", "MAIN", "STORAGE_2", "창고 2"),
    ("1F", "MAIN", "MULTIPURPOSE", "다목적실"),
    ("1F", "MAIN", "NIGHT_DUTY", "숙직실"),
    ("1F", "MAIN", "ADMIN", "행정실"),
    ("1F", "MAIN", "NURSE", "보건실"),
    ("1F", "MAIN", "PRINTING", "발간실"),
    ("1F", "MAIN", "MEAL_CART_STORAGE", "배식차 보관실"),
    ("1F", "EAST_WING", "NUTRITION", "영양교사실"),
    ("1F", "EAST_WING", "COOKING", "조리실"),
    ("1F", "EAST_WING", "CAFETERIA", "급식실"),
    ("1F", "ANNEX", "GRADE1_RESEARCH", "1학년 연수실"),
    ("1F", "ANNEX", "KINDERGARTEN", "까치방"),
    ("1F", "ANNEX", "COMPUTER", "컴퓨터실"),
    ("2F", "MAIN", "AUDIO_VISUAL", "시청각실"),
    ("2F", "MAIN", "KOREAN_CLASS", "한국어학급"),
    ("2F", "MAIN", "CARE_DREAM_HOPE", "돌봄교실(꿈희망)"),
    ("2F", "MAIN", "CARE_DREAM_WISH", "돌봄교실(꿈소망)"),
    ("2F", "MAIN", "CARE_DREAM_LOVE", "돌봄교실(꿈사랑)"),
    ("2F", "MAIN", "PRINCIPAL", "교장실"),
    ("2F", "MAIN", "OPERATIONS_MEETING", "학교운영위원회 회의실"),
    ("2F", "MAIN", "STAFF", "교무실"),
    ("2F", "MAIN", "BROADCAST", "방송실(교원회의실)"),
    ("2F", "EAST_WING", "SCIENCE_PREP", "과학준비실"),
    ("2F", "EAST_WING", "INTELLIGENT_SCIENCE", "지능형과학실"),
    ("2F", "EAST_WING", "SCIENCE", "과학실"),
    ("2F", "ANNEX", "GRADE2_RESEARCH", "2학년 연수실"),
    ("3F", "MAIN", "COUNSELING", "상담실"),
    ("3F", "MAIN", "GRADE5_RESEARCH", "5학년 연수실"),
    ("3F", "EAST_WING", "BOOK_LIBRARY", "책터 도서관"),
    ("4F", "MAIN", "GRADE6_RESEARCH", "6학년 연수실"),
    ("4F", "EAST_WING", "GRADE4_RESEARCH", "4학년 연수실"),
]
for floor, building, code, name in specials:
    spaces.append(make_space(
        f"{floor}_{code}", name, "special_room", floor, building,
        "special_rooms", code.lower(),
    ))

# These names are legible, but their physical floor cannot be established from
# the composite annex diagram without another plan or a location-marked photo.
for code, name in [
    ("INDIVIDUAL_1", "개별학습실1"),
    ("INDIVIDUAL_2", "개별학습실2"),
    ("INDIVIDUAL_3", "개별학습실3"),
    ("INDIVIDUAL_4", "개별학습실4"),
    ("INDIVIDUAL_5", "개별학습실5"),
]:
    spaces.append(make_space(
        f"TODO_{code}", name, "special_room", "UNKNOWN", "ANNEX",
        "special_rooms", code.lower(), layout_status="todo_floor",
        notes="별관 합성 배치도에서 정확한 층 확인 필요",
    ))

for floor in ("1F", "2F", "3F", "4F"):
    for number in ("01", "02"):
        spaces.append(make_space(
            f"{floor}_MAIN_CORRIDOR_{number}", f"{floor} 본관 복도 {number}",
            "corridor", floor, "MAIN", "corridors", f"main_{number}",
            layout_status="estimated_segment",
            notes="복도 분절은 촬영·PhotoPoint 관리를 위한 임시 구분",
        ))
    spaces.append(make_space(
        f"{floor}_ANNEX_CORRIDOR_01", f"{floor} 별관 복도",
        "corridor", floor, "ANNEX", "corridors", "annex_01",
        layout_status="estimated_segment",
    ))
    for stair in ("A", "B", "C"):
        spaces.append(make_space(
            f"{floor}_MAIN_STAIR_{stair}", f"{floor} 본관 계단 {stair}",
            "stair", floor, "MAIN", "stairs", f"main_{stair.lower()}",
            layout_status="observed_assigned_id",
            notes="A/B/C는 서쪽에서 동쪽 순으로 부여한 프로젝트 ID",
        ))
    spaces.append(make_space(
        f"{floor}_ANNEX_STAIR_D", f"{floor} 별관 계단 D", "stair", floor,
        "ANNEX", "stairs", "annex_d", layout_status="observed_assigned_id",
    ))
    for toilet in ("A", "B"):
        spaces.append(make_space(
            f"{floor}_MAIN_TOILET_{toilet}", f"{floor} 본관 화장실 {toilet}",
            "toilet", floor, "MAIN", "toilets", f"main_{toilet.lower()}",
            layout_status="observed_assigned_id",
        ))
    spaces.append(make_space(
        f"{floor}_ANNEX_TOILET_A", f"{floor} 별관 화장실",
        "toilet", floor, "ANNEX", "toilets", "annex_a",
        layout_status="observed_assigned_id",
    ))

for floor in ("2F", "3F", "4F"):
    spaces.append(make_space(
        f"{floor}_CONNECTOR", f"{floor} 연결복도", "corridor", floor,
        "CONNECTOR", "corridors", "connector",
    ))

for identifier, name, kind, leaf in [
    ("EXT_MAIN_GATE", "정문", "exterior", "main_gate"),
    ("EXT_REAR_GATE", "후문", "exterior", "rear_gate"),
    ("EXT_PLAYGROUND", "운동장", "exterior", "playground"),
    ("EXT_PLAY_AREA", "놀이터 및 모래터", "exterior", "play_area"),
    ("EXT_SCHOOL_GARDEN", "학교텃밭", "exterior", "school_garden"),
    ("EXT_MEDITATION_GROVE", "명상숲", "exterior", "meditation_grove"),
    ("EXT_ROSTRUM", "구령대", "exterior", "rostrum"),
    ("EXT_MAIN_ENTRANCE", "본관 출입구", "entrance", "main_entrance"),
    ("EXT_ANNEX_ENTRANCE", "별관 출입구", "entrance", "annex_entrance"),
    ("EXT_GUARD_POST", "배움터지킴이실", "special_room", "guard_post"),
]:
    spaces.append(make_space(
        identifier, name, kind, "EXTERIOR", "EXTERIOR", "exterior", leaf,
    ))

payload = {
    "schemaVersion": 1,
    "school": "인천석암초등학교",
    "source": "references/floorplans/2026학년도 교실배치도.pdf",
    "sourceRole": "공간 관계의 1차 기준; 건축 치수 자료가 아님",
    "prototypeFloor": "3F_MAIN",
    "spaces": spaces,
}

photos = {
    "schemaVersion": 1,
    "photoPoints": [],
    "unassigned": [
        {
            "file": "photos/raw/TODO_unassigned/IMG_20260908_095512_00_001.insp",
            "camera": "Insta360 X6",
            "capturedAt": "2026-09-08T09:55:11",
            "spaceId": None,
            "reason": "촬영 위치가 배치도에 표시되지 않음",
        }
    ],
}

materials = {
    "schemaVersion": 1,
    "status": "reference_only",
    "items": [
        {"id": "WALL_INTERIOR", "name": "실내 벽", "source": "INSP 참고", "confirmed": False},
        {"id": "FLOOR_CORRIDOR", "name": "복도 바닥", "source": "INSP 참고", "confirmed": False},
        {"id": "WINDOW_FRAME", "name": "창호", "source": "INSP 참고", "confirmed": False},
    ],
}

for relative in [space["photoFolder"] for space in spaces]:
    (ROOT / relative).mkdir(parents=True, exist_ok=True)
(ROOT / "photos/raw/TODO_unassigned").mkdir(parents=True, exist_ok=True)
(ROOT / "photos/processed/TODO_unassigned").mkdir(parents=True, exist_ok=True)

for path, data in [
    (ROOT / "data/spaces.json", payload),
    (ROOT / "data/photos.json", photos),
    (ROOT / "data/materials.json", materials),
]:
    if path.exists():
        raise FileExistsError(f"Refusing to overwrite existing data file: {path}")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print(json.dumps({"spaces": len(spaces), "photoFolders": len({s['photoFolder'] for s in spaces})}, ensure_ascii=False))
