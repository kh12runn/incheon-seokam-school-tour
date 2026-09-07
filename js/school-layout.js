/*
 * 학교 공간 모델
 * --------------------------------------------------------------------------
 * 이 파일은 실제 360도 사진(scene)이 아니라 학교의 물리적인 공간 관계를 기록합니다.
 * 촬영 전 단계이므로 정확한 좌표와 복도 촬영점 개수는 일부러 정하지 않았습니다.
 *
 * scenes.js의 장면에 locationId를 적으면 이 파일의 장소와 연결됩니다.
 * 예: locationId: "main-1f-nurse"
 *
 * orderedPlaces는 설명과 배치도를 바탕으로 한 대략적인 복도 순서입니다.
 * 실제 현장 동선이 확인되면 순서와 구역만 고치고 scene ID는 그대로 유지할 수 있습니다.
 */
(function () {
  "use strict";

  function place(id, name, type, options) {
    return Object.assign({
      id: id,
      name: name,
      type: type,
      representativeSceneId: null,
      mapPosition: null
    }, options || {});
  }

  var floors = {
    "outdoor-ground": {
      id: "outdoor-ground",
      buildingId: "outdoor",
      floor: "G",
      label: "외부",
      routes: [
        {
          id: "outdoor-main-route",
          label: "정문에서 본관으로 가는 길",
          orderedPlaces: [
            place("outdoor-main-gate", "정문", "gate"),
            place("outdoor-playground-entry", "운동장 입구", "outdoor"),
            place("outdoor-playground-center", "운동장 중앙", "outdoor"),
            place("outdoor-main-entrance-front", "본관 중앙입구 앞", "entrance")
          ]
        },
        {
          id: "outdoor-east-route",
          label: "운동장에서 오른쪽 건물로 가는 길",
          orderedPlaces: [
            place("outdoor-playground-center-east", "운동장 중앙", "outdoor", { sameAs: "outdoor-playground-center" }),
            place("outdoor-east-entrance-front", "오른쪽 건물 출입구 앞", "entrance")
          ]
        },
        {
          id: "outdoor-facilities",
          label: "운동장 주변 시설",
          orderAccuracy: "순서 없음",
          orderedPlaces: [
            place("outdoor-platform", "구령대", "facility"),
            place("outdoor-garden", "화단", "facility"),
            place("outdoor-play-area", "놀이시설 및 모래터", "facility")
          ]
        }
      ]
    },

    "main-1f": {
      id: "main-1f",
      buildingId: "main",
      floor: "1F",
      label: "본관 1층",
      representativeLocationId: "main-1f-central-entrance",
      routes: [
        {
          id: "main-1f-west-corridor",
          label: "중앙입구 기준 왼쪽 복도",
          orderAccuracy: "대략적인 순서",
          orderedPlaces: [
            place("main-stairs-a-1f", "서쪽 계단", "stairs", { stairId: "MAIN_STAIRS_A" }),
            place("main-1f-restroom-west", "화장실", "restroom"),
            place("main-1f-multipurpose", "다목적실", "special-room"),
            place("main-1f-room-3-4", "3-4", "classroom"),
            place("main-1f-room-3-3", "3-3", "classroom"),
            place("main-1f-room-3-2", "3-2", "classroom"),
            place("main-1f-room-3-1", "3-1", "classroom"),
            place("main-1f-storage", "창고", "storage"),
            place("main-1f-hall-west-02", "1층 왼쪽 복도 촬영점 2", "capture-anchor"),
            place("main-1f-hall-west-01", "1층 왼쪽 복도 촬영점 1", "capture-anchor")
          ]
        },
        {
          id: "main-1f-center-corridor",
          label: "중앙입구 주변",
          orderAccuracy: "대략적인 순서",
          orderedPlaces: [
            place("main-1f-central-entrance", "본관 중앙입구", "entrance"),
            place("main-stairs-b-1f", "중앙 계단", "stairs", { stairId: "MAIN_STAIRS_B" }),
            place("main-1f-admin", "행정실", "office"),
            place("main-1f-nurse", "보건실", "special-room"),
            place("main-1f-publishing", "발간실", "special-room"),
            place("main-1f-broadcast", "방송실", "special-room"),
            place("main-1f-restroom-center", "화장실", "restroom")
          ]
        },
        {
          id: "main-1f-east-corridor",
          label: "오른쪽 급식실 방향",
          orderAccuracy: "대략적인 순서",
          orderedPlaces: [
            place("main-1f-nutrition-office", "영양교사실", "office"),
            place("main-1f-kitchen", "조리실", "special-room"),
            place("main-1f-cafeteria", "급식실", "special-room")
          ]
        }
      ]
    },

    "main-2f": {
      id: "main-2f",
      buildingId: "main",
      floor: "2F",
      label: "본관 2층",
      representativeLocationId: "main-2f-hall-central",
      routes: [
        {
          id: "main-2f-main-corridor",
          label: "본관 2층 복도",
          orderAccuracy: "왼쪽에서 오른쪽 방향의 대략적인 순서",
          orderedPlaces: [
            place("main-stairs-a-2f", "서쪽 계단", "stairs", { stairId: "MAIN_STAIRS_A" }),
            place("main-2f-restroom-west", "화장실", "restroom"),
            place("main-2f-care", "돌봄교실", "classroom"),
            place("main-2f-principal", "교장실", "office"),
            place("main-2f-broadcast-related", "방송 관련 공간", "special-room"),
            place("main-2f-teachers", "교무실", "office"),
            place("main-2f-registration", "등록 관련 공간", "office"),
            place("main-stairs-b-2f", "중앙 계단", "stairs", { stairId: "MAIN_STAIRS_B" }),
            place("main-2f-restroom-center", "화장실", "restroom"),
            place("main-2f-hall-central", "2층 중앙복도 촬영점", "capture-anchor"),
            place("main-2f-room-3-5", "3-5", "classroom"),
            place("main-2f-room-3-6", "3-6", "classroom"),
            place("main-2f-science-prep", "과학준비실", "special-room"),
            place("main-2f-smart-science", "지능형 과학실", "special-room"),
            place("main-2f-science", "과학실", "special-room")
          ]
        }
      ]
    },

    "main-3f": {
      id: "main-3f",
      buildingId: "main",
      floor: "3F",
      label: "본관 3층",
      representativeLocationId: null,
      routes: [
        {
          id: "main-3f-main-corridor",
          label: "본관 3층 복도",
          orderAccuracy: "왼쪽에서 오른쪽 방향의 대략적인 순서",
          orderedPlaces: [
            place("main-3f-counseling", "상담실", "special-room"),
            place("main-stairs-a-3f", "서쪽 계단", "stairs", { stairId: "MAIN_STAIRS_A" }),
            place("main-3f-restroom-west", "화장실", "restroom"),
            place("main-3f-room-5-7", "5-7", "classroom"),
            place("main-3f-room-5-6", "5-6", "classroom"),
            place("main-3f-room-5-5", "5-5", "classroom"),
            place("main-3f-room-5-4", "5-4", "classroom"),
            place("main-3f-room-5-3", "5-3", "classroom"),
            place("main-stairs-b-3f", "중앙 계단", "stairs", { stairId: "MAIN_STAIRS_B" }),
            place("main-3f-restroom-center", "화장실", "restroom"),
            place("main-3f-room-5-2", "5-2", "classroom"),
            place("main-3f-room-5-1", "5-1", "classroom"),
            place("main-3f-room-4-5", "4-5", "classroom"),
            place("main-3f-library", "커터 도서관", "library", { needsNameConfirmation: true }),
            place("main-3f-room-4-6", "4-6", "classroom")
          ]
        }
      ]
    },

    "main-4f": {
      id: "main-4f",
      buildingId: "main",
      floor: "4F",
      label: "본관 4층",
      representativeLocationId: null,
      routes: [
        {
          id: "main-4f-main-corridor",
          label: "본관 4층 복도",
          orderAccuracy: "왼쪽에서 오른쪽 방향의 대략적인 순서",
          orderedPlaces: [
            place("main-stairs-a-4f", "서쪽 계단", "stairs", { stairId: "MAIN_STAIRS_A" }),
            place("main-4f-restroom-west", "화장실", "restroom"),
            place("main-4f-room-6-7", "6-7", "classroom"),
            place("main-4f-room-6-6", "6-6", "classroom"),
            place("main-4f-room-6-5", "6-5", "classroom"),
            place("main-4f-room-6-4", "6-4", "classroom"),
            place("main-4f-room-6-3", "6-3", "classroom"),
            place("main-stairs-b-4f", "중앙 계단", "stairs", { stairId: "MAIN_STAIRS_B" }),
            place("main-4f-restroom-center", "화장실", "restroom"),
            place("main-4f-room-6-2", "6-2", "classroom"),
            place("main-4f-room-6-1", "6-1", "classroom"),
            place("main-4f-room-4-1", "4-1", "classroom"),
            place("main-4f-room-4-2", "4-2", "classroom"),
            place("main-4f-room-4-3", "4-3", "classroom"),
            place("main-4f-grade4-space", "4학년 관련 공간", "special-room")
          ]
        }
      ]
    },

    "east-1f": {
      id: "east-1f",
      buildingId: "east",
      floor: "1F",
      label: "오른쪽 건물 1층",
      representativeLocationId: null,
      routes: [
        {
          id: "east-1f-corridor",
          label: "오른쪽 건물 1층 복도",
          orderAccuracy: "사용자 설명 순서, 정확한 방향은 현장 확인 필요",
          orderedPlaces: [
            place("east-1f-room-1-3", "1-3", "classroom"),
            place("east-1f-room-1-4", "1-4", "classroom"),
            place("east-1f-room-1-1", "1-1", "classroom"),
            place("east-1f-room-1-2", "1-2", "classroom"),
            place("east-1f-individual-learning", "개별학습실", "special-room"),
            place("east-stairs-a-1f", "계단", "stairs", { stairId: "EAST_STAIRS_A" }),
            place("east-1f-restroom", "화장실", "restroom"),
            place("east-1f-entrance", "오른쪽 건물 출입구", "entrance")
          ]
        }
      ]
    },

    "east-2f": {
      id: "east-2f",
      buildingId: "east",
      floor: "2F",
      label: "오른쪽 건물 2층",
      representativeLocationId: null,
      routes: [
        {
          id: "east-2f-corridor",
          label: "오른쪽 건물 2층 복도",
          orderAccuracy: "사용자 설명 순서, 정확한 방향은 현장 확인 필요",
          orderedPlaces: [
            place("east-2f-individual-learning", "개별학습실", "special-room"),
            place("east-2f-room-1-5", "1-5", "classroom"),
            place("east-2f-room-1-6", "1-6", "classroom"),
            place("east-2f-room-3-7", "3-7", "classroom"),
            place("east-2f-room-2-5", "2-5", "classroom"),
            place("east-stairs-a-2f", "계단", "stairs", { stairId: "EAST_STAIRS_A" }),
            place("east-2f-restroom", "화장실", "restroom")
          ]
        }
      ]
    },

    "east-3f": {
      id: "east-3f",
      buildingId: "east",
      floor: "3F",
      label: "오른쪽 건물 3층",
      representativeLocationId: null,
      routes: [
        {
          id: "east-3f-corridor",
          label: "오른쪽 건물 3층 복도",
          orderAccuracy: "사용자 설명 순서, 정확한 방향은 현장 확인 필요",
          orderedPlaces: [
            place("east-3f-individual-learning", "개별학습실", "special-room"),
            place("east-3f-room-2-6", "2-6", "classroom"),
            place("east-3f-room-4-7", "4-7", "classroom"),
            place("east-3f-room-4-8", "4-8", "classroom"),
            place("east-3f-room-2-4", "2-4", "classroom"),
            place("east-stairs-a-3f", "계단", "stairs", { stairId: "EAST_STAIRS_A" }),
            place("east-3f-restroom", "화장실", "restroom")
          ]
        }
      ]
    },

    "east-4f": {
      id: "east-4f",
      buildingId: "east",
      floor: "4F",
      label: "오른쪽 건물 4층",
      representativeLocationId: null,
      routes: [
        {
          id: "east-4f-corridor",
          label: "오른쪽 건물 4층 복도",
          orderAccuracy: "사용자 설명 순서, 정확한 방향은 현장 확인 필요",
          orderedPlaces: [
            place("east-4f-room-4-4", "4-4", "classroom"),
            place("east-4f-room-2-3", "2-3", "classroom"),
            place("east-4f-room-2-2", "2-2", "classroom"),
            place("east-4f-room-2-1", "2-1", "classroom"),
            place("east-stairs-a-4f", "계단", "stairs", { stairId: "EAST_STAIRS_A" }),
            place("east-4f-restroom", "화장실", "restroom")
          ]
        }
      ]
    }
  };

  var locations = {};
  Object.keys(floors).forEach(function (floorId) {
    floors[floorId].routes.forEach(function (route) {
      route.orderedPlaces.forEach(function (item, order) {
        item.floorMapId = floorId;
        item.routeId = route.id;
        item.order = order;
        locations[item.id] = item;
      });
    });
  });

  window.SCHOOL_LAYOUT_DATA = {
    version: 1,
    status: "촬영 전 공간 관계 초안",
    coordinateSystem: "향후 SVG 미니맵에서 0~100 정규화 좌표 사용",
    buildings: {
      outdoor: { id: "outdoor", name: "운동장 및 외부", orientation: "학교 중앙" },
      main: { id: "main", name: "본관", orientation: "운동장 위쪽, 좌우로 긴 건물" },
      east: { id: "east", name: "오른쪽 건물", orientation: "운동장 오른쪽, 세로 방향 건물" }
    },
    floors: floors,
    locations: locations,
    portals: [
      { from: "outdoor-main-gate", to: "outdoor-playground-entry", kind: "outdoor-route", confirmed: true },
      { from: "outdoor-playground-center", to: "outdoor-main-entrance-front", kind: "outdoor-route", confirmed: true },
      { from: "outdoor-main-entrance-front", to: "main-1f-central-entrance", kind: "entrance", confirmed: true },
      { from: "outdoor-playground-center", to: "outdoor-east-entrance-front", kind: "outdoor-route", confirmed: true },
      { from: "outdoor-east-entrance-front", to: "east-1f-entrance", kind: "entrance", confirmed: true }
    ],
    stairStacks: [
      {
        id: "MAIN_STAIRS_A",
        name: "본관 서쪽 계단",
        levels: ["main-stairs-a-1f", "main-stairs-a-2f", "main-stairs-a-3f", "main-stairs-a-4f"]
      },
      {
        id: "MAIN_STAIRS_B",
        name: "본관 중앙 계단",
        levels: ["main-stairs-b-1f", "main-stairs-b-2f", "main-stairs-b-3f", "main-stairs-b-4f"]
      },
      {
        id: "EAST_STAIRS_A",
        name: "오른쪽 건물 계단",
        levels: ["east-stairs-a-1f", "east-stairs-a-2f", "east-stairs-a-3f", "east-stairs-a-4f"]
      }
    ],
    pendingChecks: [
      "본관과 오른쪽 건물이 내부에서 연결되는 정확한 층과 복도 위치",
      "오른쪽 건물의 실제 계단 개수와 각 계단의 A/B 식별자",
      "각 층 복도에서 교실 문이 놓인 정확한 방향과 순서",
      "3층 '커터 도서관'의 정확한 공식 명칭",
      "배치도에 보이는 추가 출입구와 연결 통로의 실제 이용 가능 여부"
    ],
    sceneNaming: {
      corridor: "{건물}_{층}_HALL_{두 자리 번호}",
      stairs: "{건물}_{층}_STAIRS_{계단 식별자}",
      room: "{건물}_{층}_{공간 이름}",
      examples: ["MAIN_3F_HALL_04", "MAIN_3F_STAIRS_B", "EAST_2F_HALL_03"]
    }
  };
}());
