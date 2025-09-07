import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import './MapContainer.css';

// IC 좌표 데이터
const MAINLINE = [
  { id: "남구리IC", x: 127.134028, y: 37.578702, chipText: "IC" },
  { id: "중랑IC", x: 127.114804, y: 37.607384, chipText: "IC" },
  { id: "갈매동구릉TG", x: 127.124788, y: 37.632290, chipText: "TG" },
  { id: "남별내IC", x: 127.136868, y: 37.669719, chipText: "IC" },
  { id: "동의정부IC", x: 127.110712, y: 37.717605, chipText: "IC" },
  { id: "민락IC", x: 127.121973, y: 37.747985, chipText: "IC" },
  { id: "소흘IC", x: 127.131603, y: 37.795780, chipText: "IC" },
  { id: "소흘JCT", x: 127.139683, y: 37.813561, chipText: "JCT" },
  { id: "선단IC", x: 127.167382, y: 37.845173, chipText: "IC" },
  { id: "포천IC", x: 127.217538, y: 37.879258, chipText: "IC" },
  { id: "신북IC", x: 127.218493, y: 37.911444, chipText: "IC" },
];

const BRANCH = [
  { id: "소흘JCT", x: 127.139683, y: 37.813561, chipText: "JCT" },
  { id: "옥정IC", x: 127.108479, y: 37.835295, chipText: "IC" },
  { id: "양주IC", x: 127.087211, y: 37.842319, chipText: "IC" },
];

