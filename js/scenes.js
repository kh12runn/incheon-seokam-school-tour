/*
 * 이 파일만 수정하면 장소를 추가하거나 연결할 수 있습니다.
 *
 * 1) images/층이름/ 폴더에 360도 JPG 사진을 넣습니다.
 * 2) 아래 scenes 배열에 장면을 복사해서 추가합니다.
 * 3) connections의 target에 이동할 장면의 id를 적습니다.
 *
 * pitch: 위/아래 위치(-90~90), yaw: 왼쪽/오른쪽 위치(-180~180)
 * 사진을 먼저 띄워 본 뒤 핫스팟 위치를 조금씩 조절하면 됩니다.
 */
window.SCHOOL_TOUR_DATA = {
  schoolName: "인천석암초등학교",
  tourName: "석암초 가상학교",
  settings: {
    renderMode: "stylized-panorama",
    keyboardPan: { enabled: true, degreesPerSecond: 58 }
  },
  firstScene: "entrance",
  floorOrder: ["OUT", "1F", "2F", "3F", "4F"],
  floorLabels: { "OUT": "외부", "1F": "1층", "2F": "2층", "3F": "3층", "4F": "4층" },
  floorHome: { "OUT": null, "1F": "entrance", "2F": "2f_hall", "3F": null, "4F": null },
  scenes: [
    {
      id: "entrance",
      locationId: "main-1f-central-entrance",
      title: "중앙현관",
      floor: "1F",
      breadcrumb: ["1층", "중앙현관"],
      panorama: "images/1F/sample-hall-3d.png",
      description: "가상학교 둘러보기를 시작하는 중앙현관입니다.",
      initialView: { pitch: -2, yaw: 0, hfov: 105 },
      connections: [
        { target: "1f_hall01", text: "1층 복도 1로 이동", pitch: -12, yaw: -78 }
      ],
      infoHotspots: [
        {
          title: "샘플 투어 안내",
          text: "현재 사진은 기능 확인을 위한 AI 생성 샘플입니다. 실제 촬영 사진으로 간단히 교체할 수 있습니다.",
          pitch: 8,
          yaw: 31
        }
      ]
    },
    {
      id: "1f_hall01",
      locationId: "main-1f-hall-west-01",
      title: "1층 복도 1",
      floor: "1F",
      breadcrumb: ["1층", "중앙복도", "복도 1"],
      panorama: "images/1F/sample-hall-3d.png",
      description: "중앙현관과 복도 2를 잇는 공간입니다.",
      initialView: { pitch: -3, yaw: -82, hfov: 100 },
      connections: [
        { target: "entrance", text: "중앙현관으로 돌아가기", pitch: -12, yaw: 96 },
        { target: "1f_hall02", text: "1층 복도 2로 이동", pitch: -11, yaw: -82 }
      ]
    },
    {
      id: "1f_hall02",
      locationId: "main-1f-hall-west-02",
      title: "1층 복도 2",
      floor: "1F",
      breadcrumb: ["1층", "중앙복도", "복도 2"],
      panorama: "images/1F/sample-hall-3d.png",
      description: "교실과 보건실, 계단으로 이어지는 복도입니다.",
      initialView: { pitch: -2, yaw: 72, hfov: 100 },
      connections: [
        { target: "1f_hall01", text: "복도 1로 돌아가기", pitch: -12, yaw: -105 },
        { target: "classroom", text: "교실 들어가기", pitch: -9, yaw: -39 },
        { target: "nurse", text: "보건실 들어가기", pitch: -9, yaw: 38 },
        { target: "stairs", text: "계단으로 이동", pitch: 2, yaw: 2 }
      ]
    },
    {
      id: "classroom",
      locationId: "main-1f-room-3-1",
      title: "교실",
      floor: "1F",
      breadcrumb: ["1층", "중앙복도", "교실"],
      panorama: "images/1F/sample-classroom-3d.png",
      description: "밝고 편안한 샘플 교실입니다.",
      initialView: { pitch: -5, yaw: 3, hfov: 105 },
      connections: [
        { target: "1f_hall02", text: "1층 복도 2로 나가기", pitch: -9, yaw: 132 }
      ],
      infoHotspots: [
        {
          title: "교실 안내",
          text: "학급 이름과 소개 문구를 이곳에 표시할 수 있습니다.",
          pitch: 5,
          yaw: 4
        }
      ]
    },
    {
      id: "nurse",
      locationId: "main-1f-nurse",
      title: "보건실",
      floor: "1F",
      breadcrumb: ["1층", "중앙복도", "보건실"],
      panorama: "images/1F/sample-nurse-3d.png",
      description: "학생들이 휴식하고 건강 상담을 받는 공간입니다.",
      initialView: { pitch: -3, yaw: 0, hfov: 105 },
      connections: [
        { target: "1f_hall02", text: "1층 복도 2로 나가기", pitch: -11, yaw: 162 }
      ],
      infoHotspots: [
        {
          title: "보건실 이용 안내",
          text: "몸이 아프거나 다쳤을 때 선생님께 알리고 이용해 주세요.",
          pitch: 4,
          yaw: -28
        }
      ]
    },
    {
      id: "stairs",
      locationId: "main-stairs-b-1f",
      title: "중앙계단",
      floor: "1F",
      breadcrumb: ["1층", "중앙계단"],
      panorama: "images/1F/sample-hall-3d.png",
      description: "2층으로 올라가는 중앙계단입니다.",
      initialView: { pitch: 4, yaw: 0, hfov: 95 },
      connections: [
        { target: "1f_hall02", text: "1층 복도 2로 이동", pitch: -10, yaw: 174 },
        { target: "2f_hall", text: "2층 복도로 올라가기", pitch: 11, yaw: 0 }
      ]
    },
    {
      id: "2f_hall",
      locationId: "main-2f-hall-central",
      title: "2층 복도",
      floor: "2F",
      breadcrumb: ["2층", "중앙복도"],
      panorama: "images/1F/sample-hall-3d.png",
      description: "2층의 대표 장소로 설정된 샘플 복도입니다.",
      initialView: { pitch: -3, yaw: 84, hfov: 100 },
      connections: [
        { target: "stairs", text: "1층 중앙계단으로 내려가기", pitch: -6, yaw: -4 }
      ]
    }
  ]
};
