# 학교 공간 데이터 구조

## 공간과 장면은 서로 다릅니다

- `js/school-layout.js`는 실제 학교의 **물리 공간**을 기록합니다.
- `js/scenes.js`는 Insta360으로 촬영한 **360도 사진 한 장면**을 기록합니다.

복도 하나에 사진을 8장 촬영하면 물리적인 복도는 하나지만 scene은 8개가 됩니다. 이 둘을 분리해 두면 촬영 장수가 바뀌어도 학교 배치 데이터는 다시 만들 필요가 없습니다.

## 장면을 물리 공간에 연결하기

`scenes.js` 장면에 `locationId`를 적습니다.

```js
{
  id: "MAIN_3F_HALL_04",
  locationId: "main-3f-room-5-3",
  title: "3층 복도 4",
  floor: "3F",
  panorama: "images/3F/hall04.jpg"
}
```

복도 촬영점의 정확한 위치가 확정되면 `school-layout.js`의 해당 층 route에 `capture-anchor` 장소를 추가합니다. 교실 문 앞 scene은 가까운 교실의 locationId를 사용해도 됩니다.

## 계단 이름 규칙

같은 수직 계단은 모든 층에서 같은 `stairId`를 사용합니다.

- `MAIN_STAIRS_A`: 본관 서쪽 계단
- `MAIN_STAIRS_B`: 본관 중앙 계단
- `EAST_STAIRS_A`: 오른쪽 건물 계단(정확한 계단 수는 현장 확인 예정)

예를 들어 `MAIN_2F_STAIRS_B` 장면의 위쪽 핫스팟은 `MAIN_3F_STAIRS_B`, 아래쪽은 `MAIN_1F_STAIRS_B`로 연결합니다.

## 미니맵 확장

각 장소에는 현재 `mapPosition: null`이 들어 있습니다. SVG 미니맵 제작 시 아래처럼 0~100 좌표를 넣습니다.

```js
mapPosition: { x: 42, y: 58 }
```

현재 장면이 바뀌면 사이트는 `schooltour:scenechange` 이벤트를 발생시킵니다. 향후 미니맵은 이 이벤트의 `event.detail.location.mapPosition`을 읽어 현재 위치 점을 옮길 수 있습니다.

```js
window.addEventListener("schooltour:scenechange", function (event) {
  console.log(event.detail.sceneId);
  console.log(event.detail.location);
});
```

## 아직 확정하지 않은 내용

`school-layout.js`의 `pendingChecks`에 현장 확인이 필요한 항목을 모아 두었습니다. 확인 전에는 임의의 scene이나 핫스팟을 생성하지 않습니다.