const MapContainer = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const MAPTILER_KEY = 'H6Lx59Ru6ZrCUGzhseII';
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  // 속도 범례 토글 함수
  const toggleLegend = () => {
    setIsLegendCollapsed(!isLegendCollapsed);
  };

  // 영문 라벨 숨기기 함수
  const hideEnglishLabels = () => {
    if (!map.current) return;
    
    // MapTiler streets-v2 스타일의 모든 영문 라벨 레이어들을 숨김
    const englishLabelLayers = [
      // 도시/지역 라벨
      'place-city-lg-n', 'place-city-md-n', 'place-city-sm-n',
      'place-town-n', 'place-village-n', 'place-hamlet-n',
      'place-suburb-n', 'place-neighbourhood-n',
      'place-state-n', 'place-country-n',
      'place-city-lg-s', 'place-city-md-s', 'place-city-sm-s',
      'place-town-s', 'place-village-s', 'place-hamlet-s',
      'place-suburb-s', 'place-neighbourhood-s',
      'place-state-s', 'place-country-s',
      // 추가 영문 라벨들
      'place-label-city', 'place-label-town', 'place-label-village',
      'place-label-hamlet', 'place-label-suburb', 'place-label-neighbourhood',
      'place-label-state', 'place-label-country',
      'place-label-city-lg', 'place-label-city-md', 'place-label-city-sm',
      'place-label-town-lg', 'place-label-town-md', 'place-label-town-sm',
      'place-label-village-lg', 'place-label-village-md', 'place-label-village-sm',
      // 다른 가능한 라벨들
      'text-city', 'text-town', 'text-village', 'text-hamlet',
      'text-suburb', 'text-neighbourhood', 'text-state', 'text-country',
      'label-city', 'label-town', 'label-village', 'label-hamlet',
      'label-suburb', 'label-neighbourhood', 'label-state', 'label-country'
    ];
    
    englishLabelLayers.forEach(layerId => {
      if (map.current.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
    
    // 모든 레이어를 확인하여 영문 텍스트가 포함된 레이어 찾기
    const allLayers = map.current.getStyle().layers;
    allLayers.forEach(layer => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        const textField = layer.layout['text-field'];
        // 영문 텍스트가 포함된 레이어인지 확인
        if (typeof textField === 'string' && 
            (textField.includes('name_en') || 
             textField.includes('name:en') || 
             textField.includes('name_en:') ||
             textField.includes('name:en:'))) {
          map.current.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      }
    });
    
    // 추가: 모든 텍스트 레이어를 확인하여 한글이 아닌 것 숨기기 (더 안전한 방식)
    setTimeout(() => {
      const allLayers2 = map.current.getStyle().layers;
      allLayers2.forEach(layer => {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          const layerId = layer.id;
          // 한글 라벨, IC 라벨, 사고 라벨은 보호하고, 영문 라벨만 숨기기
          if (!layerId.includes('korean') && 
              !layerId.includes('ic') && 
              !layerId.includes('incidents') &&
              (layerId.includes('place') || 
               layerId.includes('text') || 
               layerId.includes('label'))) {
            try {
              // 영문 라벨만 숨기기 (한글 라벨은 보호)
              if (layerId.includes('city') || 
                  layerId.includes('town') || 
                  layerId.includes('village') ||
                  layerId.includes('hamlet') ||
                  layerId.includes('suburb') ||
                  layerId.includes('neighbourhood') ||
                  layerId.includes('state') ||
                  layerId.includes('country')) {
                map.current.setLayoutProperty(layerId, 'visibility', 'none');
              }
            } catch (e) {
              // 레이어가 존재하지 않을 수 있음
            }
          }
        }
      });
    }, 1000);
  };

  useEffect(() => {
    if (map.current) return; // 이미 초기화된 경우 중복 실행 방지

    // MapLibre 초기화: bearing=-90 (반시계방향 90도)
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      // MapTiler 스타일 사용
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: [127.15, 37.76],
      zoom: 10,
      bearing: -90, // ★ 반시계방향 90° (북쪽이 화면 왼쪽)
      pitch: 0,
      attributionControl: true
    });

    // 네비게이션 컨트롤 추가
    map.current.addControl(new maplibregl.NavigationControl({ 
      showCompass: true, 
      showZoom: true 
    }));

    // 스타일 로드 후에도 한 번 더 고정(다른 코드가 덮으면 다시 잡아줌)
    map.current.on('styledata', () => {
      // 스타일이 갈아끼워져도 항상 동쪽이 위가 되도록 보정
      if (map.current.getBearing() !== -90) {
        map.current.setBearing(-90);
      }
    });

    // 지도 로드 완료 후 레이어 추가
    map.current.on('load', () => {
      // 영문 라벨 숨기기
      hideEnglishLabels();
      
      // IC 칩 이미지 생성 및 로드 (원형) - 텍스트별로 생성
      const createChipImage = (text) => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // 원형 배경 그라디언트
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        
        // 외곽선 그라디언트
        const borderGradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        borderGradient.addColorStop(0, '#4a90e2');
        borderGradient.addColorStop(0.5, '#87ceeb');
        borderGradient.addColorStop(1, '#4a90e2');
        
        // 외곽선 원 그리기
        ctx.beginPath();
        ctx.arc(16, 16, 15, 0, 2 * Math.PI);
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 배경 원 채우기
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 하이라이트 효과 (원형)
        const highlightGradient = ctx.createRadialGradient(12, 12, 0, 12, 12, 8);
        highlightGradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        highlightGradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(12, 12, 8, 0, 2 * Math.PI);
        ctx.fillStyle = highlightGradient;
        ctx.fill();
        
        // 텍스트 (매개변수로 받은 텍스트 사용)
        ctx.fillStyle = '#87ceeb';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(135, 206, 235, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(text, 16, 16);
        
        return canvas.toDataURL();
      };
      
      // 각 IC별로 다른 칩 이미지 생성 및 로드
      const chipTexts = ['IC', 'TG', 'JCT'];
      let loadedImages = 0;
      const totalImages = chipTexts.length;
      
      chipTexts.forEach(text => {
        const chipImageData = createChipImage(text);
        map.current.loadImage(chipImageData, (error, image) => {
          if (error) throw error;
          map.current.addImage(`ic-chip-${text}`, image);
          loadedImages++;
          
          // 모든 이미지가 로드되면 레이어 추가
          if (loadedImages === totalImages) {
      addTrafficLayers();
      addKoreanLabels();
            addLineInteractions();
            renderRows();
            
            // 이벤트 리스너 등록
            window.addEventListener('resize', renderRows);
            const linearElement = document.getElementById('linear');
            if (linearElement) {
              linearElement.addEventListener('scroll', () => {
                positionChips();
                positionICLabels();
              }, { passive: true });
            }
          }
        });
      });
    });

    // 컴포넌트 언마운트 시 지도 정리
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const addTrafficLayers = () => {
    // 상행/하행 segments 데이터 생성 (실제 데이터가 있다면 사용, 없으면 임시 데이터)
    const mockSegments = [
      { id: "S1", name: "남구리IC-중랑IC", speed: 72, travelTime: 7.2, path: [[127.134028,37.578702],[127.114804,37.607384]] },
      { id: "S2", name: "중랑IC-갈매동구릉TG", speed: 35, travelTime: 9.1, path: [[127.114804,37.607384],[127.124788,37.632290]] },
      { id: "S3", name: "갈매동구릉TG-남별내IC", speed: 28, travelTime: 11.4, path: [[127.124788,37.632290],[127.136868,37.669719]] },
      { id: "S4", name: "남별내IC-동의정부IC", speed: 58, travelTime: 8.8, path: [[127.136868,37.669719],[127.110712,37.717605]] },
      { id: "S5", name: "동의정부IC-민락IC", speed: 62, travelTime: 7.5, path: [[127.110712,37.717605],[127.121973,37.747985]] },
      { id: "S6", name: "민락IC-소흘IC", speed: 44, travelTime: 9.9, path: [[127.121973,37.747985],[127.131603,37.795780]] },
      { id: "S7", name: "소흘IC-소흘JCT", speed: 22, travelTime: 12.8, path: [[127.131603,37.795780],[127.139683,37.813561]] },
      { id: "S8", name: "소흘JCT-선단IC", speed: 66, travelTime: 6.9, path: [[127.139683,37.813561],[127.167382,37.845173]] },
      { id: "S9", name: "선단IC-포천IC", speed: 52, travelTime: 8.3, path: [[127.167382,37.845173],[127.217538,37.879258]] },
      { id: "S10", name: "포천IC-신북IC", speed: 37, travelTime: 10.7, path: [[127.217538,37.879258],[127.218493,37.911444]] }
    ];

    // 상행/하행 segments 생성 (실제 속도 데이터 적용)
    const createUpDownSegments = (segments) => {
      // 포천방향(상행) 속도 데이터
      const upSpeeds = [70, 83, 89, 90, 75, 38, 78, 88, 95, 97];
      // 구리방향(하행) 속도 데이터  
      const downSpeeds = [50, 80, 70, 90, 85, 80, 38, 88, 95, 97];
      
      const upFeatures = segments.map((s, index) => ({
        type: 'Feature',
        properties: { 
          id: s.id, 
          name: s.name, 
          speed: upSpeeds[index] || s.speed,
          direction: 'up',
          travelTime: s.travelTime
        },
        geometry: { type: 'LineString', coordinates: s.path }
      }));
      
      const downFeatures = segments.map((s, index) => ({
        type: 'Feature',
        properties: { 
          id: s.id, 
          name: s.name, 
          speed: downSpeeds[index] || s.speed,
          direction: 'down',
          travelTime: s.travelTime
        },
        geometry: { type: 'LineString', coordinates: s.path }
      }));
      
      return { upFeatures, downFeatures };
    };

    const { upFeatures, downFeatures } = createUpDownSegments(mockSegments);

    // IC 포인트 데이터
    const icPointFeatures = [
      ...MAINLINE.map(p => ({ 
        type: 'Feature', 
        properties: { id: p.id, name: p.id, kind: 'main', chipText: p.chipText }, 
        geometry: { type: 'Point', coordinates: [p.x, p.y] } 
      })),
      ...BRANCH.filter(p => p.id !== '소흘JCT') // JCT는 중복 방지
        .map(p => ({ 
          type: 'Feature', 
          properties: { id: p.id, name: p.id, kind: 'branch', chipText: p.chipText }, 
          geometry: { type: 'Point', coordinates: [p.x, p.y] } 
        }))
    ];

    // 지선 데이터
    const branchCoords = BRANCH.map(p => [p.x, p.y]);
    const branchGeoJSON = {
        type: 'FeatureCollection',
        features: [{ 
          type: 'Feature', 
          properties: { route: 'branch' }, 
          geometry: { type: 'LineString', coordinates: branchCoords } 
        }]
    };

    // 1) 보기 범위 맞추기
    const bounds = new maplibregl.LngLatBounds();
    [...mockSegments.flatMap(s => s.path), ...branchCoords].forEach(c => bounds.extend(c));
    map.current.fitBounds(bounds, { padding: 80, bearing: -90, duration: 0 });

    // 2) 상행 라인
    map.current.addSource('segments-up', { type: 'geojson', data: { type: 'FeatureCollection', features: upFeatures } });
    map.current.addLayer({
      id: 'segments-line-up',
      type: 'line',
      source: 'segments-up',
      paint: {
        'line-color': [
          'case',
          ['<', ['get', 'speed'], 40], '#e53935',  // 0-40km/h: red
          ['<', ['get', 'speed'], 80], '#ff9800',  // 40-80km/h: amber
          '#00ff00'  // 80+km/h: neon green
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 3,    // 줌 레벨 8에서 3px
          10, 5,   // 줌 레벨 10에서 5px
          12, 8,   // 줌 레벨 12에서 8px
          14, 12,  // 줌 레벨 14에서 12px
          16, 16   // 줌 레벨 16에서 16px
        ],
        'line-translate': [12, 0]  // 상행: 위쪽으로 12px 이동 (도로 수직 방향)
      }
    });

    // 3) 하행 라인
    map.current.addSource('segments-down', { type: 'geojson', data: { type: 'FeatureCollection', features: downFeatures } });
    map.current.addLayer({
      id: 'segments-line-down',
      type: 'line',
      source: 'segments-down',
      paint: {
        'line-color': [
          'case',
          ['<', ['get', 'speed'], 40], '#e53935',  // 0-40km/h: red
          ['<', ['get', 'speed'], 80], '#ff9800',  // 40-80km/h: amber
          '#00ff00'  // 80+km/h: neon green
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 3,    // 줌 레벨 8에서 3px
          10, 5,   // 줌 레벨 10에서 5px
          12, 8,   // 줌 레벨 12에서 8px
          14, 12,  // 줌 레벨 14에서 12px
          16, 16   // 줌 레벨 16에서 16px
        ],
        'line-translate': [-12, 0]  // 하행: 아래쪽으로 12px 이동 (도로 수직 방향)
      }
    });

    // 4) 지선 상행/하행 라인
    const branchSegments = [
      { id: "B1", name: "소흘JCT-옥정IC", path: [[127.139683,37.813561],[127.108479,37.835295]] },
      { id: "B2", name: "옥정IC-양주IC", path: [[127.108479,37.835295],[127.087211,37.842319]] }
    ];
    
    const createBranchUpDown = (segments) => {
      // 양주방향(상행) 속도 데이터
      const branchUpSpeeds = [80, 75];
      // 양주방향(하행) 속도 데이터
      const branchDownSpeeds = [60, 85];
      
      const branchUpFeatures = segments.map((s, index) => ({
        type: 'Feature',
        properties: { 
          id: s.id, 
          name: s.name, 
          speed: branchUpSpeeds[index],
          direction: 'up',
          route: 'branch'
        },
        geometry: { type: 'LineString', coordinates: s.path }
      }));
      
      const branchDownFeatures = segments.map((s, index) => ({
        type: 'Feature',
        properties: { 
          id: s.id, 
          name: s.name, 
          speed: branchDownSpeeds[index],
          direction: 'down',
          route: 'branch'
        },
        geometry: { type: 'LineString', coordinates: s.path }
      }));
      
      return { branchUpFeatures, branchDownFeatures };
    };
    
    const { branchUpFeatures, branchDownFeatures } = createBranchUpDown(branchSegments);
    
    // 지선 상행 라인
    map.current.addSource('branch-line-up', { type: 'geojson', data: { type: 'FeatureCollection', features: branchUpFeatures } });
    map.current.addLayer({
      id: 'branch-line-up',
      type: 'line',
      source: 'branch-line-up',
      paint: {
        'line-color': [
          'case',
          ['<', ['get', 'speed'], 40], '#e53935',  // 0-40km/h: red
          ['<', ['get', 'speed'], 80], '#ff9800',  // 40-80km/h: amber
          '#00ff00'  // 80+km/h: neon green
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 2,    // 줌 레벨 8에서 2px
          10, 4,   // 줌 레벨 10에서 4px
          12, 6,   // 줌 레벨 12에서 6px
          14, 10,  // 줌 레벨 14에서 10px
          16, 14   // 줌 레벨 16에서 14px
        ],
        'line-translate': [12, 0]  // 지선 상행: 위쪽으로 12px 이동
      }
    });
    
    // 지선 하행 라인
    map.current.addSource('branch-line-down', { type: 'geojson', data: { type: 'FeatureCollection', features: branchDownFeatures } });
    map.current.addLayer({
      id: 'branch-line-down',
      type: 'line',
      source: 'branch-line-down',
      paint: {
        'line-color': [
          'case',
          ['<', ['get', 'speed'], 40], '#e53935',  // 0-40km/h: red
          ['<', ['get', 'speed'], 80], '#ff9800',  // 40-80km/h: amber
          '#00ff00'  // 80+km/h: neon green
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 2,    // 줌 레벨 8에서 2px
          10, 4,   // 줌 레벨 10에서 4px
          12, 6,   // 줌 레벨 12에서 6px
          14, 10,  // 줌 레벨 14에서 10px
          16, 14   // 줌 레벨 16에서 14px
        ],
        'line-translate': [-12, 0]  // 지선 하행: 아래쪽으로 12px 이동
      }
    });

    // 5) IC 포인트 (칩 이미지 표시)
    map.current.addSource('ic-points', { type: 'geojson', data: { type: 'FeatureCollection', features: icPointFeatures } });
    
    // IC 칩 이미지 마커 (텍스트별로 다른 이미지 사용)
    map.current.addLayer({
      id: 'ic-chips',
      type: 'symbol',
      source: 'ic-points',
      layout: {
        'icon-image': ['concat', 'ic-chip-', ['get', 'chipText']],
        'icon-size': 1,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true
      }
    });

    // 5) IC 라벨 (칩 아래에 표시)
    map.current.addLayer({
      id: 'ic-labels',
      type: 'symbol',
      source: 'ic-points',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 10,
        'text-offset': [0, 2.5],
        'text-anchor': 'top',
        'text-allow-overlap': true,
        'text-pitch-alignment': 'viewport',  // 뷰포트 기준으로 텍스트 정렬
        'text-rotation-alignment': 'viewport'  // 뷰포트 기준으로 텍스트 회전 (지도 회전과 무관하게 정위치 유지)
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#0b1220',
        'text-halo-width': 1
      }
    });
  };

  const addLineInteractions = () => {
    // 상행/하행 라인 클릭 이벤트 및 툴팁
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false
    });
    
    // 상행 라인 클릭 이벤트
    map.current.on('click', 'segments-line-up', (e) => {
      const feature = e.features[0];
      const props = feature.properties;
      
      popup.setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${props.name} (상행)</h3>
            <p style="margin: 4px 0;"><strong>속도:</strong> ${props.speed} km/h</p>
            <p style="margin: 4px 0;"><strong>소요시간:</strong> ${props.travelTime}분</p>
            <p style="margin: 4px 0;"><strong>방향:</strong> 상행</p>
          </div>
        `)
        .addTo(map.current);
    });
    
    // 하행 라인 클릭 이벤트
    map.current.on('click', 'segments-line-down', (e) => {
      const feature = e.features[0];
      const props = feature.properties;
      
      popup.setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${props.name} (하행)</h3>
            <p style="margin: 4px 0;"><strong>속도:</strong> ${props.speed} km/h</p>
            <p style="margin: 4px 0;"><strong>소요시간:</strong> ${props.travelTime}분</p>
            <p style="margin: 4px 0;"><strong>방향:</strong> 하행</p>
          </div>
        `)
        .addTo(map.current);
    });
    
    // 마우스 오버 시 커서 변경
    map.current.on('mouseenter', 'segments-line-up', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'segments-line-up', () => {
      map.current.getCanvas().style.cursor = '';
    });
    
    map.current.on('mouseenter', 'segments-line-down', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'segments-line-down', () => {
      map.current.getCanvas().style.cursor = '';
    });
    
    // 지선 상행 라인 클릭 이벤트
    map.current.on('click', 'branch-line-up', (e) => {
      const feature = e.features[0];
      const props = feature.properties;
      
      popup.setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${props.name} (지선 상행)</h3>
            <p style="margin: 4px 0;"><strong>속도:</strong> ${props.speed} km/h</p>
            <p style="margin: 4px 0;"><strong>방향:</strong> 양주방향 (상행)</p>
            <p style="margin: 4px 0;"><strong>노선:</strong> 지선</p>
          </div>
        `)
        .addTo(map.current);
    });
    
    // 지선 하행 라인 클릭 이벤트
    map.current.on('click', 'branch-line-down', (e) => {
      const feature = e.features[0];
      const props = feature.properties;
      
      popup.setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${props.name} (지선 하행)</h3>
            <p style="margin: 4px 0;"><strong>속도:</strong> ${props.speed} km/h</p>
            <p style="margin: 4px 0;"><strong>방향:</strong> 양주방향 (하행)</p>
            <p style="margin: 4px 0;"><strong>노선:</strong> 지선</p>
          </div>
        `)
        .addTo(map.current);
    });
    
    // 지선 라인 마우스 오버 이벤트
    map.current.on('mouseenter', 'branch-line-up', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'branch-line-up', () => {
      map.current.getCanvas().style.cursor = '';
    });
    
    map.current.on('mouseenter', 'branch-line-down', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'branch-line-down', () => {
      map.current.getCanvas().style.cursor = '';
    });
  };

  // === 거리(km)
  const haversine = (lng1, lat1, lng2, lat2) => {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  // 구간 리스트 만들기
  const makeSegments = (nodes) => {
    const segs = [];
    for(let i = 0; i < nodes.length - 1; i++){
      const A = nodes[i], B = nodes[i + 1];
      segs.push({ 
        id: `${A.id}-${B.id}`, 
        a: A, 
        b: B, 
        dist: haversine(A.x, A.y, B.x, B.y) 
      });
    }
    return segs;
  };

  const routeMainDown = document.querySelector('.downbound .route-main');
  const routeBranchDown = document.querySelector('.downbound .route-branch');
  const routeMainUp = document.querySelector('.upbound .route-main');
  const routeBranchUp = document.querySelector('.upbound .route-branch');
  const lane = document.querySelector('.chip-lane');
  const chipP = document.getElementById('chip-pocheon');
  const chipS = document.getElementById('chip-soheul');

  const renderRows = () => {
    try {
      const mainSegs = makeSegments(MAINLINE);
      const branchSegs = makeSegments(BRANCH);

      // 폭 비례 - 가로폭에 맞게 조정 (지선 더 우측 이동)
      const containerWidth = document.getElementById('linear').offsetWidth - 184; // 패딩 제외
      const branchOffset = 180; // 지선 좌측 마진 (더 증가)
      const marginSpace = 20; // 마진 공간 (지선-양주칩)
      const availableWidth = containerWidth - branchOffset - marginSpace;
      const mainWidth = availableWidth * 0.88; // 본선 88% (더 넓게)
      const branchWidth = availableWidth * 0.12; // 지선 12% (더 넓게)
      
      const mainSegWidth = mainWidth / mainSegs.length;
      const branchSegWidth = branchWidth / branchSegs.length;
      
      const MIN = 30, MAX = 200;
      const mainWidthBy = d => Math.round(Math.max(MIN, Math.min(MAX, mainSegWidth)));
      const branchWidthBy = d => Math.round(Math.max(MIN, Math.min(MAX, branchSegWidth)));

      // 하행 본선/지선 DOM 구성
      routeMainDown.innerHTML = ''; 
      routeBranchDown.innerHTML = '';
      
      // 상행 본선/지선 DOM 구성
      routeMainUp.innerHTML = ''; 
      routeBranchUp.innerHTML = '';
      
      // 지도와 동일한 속도 데이터 (구리방향 - 하행)
      const downSpeeds = [50, 80, 70, 90, 85, 80, 38, 88, 95, 97];
      const branchDownSpeeds = [60, 85];
      
      // 지도와 동일한 속도 데이터 (포천방향 - 상행)
      const upSpeeds = [70, 83, 89, 90, 75, 38, 78, 88, 95, 97];
      const branchUpSpeeds = [80, 75];
      
      // 하행 본선 렌더링
      mainSegs.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'seg';
        el.style.width = mainWidthBy(s.dist) + 'px';
        
        // 하행 속도별 색상 적용
        let color = '#48b86a'; // 기본 (80+): green
        if (downSpeeds[i] < 40) color = '#e53935';  // 0-40km/h: red
        else if (downSpeeds[i] < 80) color = '#ff9800';  // 40-80km/h: amber
        
        el.style.background = color;
        el.dataset.seg = s.id;
        routeMainDown.appendChild(el);
      });
      
      // 하행 지선 렌더링
      branchSegs.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'seg';
        el.style.width = branchWidthBy(s.dist) + 'px';
        
        // 하행 지선 속도별 색상 적용
        let color = '#f0a34a'; // 기본 (80+): orange
        if (branchDownSpeeds[i] < 40) color = '#e53935';  // 0-40km/h: red
        else if (branchDownSpeeds[i] < 80) color = '#ff9800';  // 40-80km/h: amber
        
        el.style.background = color;
        el.dataset.seg = s.id;
        routeBranchDown.appendChild(el);
      });
      
      // 상행 본선 렌더링
      mainSegs.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'seg';
        el.style.width = mainWidthBy(s.dist) + 'px';
        
        // 상행 속도별 색상 적용
        let color = '#48b86a'; // 기본 (80+): green
        if (upSpeeds[i] < 40) color = '#e53935';  // 0-40km/h: red
        else if (upSpeeds[i] < 80) color = '#ff9800';  // 40-80km/h: amber
        
        el.style.background = color;
        el.dataset.seg = s.id;
        routeMainUp.appendChild(el);
      });
      
      // 상행 지선 렌더링
      branchSegs.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'seg';
        el.style.width = branchWidthBy(s.dist) + 'px';
        
        // 상행 지선 속도별 색상 적용
        let color = '#f0a34a'; // 기본 (80+): orange
        if (branchUpSpeeds[i] < 40) color = '#e53935';  // 0-40km/h: red
        else if (branchUpSpeeds[i] < 80) color = '#ff9800';  // 40-80km/h: amber
        
        el.style.background = color;
        el.dataset.seg = s.id;
        routeBranchUp.appendChild(el);
      });

      // 칩 위치 재계산
      requestAnimationFrame(() => {
        positionChips();
        positionICLabels();
      });
    } catch (error) {
      console.error('renderRows 오류:', error);
    }
  };
  
  const findSegEl = (row, idPart) => {
    return [...row.querySelectorAll('.seg')].find(el => (el.dataset.seg || '').includes(idPart)) || null;
  };

  // IC 명칭을 블록 경계에 맞춰 배치
  const positionICLabels = () => {
    try {
      const icLabels = document.querySelectorAll('.ic-label');
      const baseLeft = document.getElementById('linear').getBoundingClientRect().left;
      
      // 본선 블록들 가져오기
      const mainSegs = routeMainDown.querySelectorAll('.seg');
      const branchSegs = routeBranchDown.querySelectorAll('.seg');
      
      // IC 명칭과 블록 매핑
      const icNames = [
        '남구리IC', '중랑IC', '갈매동구릉TG', '남별내IC', '동의정부IC', 
        '민락IC', '소흘IC', '소흘JCT', '선단IC', '포천IC', '신북IC',
        '소흘JCT', '옥정IC', '양주IC'
      ];
      
      // 하드코딩으로 정확한 IC 위치 지정
      icLabels.forEach((label, index) => {
        if (index < icNames.length) {
          const icName = icNames[index];
          let x = 0;
          
          // 본선 IC들 (index 0-10)
          if (index === 0) {
            // 남구리IC - 첫 번째 블록 시작
            const firstSeg = mainSegs[0];
            const rect = firstSeg.getBoundingClientRect();
            x = (rect.left - baseLeft);
          } else if (index === 1) {
            // 중랑IC - 첫 번째와 두 번째 블록 경계
            const firstSeg = mainSegs[0];
            const secondSeg = mainSegs[1];
            const firstRect = firstSeg.getBoundingClientRect();
            const secondRect = secondSeg.getBoundingClientRect();
            x = (firstRect.right - baseLeft) + (secondRect.left - firstRect.right) / 2;
          } else if (index === 2) {
            // 갈매동구릉TG - 두 번째와 세 번째 블록 경계
            const secondSeg = mainSegs[1];
            const thirdSeg = mainSegs[2];
            const secondRect = secondSeg.getBoundingClientRect();
            const thirdRect = thirdSeg.getBoundingClientRect();
            x = (secondRect.right - baseLeft) + (thirdRect.left - secondRect.right) / 2;
          } else if (index === 3) {
            // 남별내IC - 세 번째와 네 번째 블록 경계
            const thirdSeg = mainSegs[2];
            const fourthSeg = mainSegs[3];
            const thirdRect = thirdSeg.getBoundingClientRect();
            const fourthRect = fourthSeg.getBoundingClientRect();
            x = (thirdRect.right - baseLeft) + (fourthRect.left - thirdRect.right) / 2;
          } else if (index === 4) {
            // 동의정부IC - 네 번째와 다섯 번째 블록 경계
            const fourthSeg = mainSegs[3];
            const fifthSeg = mainSegs[4];
            const fourthRect = fourthSeg.getBoundingClientRect();
            const fifthRect = fifthSeg.getBoundingClientRect();
            x = (fourthRect.right - baseLeft) + (fifthRect.left - fourthRect.right) / 2;
          } else if (index === 5) {
            // 민락IC - 다섯 번째와 여섯 번째 블록 경계
            const fifthSeg = mainSegs[4];
            const sixthSeg = mainSegs[5];
            const fifthRect = fifthSeg.getBoundingClientRect();
            const sixthRect = sixthSeg.getBoundingClientRect();
            x = (fifthRect.right - baseLeft) + (sixthRect.left - fifthRect.right) / 2;
          } else if (index === 6) {
            // 소흘IC - 여섯 번째와 일곱 번째 블록 경계
            const sixthSeg = mainSegs[5];
            const seventhSeg = mainSegs[6];
            const sixthRect = sixthSeg.getBoundingClientRect();
            const seventhRect = seventhSeg.getBoundingClientRect();
            x = (sixthRect.right - baseLeft) + (seventhRect.left - sixthRect.right) / 2;
          } else if (index === 7) {
            // 소흘JCT - 일곱 번째 블록의 오른쪽 경계면 (한 칸 왼쪽으로 이동)
            const seventhSeg = mainSegs[6];
            const rect = seventhSeg.getBoundingClientRect();
            x = (rect.right - baseLeft);
          } else if (index === 8) {
            // 선단IC - 여덟 번째 블록의 오른쪽 경계면 (한 칸 왼쪽으로 이동)
            const eighthSeg = mainSegs[7];
            const rect = eighthSeg.getBoundingClientRect();
            x = (rect.right - baseLeft);
          } else if (index === 9) {
            // 포천IC - 아홉 번째 블록의 오른쪽 경계면 (한 칸 왼쪽으로 이동)
            const ninthSeg = mainSegs[8];
            const rect = ninthSeg.getBoundingClientRect();
            x = (rect.right - baseLeft);
          } else if (index === 10) {
            // 신북IC - 열 번째 블록의 오른쪽 경계면 (한 칸 왼쪽으로 이동)
            const tenthSeg = mainSegs[9];
            const rect = tenthSeg.getBoundingClientRect();
            x = (rect.right - baseLeft);
          }
          // 지선 IC들 (index 11-13)
          else if (index === 11) {
            // 소흘JCT - 지선 첫 번째 블록의 왼쪽 경계면 (중복 표기)
            const firstBranchSeg = branchSegs[0];
            const rect = firstBranchSeg.getBoundingClientRect();
            x = (rect.left - baseLeft);
          } else if (index === 12) {
            // 옥정IC - 첫 번째와 두 번째 지선 블록의 경계면
            const firstBranchSeg = branchSegs[0];
            const secondBranchSeg = branchSegs[1];
            const firstRect = firstBranchSeg.getBoundingClientRect();
            const secondRect = secondBranchSeg.getBoundingClientRect();
            x = (firstRect.right - baseLeft) + (secondRect.left - firstRect.right) / 2;
          } else if (index === 13) {
            // 양주IC - 두 번째 지선 블록의 오른쪽 edge
            const secondBranchSeg = branchSegs[1];
            const rect = secondBranchSeg.getBoundingClientRect();
            x = (rect.right - baseLeft);
          }
          
          label.style.position = 'absolute';
          label.style.left = x + 'px';
          label.style.transform = 'translateX(-50%)';
        }
      });
    } catch (error) {
      console.error('positionICLabels 오류:', error);
    }
  };

  // 칩 배치: 포천='포천IC-신북IC' 오른쪽 옆, 소흘='소흘JCT-옥정IC' 왼쪽 옆
  const positionChips = () => {
    try {
      // 기준은 linear 섹션의 좌측
      const baseLeft = document.getElementById('linear').getBoundingClientRect().left;

      // 포천 칩: 하행 본선의 '포천IC-신북IC' 블록 오른쪽 옆
      const segP = findSegEl(routeMainDown, '포천IC-신북IC');
      if (segP) {
        const rP = segP.getBoundingClientRect();
        const gap = 8;
        const xP = (rP.right - baseLeft) + gap;
        chipP.style.left = xP + 'px';
        chipP.style.top = '50%';
      }

      // 소흘 칩: 하행 지선의 '소흘JCT-옥정IC' 블록 왼쪽 옆
      const segS = findSegEl(routeBranchDown, '소흘JCT-옥정IC');
      if (segS) {
        const rS = segS.getBoundingClientRect();
        const gap = 8;
        const wS = chipS.offsetWidth;
        const xS = (rS.left - baseLeft) - wS - gap;
        chipS.style.left = xS + 'px';
        chipS.style.top = '50%';
      }

      // 겹침 방지: 포천(왼) → 소흘(오) 순서 유지
      if (segP && segS) {
        const rP = segP.getBoundingClientRect();
        const rS = segS.getBoundingClientRect();
        const gap = 8;
        const wP = chipP.offsetWidth, wS = chipS.offsetWidth;

        let xP = (rP.right - baseLeft) + gap;
        let xS = (rS.left - baseLeft) - wS - gap;

        const need = wP + gap + wS;
        if (xP + need > xS) {
          const limitLeft = (rS.left - baseLeft) - need;
          const minLeft = (rP.right - baseLeft) + gap;
          xP = Math.max(minLeft, limitLeft);
          xS = xP + wP + gap;
        }

        chipP.style.left = xP + 'px';
        chipS.style.left = xS + 'px';
      }
    } catch (error) {
      console.error('positionChips 오류:', error);
    }
  };

  const addKoreanLabels = () => {
    // 주요 도시/지역 한글 라벨 데이터
    const koreanLabels = [
      { name: '서울', coordinates: [126.978, 37.5665], type: 'city' },
      { name: '구리시', coordinates: [127.131, 37.5945], type: 'city' },
      { name: '남양주시', coordinates: [127.216, 37.6365], type: 'city' },
      { name: '포천시', coordinates: [127.201, 37.8947], type: 'city' },
      { name: '양주시', coordinates: [126.999, 37.7840], type: 'city' },
      { name: '의정부시', coordinates: [127.047, 37.7381], type: 'city' },
      { name: '중랑구', coordinates: [127.095, 37.6064], type: 'district' },
      { name: '강동구', coordinates: [127.123, 37.5301], type: 'district' },
      { name: '송파구', coordinates: [127.105, 37.5145], type: 'district' },
      { name: '광진구', coordinates: [127.082, 37.5384], type: 'district' },
      { name: '노원구', coordinates: [127.057, 37.6542], type: 'district' },
      { name: '도봉구', coordinates: [127.047, 37.6688], type: 'district' },
      { name: '성북구', coordinates: [127.016, 37.5894], type: 'district' },
      { name: '강북구', coordinates: [127.025, 37.6398], type: 'district' },
      { name: '동대문구', coordinates: [127.059, 37.5744], type: 'district' },
      { name: '성동구', coordinates: [127.036, 37.5633], type: 'district' },
      { name: '중구', coordinates: [126.997, 37.5636], type: 'district' },
      { name: '종로구', coordinates: [126.978, 37.5735], type: 'district' },
      { name: '은평구', coordinates: [126.930, 37.6028], type: 'district' },
      { name: '서대문구', coordinates: [126.936, 37.5791], type: 'district' },
      { name: '마포구', coordinates: [126.902, 37.5663], type: 'district' },
      { name: '용산구', coordinates: [126.978, 37.5384], type: 'district' },
      { name: '영등포구', coordinates: [126.896, 37.5264], type: 'district' },
      { name: '동작구', coordinates: [126.939, 37.5124], type: 'district' },
      { name: '관악구', coordinates: [126.951, 37.4754], type: 'district' },
      { name: '서초구', coordinates: [127.032, 37.4837], type: 'district' },
      { name: '강남구', coordinates: [127.028, 37.5172], type: 'district' },
      { name: '강서구', coordinates: [126.821, 37.5509], type: 'district' },
      { name: '양천구', coordinates: [126.866, 37.5163], type: 'district' },
      { name: '구로구', coordinates: [126.887, 37.4954], type: 'district' },
      { name: '금천구', coordinates: [126.902, 37.4563], type: 'district' },
      { name: '영등포구', coordinates: [126.896, 37.5264], type: 'district' }
    ];

    // 한글 라벨 GeoJSON 생성
    const koreanLabelsGeoJSON = {
      type: 'FeatureCollection',
      features: koreanLabels.map(label => ({
        type: 'Feature',
        properties: {
          name: label.name,
          type: label.type
        },
        geometry: {
          type: 'Point',
          coordinates: label.coordinates
        }
      }))
    };

    // 한글 라벨 소스 추가
    map.current.addSource('korean-labels', {
      type: 'geojson',
      data: koreanLabelsGeoJSON
    });

    // 도시 라벨 레이어
    map.current.addLayer({
      id: 'korean-city-labels',
      type: 'symbol',
      source: 'korean-labels',
      filter: ['==', ['get', 'type'], 'city'],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 14,
        'text-font': ['Noto Sans CJK KR Regular'],
        'text-anchor': 'center',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'text-pitch-alignment': 'viewport',  // 뷰포트 기준으로 텍스트 정렬
        'text-rotation-alignment': 'viewport'  // 뷰포트 기준으로 텍스트 회전 (지도 회전과 무관하게 정위치 유지)
      },
      paint: {
        'text-color': '#2c3e50',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
        'text-halo-blur': 1
      }
    });

    // 구/군 라벨 레이어
    map.current.addLayer({
      id: 'korean-district-labels',
      type: 'symbol',
      source: 'korean-labels',
      filter: ['==', ['get', 'type'], 'district'],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-font': ['Noto Sans CJK KR Regular'],
        'text-anchor': 'center',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'text-pitch-alignment': 'viewport',  // 뷰포트 기준으로 텍스트 정렬
        'text-rotation-alignment': 'viewport'  // 뷰포트 기준으로 텍스트 회전 (지도 회전과 무관하게 정위치 유지)
      },
      paint: {
        'text-color': '#34495e',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
        'text-halo-blur': 1
      }
    });
  };

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      
      {/* 속도 범례 */}
      <div className="speed-legend">
        <div className="legend-header" onClick={toggleLegend}>
          <span className="legend-title">속도 범례</span>
          <span className={`legend-arrow ${isLegendCollapsed ? 'rotated' : ''}`}>▼</span>
        </div>
        <div className={`legend-content ${isLegendCollapsed ? 'collapsed' : ''}`}>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#e53935' }}></div>
            <span className="legend-text">정체 (0-40km/h)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff9800' }}></div>
            <span className="legend-text">서행 (40-80km/h)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#00ff00' }}></div>
            <span className="legend-text">원활 (80+km/h)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;
