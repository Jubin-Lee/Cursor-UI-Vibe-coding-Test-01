# 교통 상황판 - React + MapLibre GL JS

React와 MapLibre GL JS를 사용하여 구현한 교통 상황판입니다. 지도가 시계방향 90도 회전되어 표시되며, IC 라벨은 자동으로 정방향을 유지합니다.

## 주요 기능

- **회전 지도**: MapLibre GL JS bearing=90으로 시계방향 90도 회전
- **IC 마커 및 라벨**: 본선/지선 구분된 마커와 정방향 유지 라벨
- **직선도**: 구간별 교통상황을 색상 막대로 표시
- **실시간 시계**: 헤더에 현재 시간 표시
- **하단 패널**: 소통정보, 돌발상황, VMS/LCS, 날씨 정보
- **토스트 알림**: 새 이벤트 발생 시 알림 표시
- **반응형 디자인**: 1920×1080 고정 프레임, 모바일 지원

## 기술 스택

- **React 18.2.0**: UI 프레임워크
- **MapLibre GL JS 3.6.1**: 지도 렌더링
- **Carto Voyager GL**: 안정적인 공개 지도 스타일
- **CSS Grid**: 레이아웃 구성

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 확인할 수 있습니다.

### 3. 프로덕션 빌드
```bash
npm run build
```

## 프로젝트 구조

```
src/
├── components/
│   ├── Header.js          # 헤더 컴포넌트 (로고, 제목, 시계, 새로고침)
│   ├── MapContainer.js    # MapLibre GL JS 지도 컨테이너
│   ├── LinearDiagram.js   # 직선도 컴포넌트
│   ├── BottomPanels.js    # 하단 4분할 패널
│   └── Toast.js           # 토스트 알림 컴포넌트
├── App.js                 # 메인 앱 컴포넌트
├── App.css               # 앱 전체 스타일
├── index.js              # React 진입점
└── index.css             # 기본 스타일
```

## 주요 특징

### 지도 회전
- `bearing: 90`으로 시계방향 90도 회전
- `styledata` 이벤트에서 `setBearing(90)` 재고정
- `fitBounds`에서도 `bearing: 90` 유지

### IC 좌표 시스템
- `[lng, lat]` 순서로 좌표 처리
- 본선: 남구리IC → 신북IC (11개 구간)
- 지선: 소흘JCT → 옥정IC → 양주IC

### 스타일링
- 다크 테마 (#0f1419 배경)
- 1920×1080 고정 프레임
- CSS Grid 레이아웃
- 반응형 디자인 지원

## 브라우저 지원

- Chrome (권장)
- Firefox
- Safari
- Edge

## 라이선스

MIT License




