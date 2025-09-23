import React, { useEffect, useRef, useState } from 'react';

const MapContainer = ({ onSegmentSelect, selectedSegment, onTrafficDataUpdate }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // IC 좌표 데이터 (본선)
const MAINLINE = [
    { id: "남구리IC", x: 127.134028, y: 37.578702, chipText: "남구리IC-중랑IC" },
    { id: "중랑IC", x: 127.114804, y: 37.607384, chipText: "중랑IC-갈매동구릉TG" },
    { id: "갈매동구릉TG", x: 127.124788, y: 37.632290, chipText: "갈매동구릉TG-남별내IC" },
    { id: "남별내IC", x: 127.136868, y: 37.669719, chipText: "남별내IC-동의정부IC" },
    { id: "동의정부IC", x: 127.110712, y: 37.717605, chipText: "동의정부IC-민락IC" },
    { id: "민락IC", x: 127.121973, y: 37.747985, chipText: "민락IC-소흘IC" },
    { id: "소흘IC", x: 127.131603, y: 37.795780, chipText: "소흘IC-소흘JCT" },
    { id: "소흘JCT", x: 127.139683, y: 37.813561, chipText: "소흘JCT-선단IC" },
    { id: "선단IC", x: 127.167382, y: 37.845173, chipText: "선단IC-포천IC" },
    { id: "포천IC", x: 127.217538, y: 37.879258, chipText: "포천IC-신북IC" },
    { id: "신북IC", x: 127.218493, y: 37.911444, chipText: "" }
  ];

  // IC 좌표 데이터 (지선)
const BRANCH = [
    { id: "소흘JCT", x: 127.139683, y: 37.813561, chipText: "소흘JCT-옥정IC" },
    { id: "옥정IC", x: 127.098572, y: 37.839445, chipText: "옥정IC-양주IC" },
    { id: "양주IC", x: 127.077382, y: 37.867285, chipText: "" }
  ];

  // 영문 라벨 숨기기 함수
  const hideEnglishLabels = () => {
    if (!map.current) return;
    
    const englishLabels = [
      'place-city-lg-n', 'place-city-md-n', 'place-city-sm-n',
      'place-town-n', 'place-village-n', 'place-hamlet-n',
      'place-suburb-n', 'place-neighbourhood-n',
      'place-state-n', 'place-country-n',
      'place-city-lg-s', 'place-city-md-s', 'place-city-sm-s',
      'place-town-s', 'place-village-s', 'place-hamlet-s',
      'place-suburb-s', 'place-neighbourhood-s',
      'place-state-s', 'place-country-s',
      'place-label-city', 'place-label-town', 'place-label-village',
      'place-label-hamlet', 'place-label-suburb', 'place-label-neighbourhood',
      'place-label-state', 'place-label-country',
      'place-label-city-lg', 'place-label-city-md', 'place-label-city-sm',
      'place-label-town-lg', 'place-label-town-md', 'place-label-town-sm',
      'text-city', 'text-town', 'text-village', 'text-hamlet',
      'text-suburb', 'text-neighbourhood', 'text-state', 'text-country',
      'label-city', 'label-town', 'label-village', 'label-hamlet',
      'label-suburb', 'label-neighbourhood', 'label-state', 'label-country'
    ];
    
    map.current.getStyle().layers.forEach(layer => {
      const layerId = layer.id;
      if (englishLabels.some(label => layerId.includes(label)) ||
          (layerId.includes('text') || layerId.includes('label'))) {
        try {
          if (layerId.includes('city') || layerId.includes('town') ||
              layerId.includes('village') || layerId.includes('hamlet') ||
              layerId.includes('suburb') || layerId.includes('neighbourhood') ||
              layerId.includes('state') || layerId.includes('country')) {
        map.current.setLayoutProperty(layerId, 'visibility', 'none');
      }
        } catch (e) {
          // 레이어가 존재하지 않을 수 있음
        }
      }
    });
  };

  // MapLibre GL JS 동적 로드
  const loadMapLibre = async () => {
    try {
      // 이미 로드되었는지 확인
      if (window.maplibregl) {
        console.log('MapLibre GL JS 이미 로드됨');
        initializeMap();
        return;
      }

      console.log('MapLibre GL JS 로딩 시작...');
      
      // CSS 먼저 로드
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
      document.head.appendChild(link);

      // JavaScript 로드
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
      script.onload = () => {
        console.log('MapLibre GL JS 로드 완료');
        if (window.maplibregl && mapContainer.current) {
          initializeMap();
        } else {
          console.error('MapLibre GL JS 로드 후 초기화 실패');
        }
      };
      script.onerror = (error) => {
        console.error('MapLibre GL JS 로드 실패:', error);
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('MapLibre GL JS 로드 중 오류:', error);
    }
  };

  // 소통정보 데이터 추출 함수
  const extractTrafficDataFromSHP = (processedData, connectedData) => {
      console.log('🚦 SHP 데이터에서 소통정보 추출 중...');
      console.log('📊 MapContainer 속도 데이터:', {
        mainDown: [72, 90, 38, 70, 87, 50, 80, 22, 75, 65],
        mainUp: [83, 32, 55, 78, 92, 28, 77, 60, 83, 40],
        branchDown: [36, 79],
        branchUp: [58, 82]
      });
      
    try {
      const trafficSegments = [];
      let mainDownIndex = 0, mainUpIndex = 0, branchDownIndex = 0, branchUpIndex = 0;

      // 업데이트된 속도 데이터
      const mainSpeeds = {
        down: [72, 90, 38, 70, 87, 50, 80, 22, 75, 65], // 본선 하행
        up: [83, 32, 55, 78, 92, 28, 77, 60, 83, 40]    // 본선 상행
      };
      const branchSpeeds = {
        down: [36, 79], // 지선 하행
        up: [58, 82]    // 지선 상행
      };

      // connectedData의 features에 소통정보 추가하고 processedData에도 반영
      connectedData.features.forEach((connectedFeature, index) => {
        if (connectedFeature.geometry.type === 'LineString' && connectedFeature.properties) {
          const props = connectedFeature.properties;
          console.log(`SHP 피처 ${index} 속성:`, props);
          
          // 라인 분류 (본선/지선, 상행/하행)
          let route = 'main';
          let direction = 'down';
          
          // SHP 데이터를 IC/JC 기준으로 구간 분류
          let segmentName = '';
          
          // IC 좌표 기준으로 구간 분류 (가장 정확한 방법)
          if (connectedFeature.geometry && connectedFeature.geometry.coordinates) {
            const coordinates = connectedFeature.geometry.coordinates;
            console.log(`SHP 피처 ${index} 좌표:`, coordinates[0], coordinates[coordinates.length - 1]);
            
            // SHP 라인의 시작점과 끝점 좌표
            const startCoord = coordinates[0];
            const endCoord = coordinates[coordinates.length - 1];
            
            // 각 IC 좌표와의 거리 계산 함수
            const calculateDistance = (coord1, coord2) => {
              const [lng1, lat1] = coord1;
              const [lng2, lat2] = coord2;
              return Math.sqrt(Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2));
            };
            
            // 가장 가까운 IC 찾기
            let closestStartIC = null;
            let closestEndIC = null;
            let minStartDistance = Infinity;
            let minEndDistance = Infinity;
            
            [...MAINLINE, ...BRANCH].forEach(ic => {
              const icCoord = [ic.x, ic.y];
              const startDist = calculateDistance(startCoord, icCoord);
              const endDist = calculateDistance(endCoord, icCoord);
              
              if (startDist < minStartDistance) {
                minStartDistance = startDist;
                closestStartIC = ic;
              }
              if (endDist < minEndDistance) {
                minEndDistance = endDist;
                closestEndIC = ic;
              }
            });
            
            // 구간명 생성
            if (closestStartIC && closestEndIC && closestStartIC.id !== closestEndIC.id) {
              segmentName = `${closestStartIC.id}-${closestEndIC.id}`;
              
              // 지선 구간 판별
              if (closestStartIC.id.includes('JCT') || closestEndIC.id.includes('JCT') ||
                  closestStartIC.id.includes('옥정') || closestEndIC.id.includes('옥정') ||
                  closestStartIC.id.includes('양주') || closestEndIC.id.includes('양주')) {
                route = 'branch';
              }
              
              console.log(`SHP 피처 ${index}: ${segmentName} (${route}) - 시작: ${closestStartIC.id}, 끝: ${closestEndIC.id}`);
            } else {
              segmentName = `알 수 없는 구간 (${index})`;
              console.warn(`구간 분류 실패 - 피처 ${index}`);
            }
          }
          
          console.log(`SHP 세그먼트 최종 분류: route=${route}, direction=${direction}`);

          // 직선도/게이지와 동일한 속도 데이터 하드코딩
          let speed = 60;
          let status = '원활';
          
          // 직선도/게이지와 동일한 속도 데이터 하드코딩
          const mainSpeeds = {
            down: [72, 90, 38, 70, 87, 50, 80, 22, 75, 65], // 본선 하행
            up: [83, 32, 55, 78, 92, 28, 77, 60, 83, 40]    // 본선 상행
          };
          const branchSpeeds = {
            down: [36, 79], // 지선 하행
            up: [58, 82]    // 지선 상행
          };
          
          // 구간명 기반 속도 할당 (직선도/게이지와 동일한 데이터)
          const segmentSpeedMap = {
            // 본선 구간
            '남구리IC-중랑IC': { up: 83, down: 72 },
            '중랑IC-갈매동구릉TG': { up: 32, down: 90 },
            '갈매동구릉TG-남별내IC': { up: 55, down: 38 },
            '남별내IC-동의정부IC': { up: 78, down: 70 },
            '동의정부IC-민락IC': { up: 92, down: 87 },
            '민락IC-소흘IC': { up: 28, down: 50 },
            '소흘IC-소흘JCT': { up: 77, down: 80 },
            '소흘JCT-선단IC': { up: 60, down: 22 },
            '선단IC-포천IC': { up: 83, down: 75 },
            '포천IC-신북IC': { up: 40, down: 65 },
            // 지선 구간
            '소흘JCT-옥정IC': { up: 58, down: 36 },
            '옥정IC-양주IC': { up: 82, down: 79 }
          };
          
          const segmentData = segmentSpeedMap[segmentName];
          if (segmentData) {
            // 직선도/게이지와 동일한 로직 적용
            if (route === 'branch') {
              // 지선의 경우: 하행은 상행 속도 사용, 상행은 하행 속도 사용 (직선도와 동기화)
              speed = direction === 'down' ? segmentData.up : segmentData.down;
            } else {
              // 본선의 경우: 정상 할당
              speed = direction === 'up' ? segmentData.up : segmentData.down;
            }
          } else {
            // 매핑되지 않은 경우 기본값
            speed = 60;
            console.warn(`구간 매핑 실패: ${segmentName}`);
          }
          
          // 상태 결정 (직선도/게이지와 동일한 로직)
          if (speed < 40) {
            status = '정체';
          } else if (speed < 80) {
            status = '서행';
          } else {
            status = '원활';
          }
          
          // 색상 결정 (직선도/게이지와 동일한 로직)
          let color = '#00ff00'; // 기본값: 원활 (초록)
          if (speed < 40) {
            color = '#e53935'; // 정체 (빨강)
          } else if (speed < 80) {
            color = '#ffc107'; // 서행 (amber)
          }
          
          console.log(`지도 속도 할당: ${route} 피처 ${index} → ${speed}km/h (${status})`);

          // connectedData에 속성 추가
          connectedFeature.properties.status = status;
          connectedFeature.properties.speed = speed;
          connectedFeature.properties.color = color;
          connectedFeature.properties.route = route;
          connectedFeature.properties.direction = direction;
          connectedFeature.properties.segmentName = segmentName;

          // processedData에도 동일한 속성 추가
          if (processedData.features[index]) {
            processedData.features[index].properties.status = status;
            processedData.features[index].properties.speed = speed;
            processedData.features[index].properties.color = color;
            processedData.features[index].properties.route = route;
            processedData.features[index].properties.direction = direction;
            processedData.features[index].properties.segmentName = segmentName;
          }

          // 트래픽 세그먼트 정보 수집
          trafficSegments.push({
            id: segmentName || `${route}-${direction}-${index}`,
            name: segmentName || `${route}-${direction}-${index}`,
            route: route,
            direction: direction,
            speed: speed,
            status: status,
            color: color,
            properties: connectedFeature.properties
          });
        }
      });

      console.log('✅ 소통정보 추출 완료:', trafficSegments.length, '개 세그먼트');
      
      // App.js로 소통정보 전달
      if (onTrafficDataUpdate) {
        onTrafficDataUpdate(trafficSegments);
      }
      
    } catch (error) {
      console.error('❌ 소통정보 추출 오류:', error);
    }
  };

  // 지도 초기화
  const initializeMap = () => {
    if (map.current) {
      console.log('지도가 이미 초기화됨');
      return;
    }

    if (!mapContainer.current) {
      console.error('지도 컨테이너가 없음');
      return;
    }

    if (!window.maplibregl) {
      console.error('MapLibre GL JS가 로드되지 않음');
      return;
    }

    try {
      console.log('지도 초기화 시작...');
      
      // MapLibre 초기화: bearing=-90 (북쪽이 오른쪽으로)
      map.current = new window.maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: [
                'https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: 'simple-tiles',
              type: 'raster',
              source: 'raster-tiles',
              minzoom: 0,
              maxzoom: 22
            }
          ]
        },
        center: [127.15, 37.75], // 서울 근처
        zoom: 10,
        bearing: -90
      });

      map.current.on('load', () => {
        console.log('지도 로드 완료');
        hideEnglishLabels();
        setMapLoaded(true); // mapLoaded 상태 설정
      });

      // 네비게이션 컨트롤 추가 (회전 버튼 제거)
      map.current.addControl(new window.maplibregl.NavigationControl({
        showCompass: false, // 회전 버튼 제거
        showZoom: true
      }));

      // 팝업 생성
      popup.current = new window.maplibregl.Popup({
        closeButton: true,
        closeOnClick: false
      });

    } catch (error) {
      console.error('지도 초기화 중 오류:', error);
    }
  };

  // SHP 파일 로드 함수
  const loadShapefile = async () => {
    try {
      console.log('SHP 파일 로딩 시작...');
      
      const response = await fetch('/t_tgpe_vds_pnt_link_01r_geom.zip');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const shpjs = await import('shpjs');
      const geojson = await shpjs.default(arrayBuffer);
      
      console.log('SHP 파일 로드 성공:', geojson.features.length, '개 피처');

      // 좌표계 확인 및 변환
      if (geojson && geojson.features && geojson.features.length > 0) {
        console.log('첫 번째 feature 좌표:', geojson.features[0].geometry.coordinates[0]);
        
        const firstCoord = geojson.features[0].geometry.coordinates[0];
        if (Array.isArray(firstCoord)) {
          const [lng, lat] = firstCoord;
          if (lng > 1000 || lat > 1000) {
            console.log('좌표계 변환이 필요할 수 있습니다. UTM 좌표계로 보입니다.');
          }
        }
      }

      // 원본 데이터 그대로 사용 (라인 연결 안함)
      console.log('원본 데이터 그대로 사용 (라인 연결 안함)');
      
      return { geojson: geojson, connectedGeoJSON: geojson };
    } catch (error) {
      console.error('SHP 파일 로딩 실패:', error);
      console.error('오류 스택:', error.stack);
      return null;
    }
  };

  // 교통 레이어 추가 함수
  const addTrafficLayers = async () => {
    try {
      // SHP 파일 로드 시도
      const shapefileData = await loadShapefile();
      
      if (shapefileData) {
        console.log('SHP 파일 로드 성공, 지도에 추가 중...');
        
        const processedData = shapefileData.geojson;
        const connectedData = shapefileData.connectedGeoJSON;
        
        // 먼저 소통정보 속성 추가
        extractTrafficDataFromSHP(processedData, connectedData);
        
        // 소통정보가 추가된 processedData를 지도 소스에 추가 또는 업데이트
        if (!map.current.getSource('shapefile-source')) {
          console.log('shapefile-source 추가 중...');
          map.current.addSource('shapefile-source', {
            type: 'geojson',
            data: processedData
          });
        } else {
          console.log('shapefile-source 데이터 업데이트 중...');
          map.current.getSource('shapefile-source').setData(processedData);
        }
        
        // 기존 레이어들 제거 (새로운 데이터로 업데이트하기 위해)
        const existingLayers = ['shapefile-main-up', 'shapefile-main-down', 'shapefile-branch-up', 'shapefile-branch-down'];
        existingLayers.forEach(layerId => {
          if (map.current.getLayer(layerId)) {
            map.current.removeLayer(layerId);
          }
        });
        
        // 본선 라인 레이어 추가 (상/하행 통합)
        console.log('shapefile-main 레이어 추가 중...');
    map.current.addLayer({
          id: 'shapefile-main',
      type: 'line',
          source: 'shapefile-source',
          filter: ['==', ['get', 'route'], 'main'],
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
      paint: {
        'line-color': [
          'case',
              ['<', ['get', 'speed'], 40], '#e53935',  // 0-40km/h: 정체 (빨강)
              ['<', ['get', 'speed'], 80], '#ffc107',  // 40-80km/h: 서행 (amber)
              '#00ff00'  // 80+km/h: 원활 (초록)
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
              8, 6,    // 줌 레벨 8에서 6px
              10, 8,   // 줌 레벨 10에서 8px
              12, 12,  // 줌 레벨 12에서 12px
              14, 16,  // 줌 레벨 14에서 16px
              16, 20   // 줌 레벨 16에서 20px
            ]
          }
        });

        // 지선 라인 레이어 추가 (상/하행 통합)
        console.log('shapefile-branch 레이어 추가 중...');
    map.current.addLayer({
          id: 'shapefile-branch',
      type: 'line',
          source: 'shapefile-source',
          filter: ['==', ['get', 'route'], 'branch'],
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
      paint: {
        'line-color': [
          'case',
              ['<', ['get', 'speed'], 40], '#e53935',  // 0-40km/h: 정체 (빨강)
              ['<', ['get', 'speed'], 80], '#ffc107',  // 40-80km/h: 서행 (amber)
              '#00ff00'  // 80+km/h: 원활 (초록)
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
              8, 4,    // 줌 레벨 8에서 4px
              10, 6,   // 줌 레벨 10에서 6px
          12, 8,   // 줌 레벨 12에서 8px
          14, 12,  // 줌 레벨 14에서 12px
          16, 16   // 줌 레벨 16에서 16px
            ]
          }
        });

        console.log('SHP 라인 레이어 추가 완료 (2개 레이어 사용: 본선, 지선)');
        
        // SHP 데이터의 범위로 지도 중심 및 줌 조정 (bounds 객체 사용하지 않음)
        console.log('지도 범위 조정 중...');
        let validCoords = [];
        
        processedData.features.forEach(feature => {
          if (feature.geometry.type === 'LineString') {
            feature.geometry.coordinates.forEach(coord => {
              // 좌표 유효성 검사
              if (Array.isArray(coord) && coord.length >= 2) {
                const [lng, lat] = coord;
                if (typeof lng === 'number' && typeof lat === 'number' && 
                    !isNaN(lng) && !isNaN(lat) &&
                    lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
                  validCoords.push([lng, lat]);
                }
              }
            });
          }
        });
        
        console.log('유효한 좌표 개수:', validCoords.length);
        console.log('유효한 좌표 샘플:', validCoords.slice(0, 3));
        
        // 유효한 좌표가 있을 때만 지도 범위 조정
        if (validCoords.length > 0) {
          try {
            // 좌표로 직접 범위 계산
            const lngs = validCoords.map(coord => coord[0]);
            const lats = validCoords.map(coord => coord[1]);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            
            console.log('좌표 범위:', { minLng, maxLng, minLat, maxLat });
            
            // 중심점 계산
            const centerLng = (minLng + maxLng) / 2;
            const centerLat = (minLat + maxLat) / 2;
            const lngDiff = maxLng - minLng;
            const latDiff = maxLat - minLat;
            const maxDiff = Math.max(lngDiff, latDiff);
            
            // 범위에 따른 줌 레벨 계산
            let zoom = 10;
            if (maxDiff > 1) zoom = 8;
            else if (maxDiff > 0.5) zoom = 9;
            else if (maxDiff > 0.2) zoom = 10;
            else if (maxDiff > 0.1) zoom = 11;
            else zoom = 12;
            
            console.log('계산된 중심점:', [centerLng, centerLat]);
            console.log('계산된 줌 레벨:', zoom);
            
            // flyTo로 안전하게 이동
            map.current.flyTo({
              center: [centerLng, centerLat],
              zoom: zoom,
              duration: 1000
            });
            console.log('지도 범위 조정 완료 (flyTo 사용)');
            
          } catch (error) {
            console.error('지도 범위 조정 오류:', error);
            // 기본 위치로 이동
            map.current.flyTo({
              center: [127.15, 37.75],
              zoom: 10,
              duration: 1000
            });
          }
        } else {
          console.log('유효한 좌표가 없어 기본 위치로 이동');
          map.current.flyTo({
            center: [127.15, 37.75],
            zoom: 10,
            duration: 1000
          });
        }
        
        // IC 포인트 추가 (SHP 파일용)
        setTimeout(() => {
          addICPointsForShapefile();
        }, 100);
        
        // 라인 인터랙션 추가
        addLineInteractions();
        
        return; // SHP 파일이 로드되면 여기서 종료
      }
      
      console.log('SHP 파일 로드 실패, 기존 MOCK 데이터 사용');
    } catch (error) {
      console.error('addTrafficLayers 오류:', error);
      console.log('MOCK 데이터로 대체');
    }
  };

  // SHP 파일용 IC 포인트 추가 함수
  const addICPointsForShapefile = () => {
    if (!map.current) return;
    
    try {
      console.log('SHP 파일용 IC 포인트 추가 중...');
      
      const icPoints = [
        ...MAINLINE.map(p => ({
          type: 'Feature', 
          properties: { id: p.id, name: p.id, kind: 'main', chipText: p.chipText }, 
          geometry: { type: 'Point', coordinates: [p.x, p.y] } 
        })),
        ...BRANCH.filter(p => p.id !== '소흘JCT')
          .map(p => ({
            type: 'Feature', 
            properties: { id: p.id, name: p.id, kind: 'branch', chipText: p.chipText }, 
            geometry: { type: 'Point', coordinates: [p.x, p.y] } 
          }))
      ];

      // IC 포인트 소스 추가
      if (!map.current.getSource('ic-points-shp')) {
        map.current.addSource('ic-points-shp', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: icPoints
          }
        });
      }

      // IC 포인트 레이어 추가
      if (!map.current.getLayer('ic-points-shp')) {
    map.current.addLayer({
          id: 'ic-points-shp',
          type: 'circle',
          source: 'ic-points-shp',
          paint: {
            'circle-radius': 12,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#0066cc',
            'circle-stroke-width': 3
          }
        });

        // IC 라벨 레이어 추가 (텍스트는 정상 방향 유지)
    map.current.addLayer({
          id: 'ic-labels-shp',
      type: 'symbol',
          source: 'ic-points-shp',
      layout: {
        'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 12,
            'text-offset': [0, 3],
            'text-anchor': 'top'
            // text-rotate 제거: 텍스트는 정상 방향으로 유지
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#0b1220',
        'text-halo-width': 1
      }
    });
      }
      
      console.log('SHP 파일용 IC 포인트 추가 완료');
    } catch (error) {
      console.error('SHP 파일용 IC 포인트 추가 중 오류:', error);
    }
  };

  // 라인 인터랙션 추가
  const addLineInteractions = () => {
    if (!map.current) return;

    const layers = ['shapefile-main', 'shapefile-branch'];
    
    layers.forEach(layerId => {
      if (map.current.getLayer(layerId)) {
        // 마우스 커서 변경
        map.current.on('mouseenter', layerId, () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    
        map.current.on('mouseleave', layerId, () => {
      map.current.getCanvas().style.cursor = '';
    });
    
        // 클릭 이벤트
        map.current.on('click', layerId, (e) => {
      const feature = e.features[0];
          if (feature && feature.properties) {
      const props = feature.properties;
            const speed = props.speed || 'N/A';
            const status = props.status || 'N/A';
            const route = props.route === 'main' ? '본선' : '지선';
            const direction = props.direction === 'up' ? '상행' : '하행';
      
            const segmentName = props.segmentName || `${route} ${direction}`;
            const popupContent = `
          <div style="padding: 10px;">
                <h3>${segmentName}</h3>
                <p><strong>속도:</strong> ${speed} km/h</p>
                <p><strong>상태:</strong> ${status}</p>
          </div>
            `;
            
            // 모든 기존 팝업 제거 (전역적으로)
            document.querySelectorAll('.maplibregl-popup').forEach(popup => {
              popup.remove();
            });
            
            // 새 팝업 생성 및 표시
            const newPopup = new window.maplibregl.Popup({
              closeButton: true,
              closeOnClick: false
            });
            
            newPopup.setLngLat(e.lngLat)
              .setHTML(popupContent)
              .addTo(map.current);
          }
        });
      }
    });
  };

  // 선택된 세그먼트에 따라 지도 포커스
  useEffect(() => {
    if (selectedSegment && map.current) {
      console.log('선택된 세그먼트:', selectedSegment);
      console.log('세그먼트 속도:', selectedSegment.speed);
      console.log('세그먼트 상태:', selectedSegment.status);
      
      // 세그먼트명에서 IC/JC 이름 추출
      const segmentName = selectedSegment.name || '';
      const parts = segmentName.split('-');
      
      if (parts.length >= 2) {
        const startIC = parts[0];
        const endIC = parts[1];
        
        // 시작 IC와 끝 IC 좌표 찾기
        const startPoint = [...MAINLINE, ...BRANCH].find(p => p.id === startIC);
        const endPoint = [...MAINLINE, ...BRANCH].find(p => p.id === endIC);
        
        if (startPoint && endPoint) {
          // 중간점 계산
          const centerLng = (startPoint.x + endPoint.x) / 2;
          const centerLat = (startPoint.y + endPoint.y) / 2;
          
          // 지도 포커스
          map.current.flyTo({
            center: [centerLng, centerLat],
            zoom: 13,
            duration: 1000
          });
          
          // 팝업 표시
          console.log('선택된 세그먼트 상세 정보:', selectedSegment);
          
          // selectedSegment가 없거나 데이터가 없는 경우 기본값 사용
          const speed = selectedSegment?.speed || 'N/A';
          const status = selectedSegment?.status || 'N/A';
          
          console.log('속도:', speed, '상태:', status);
          
          const popupContent = `
            <div style="padding: 10px;">
              <h3>${segmentName}</h3>
              <p><strong>속도:</strong> ${speed} km/h</p>
              <p><strong>상태:</strong> ${status}</p>
            </div>
          `;
          
          console.log('팝업 표시 시도:', { centerLng, centerLat, popupContent });
          console.log('popup.current:', popup.current);
          console.log('map.current:', map.current);
          
          // 모든 기존 팝업 제거 (전역적으로)
          document.querySelectorAll('.maplibregl-popup').forEach(popup => {
            popup.remove();
          });
          
          // 새 팝업 생성 및 표시
          const newPopup = new window.maplibregl.Popup({
            closeButton: true,
            closeOnClick: false
          });
          
          newPopup.setLngLat([centerLng, centerLat])
            .setHTML(popupContent)
            .addTo(map.current);
            
          console.log('팝업 표시 완료:', { centerLng, centerLat });
        }
      }
    }
  }, [selectedSegment]);

  // 지도 로드 완료 후 트래픽 레이어 추가
  useEffect(() => {
    if (mapLoaded && map.current) {
      console.log('지도 로드 완료 - 트래픽 레이어 추가 시작');
      addTrafficLayers();
    }
  }, [mapLoaded]);

  // 컴포넌트 마운트 시 MapLibre 로드
  useEffect(() => {
    loadMapLibre();
    
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
    </div>
  );
};

export default MapContainer;