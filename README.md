# 석암초 가상학교

별도의 데이터베이스나 로그인 없이 동작하는 정적 360° 가상학교입니다. 화면 표시는 Pannellum을 사용합니다.

마우스와 터치 드래그는 360도 시점 회전에 사용합니다. `W`(앞), `S`(뒤), `A`(왼쪽), `D`(오른쪽)를 누르면 해당 방향의 가까운 촬영점으로 화면이 확대되고 흔들리며 걸어가는 듯 이동하고, 키를 계속 누르면 연결된 촬영점을 연속으로 지나갑니다.

## 실행하기

`index.html`을 직접 열면 브라우저 보안 정책 때문에 사진 로딩이 막힐 수 있습니다. 아래처럼 간단한 로컬 웹 서버로 여는 것이 가장 확실합니다.

Windows에서는 `start-tour.bat`을 더블 클릭하면 브라우저에서 열립니다. 검은 창은 미리보기 서버이므로 투어를 보는 동안 닫지 마세요. 종료할 때 창을 닫으면 됩니다(Node.js가 설치된 환경에서 동작).

직접 실행하려면 `school-tour` 폴더에서 `node preview-server.mjs`를 실행한 뒤 브라우저에서 `http://127.0.0.1:8080`을 여세요.

웹 호스팅에는 `school-tour` 폴더 안의 파일을 그대로 올리면 됩니다. 서버 프로그램이나 데이터베이스는 필요하지 않습니다.

## 새 360도 사진 추가하기

1. Insta360에서 내보낸 **2:1 비율의 equirectangular JPG**를 해당 층 폴더에 넣습니다.
   - 예: `images/1F/hall03.jpg`
2. `js/scenes.js`에서 비슷한 장면 하나를 복사합니다.
3. `id`, `title`, `floor`, `panorama`를 새 사진에 맞게 바꿉니다.
4. `connections`에 연결할 장면 ID와 화살표 위치를 적습니다.
5. 임시 사진이면 `photoStatus: "sample"`, 실제 촬영 사진이면 `photoStatus: "ready"`를 적습니다. 디지털 배치도의 색상이 자동으로 바뀝니다.

```js
{
  id: "1f_hall03",
  title: "1층 복도 3",
  floor: "1F",
  breadcrumb: ["1층", "중앙복도", "복도 3"],
  panorama: "images/1F/hall03.jpg",
  photoStatus: "ready",
  initialView: { pitch: 0, yaw: 90, hfov: 100 },
  connections: [
    { target: "nurse", text: "오른쪽 문으로 보건실 들어가기", pitch: -8, yaw: 90 }
  ]
}
```

- `pitch`: 화살표의 위/아래 위치 (`-90`~`90`)
- `yaw`: 화살표의 좌/우 방향 (`-180`~`180`)
- `hfov`: 첫 화면 확대 정도. 보통 `90`~`110`이 편안합니다.

연결은 양쪽 장면에 각각 적어야 왕복 이동이 됩니다. 예를 들어 `hall03 → nurse`와 `nurse → hall03`을 모두 추가하세요.

## 정보 핫스팟

장면에 아래 항목을 추가하면 `i` 안내 버튼이 나타납니다.

```js
infoHotspots: [
  {
    title: "도서관 이용 안내",
    text: "월요일부터 금요일까지 이용할 수 있습니다.",
    pitch: 5,
    yaw: -35,
    image: "assets/library-guide.jpg", // 선택 사항
    youtube: "https://youtu.be/영상ID", // 선택 사항
    video: "assets/guide.mp4",          // 선택 사항
    link: "https://example.com"         // 선택 사항
  }
]
```

이미지, YouTube, 일반 영상 중 하나만 사용하는 것을 권장합니다.

## 폴더 안내

- `index.html`: 화면 뼈대. 보통 수정할 필요가 없습니다.
- `css/style.css`: 색상과 배치
- `js/app.js`: 뷰어 동작. 보통 수정할 필요가 없습니다.
- `js/scenes.js`: 촬영 장면과 핫스팟 연결 설정. 사진 추가 시 주로 이 파일만 수정합니다.
- `js/school-layout.js`: 본관·오른쪽 건물·외부의 물리적인 공간 관계와 계단 구조
- `docs/SPACE_MODEL.md`: 공간 데이터와 촬영 장면을 연결하는 방법
- `images/1F`~`images/4F`: 층별 360도 사진
- `assets/logo.png`: 현재는 임시 로고입니다. 학교 공식 로고 파일로 교체할 수 있습니다.

1층 장면은 기능 확인용 샘플이고, 4층 장면은 제공된 실제 촬영 자료를 바탕으로 촬영자를 제거하고 가볍게 게임풍으로 다듬은 360도 이미지입니다. 원본은 로컬 촬영 폴더에만 보존합니다.

이 프로젝트는 별도 3D 자유이동 모드 없이 Pannellum 360도 장면을 중심으로 운영합니다. 마우스와 터치 드래그는 시점 확인에 사용하고, WASD와 화면 속 이동 아이콘은 보행 효과와 함께 가까운 촬영 지점으로 이동할 때 사용합니다. 사진 처리 원칙은 `docs/PHOTO_TO_3D.md`를 참고하세요.
