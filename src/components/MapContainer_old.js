import React, { useEffect, useRef, useState } from 'react';
import './MapContainer.css';
import shp from 'shpjs';

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

const MapContainer = ({ onSegmentSelect, selectedSegment, onTrafficDataUpdate }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const currentPopup = useRef(null);
  const MAPTILER_KEY = 'H6Lx59Ru6ZrCUGzhseII';
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [trafficData, setTrafficData] = useState(null);

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

    // MapLibre GL JS 스크립트 동적 로드
    const loadMapLibre = async () => {
      try {
        // MapLibre GL JS CDN에서 로드
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.js';
        script.onload = () => {
          // CSS도 동적으로 로드
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.css';
          document.head.appendChild(link);

          // 약간의 지연 후 지도 초기화
          setTimeout(() => {
            initializeMap();
          }, 100);
        };
        script.onerror = () => {
          console.error('MapLibre GL JS 로드 실패');
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('MapLibre GL JS 로드 중 오류:', error);
      }
    };

    if (!window.maplibregl) {
      loadMapLibre();
    } else {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 직선도에서 구간 선택 시 지도 포커싱
  useEffect(() => {
    if (map.current && selectedSegment && selectedSegment.fromLinear) {
      console.log('지도 포커싱 요청:', selectedSegment);
      // 기존 팝업 닫기
      if (currentPopup.current) {
        currentPopup.current.remove();
        currentPopup.current = null;
      }

      // SHP 파일이 로드된 경우 SHP 라인으로 포커싱
      if (map.current.getLayer('shapefile-main-up')) {
        focusSHPSegment(selectedSegment);
      } else {
        // MOCK 데이터로 포커싱
        focusMockSegment(selectedSegment);
      }
    }
  }, [selectedSegment]);

  // SHP 라인 세그먼트 포커싱 함수
  const focusSHPSegment = (segment) => {
    if (!map.current) return;

    // 구간명에서 IC/JC 정보 추출 (예: "남구리IC-중랑IC")
    const segmentName = segment.name;
    const [startIC, endIC] = segmentName.split('-');
    
    console.log(`SHP 구간 포커싱: ${segmentName} (${startIC} → ${endIC})`);

    // IC 좌표 찾기
    const allICs = [
      ...MAINLINE.map(p => ({ ...p, isBranch: false })),
      ...BRANCH.map(p => ({ ...p, isBranch: true }))
    ];

    const startPoint = allICs.find(ic => ic.id === startIC);
    const endPoint = allICs.find(ic => ic.id === endIC);

    if (startPoint && endPoint) {
      // 두 IC 사이의 중점 계산
      const centerLng = (startPoint.x + endPoint.x) / 2;
      const centerLat = (startPoint.y + endPoint.y) / 2;

      // 지도 포커싱
      map.current.flyTo({
        center: [centerLng, centerLat],
        zoom: 13,
        speed: 1.2,
        curve: 1,
        easing(t) {
          return t;
        }
      });

      // 구간 정보 팝업 표시
      const direction = segment.isBranch ? 
        (segment.direction === 'up' ? '양주방향' : '소흘방향') :
        (segment.direction === 'up' ? '포천방향' : '구리방향');

      const routeType = segment.isBranch ? '지선' : '본선';

      const popup = new window.maplibregl.Popup({
        closeButton: true,
        closeOnClick: false
      })
        .setLngLat([centerLng, centerLat])
        .setHTML(`
          <div style="padding: 8px; min-width: 140px;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #333;">${segmentName}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">${routeType} ${direction}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">속도: ${segment.speed || 'N/A'} km/h</div>
          </div>
        `)
        .addTo(map.current);
      currentPopup.current = popup;

      console.log(`SHP 구간 포커싱 완료: ${segmentName}`);
    } else {
      console.log(`IC 좌표를 찾을 수 없음: ${startIC} 또는 ${endIC}`);
    }
  };

  // MOCK 데이터 세그먼트 포커싱 함수
  const focusMockSegment = (segment) => {
    if (!map.current) return;

    const allSegments = [
      ...MAINLINE.map(p => ({ ...p, isBranch: false })),
      ...BRANCH.map(p => ({ ...p, isBranch: true }))
    ];

    const targetIC = allSegments.find(ic => ic.id === segment.name);

    if (targetIC) {
      map.current.flyTo({
        center: [targetIC.x, targetIC.y],
        zoom: 14,
        speed: 1.2,
        curve: 1,
        easing(t) {
          return t;
        }
      });

      // 팝업 표시
      const popup = new window.maplibregl.Popup({
        closeButton: true,
        closeOnClick: false
      })
        .setLngLat([targetIC.x, targetIC.y])
        .setHTML(`
          <div style="padding: 8px; min-width: 120px;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #333;">${targetIC.id}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">${targetIC.chipText}</div>
          </div>
        `)
        .addTo(map.current);
      currentPopup.current = popup;
    }
  };

  // SHP 데이터에서 소통정보 추출 및 LinearDiagram에 전달
  // 구체적인 속도 데이터 함수
  const getSpecificSpeed = (props, route, direction) => {
    // 업데이트된 본선 구간별 속도 데이터
    const mainSpeeds = {
      down: [72, 90, 38, 70, 87, 50, 80, 22, 75, 65], // 하행
      up: [83, 32, 55, 78, 92, 28, 77, 60, 83, 40]    // 상행
    };
    
    // 업데이트된 지선 구간별 속도 데이터
    const branchSpeeds = {
      down: [36, 79], // 하행
      up: [58, 82]    // 상행
    };
    
    // link_sqno를 기반으로 구간 인덱스 결정 (더 정확한 매핑)
    let segmentIndex = 0;
    
    if (props.link_sqno) {
      // link_sqno가 1부터 시작한다면 0부터 시작하는 인덱스로 변환
      segmentIndex = Math.max(0, parseInt(props.link_sqno) - 1);
      
      // 디버깅: 모든 구간 인덱스 정보 출력
      console.log(`🔍 구간 매핑: link_sqno=${props.link_sqno}, segmentIndex=${segmentIndex}, route=${route}, direction=${direction}`);
    } else if (props.link_id) {
      // link_id에서 숫자 추출하여 인덱스 결정
      const numericPart = props.link_id.replace(/[^0-9]/g, '');
      segmentIndex = parseInt(numericPart) % 10; // 0-9 범위로 정규화
      console.log(`🔍 link_id 기반 매핑: link_id=${props.link_id}, segmentIndex=${segmentIndex}`);
    }
    
    // 범위 체크
    if (route === 'main') {
      segmentIndex = Math.min(segmentIndex, mainSpeeds[direction].length - 1);
      return mainSpeeds[direction][segmentIndex];
    } else {
      segmentIndex = Math.min(segmentIndex, branchSpeeds[direction].length - 1);
      return branchSpeeds[direction][segmentIndex];
    }
  };

  const extractTrafficDataFromSHP = (processedData, connectedData) => {
    console.log('🚦 SHP 데이터에서 소통정보 추출 중...');
    
    try {
      const trafficSegments = [];
      let mainDownIndex = 0, mainUpIndex = 0, branchDownIndex = 0, branchUpIndex = 0;
      
      // connectedData의 features에 소통정보 추가하고 processedData에도 반영
      connectedData.features.forEach((connectedFeature, index) => {
        if (connectedFeature.geometry.type === 'LineString' && connectedFeature.properties) {
          const props = connectedFeature.properties;
          
          // 처음 몇 개 feature의 속성들을 콘솔에 출력 (디버깅용)
          if (index < 3) {
            console.log(`🔍 SHP 데이터 feature ${index} 속성:`, props);
          }
          
          // route 및 direction 분류 (SHP 데이터 속성 기반)
          let route = 'main'; // 기본값
          let direction = 'up'; // 기본값
          
          // SHP 데이터의 속성을 확인해서 본선/지선 및 상/하행 구분
          if (props.link_id) {
            const linkId = props.link_id;
            
            // link_id를 기반으로 본선/지선 구분
            if (typeof linkId === 'string') {
              // 'LK10006000' 형태에서 숫자 부분을 확인
              const numericPart = linkId.replace(/[^0-9]/g, '');
              if (numericPart && parseInt(numericPart) > 100000) {
                route = 'branch'; // 큰 숫자는 지선으로 판단
              }
            }
          }
          
          // 방향 구분 (SHP 파일에 방향 정보가 있다면 활용)
          // 일반적인 방향 속성명들을 확인
          if (props.direction || props.dir || props.way || props.side) {
            const dir = props.direction || props.dir || props.way || props.side;
            if (typeof dir === 'string') {
              if (dir.toLowerCase().includes('down') || dir.toLowerCase().includes('하행') || dir === '0') {
                direction = 'down';
              } else if (dir.toLowerCase().includes('up') || dir.toLowerCase().includes('상행') || dir === '1') {
                direction = 'up';
              }
            } else if (typeof dir === 'number') {
              direction = dir === 0 ? 'down' : 'up';
            }
          } else {
            // 방향 정보가 없으면 link_sqno나 다른 속성으로 추정
            if (props.link_sqno) {
              const sqno = parseInt(props.link_sqno);
              direction = sqno % 2 === 0 ? 'down' : 'up';
            }
          }
          
          // 처음 몇 개 feature의 분류 결과를 콘솔에 출력 (디버깅용)
          if (index < 3) {
            console.log(`🔍 feature ${index} 분류:`, { 
              linkId: props.link_id, 
              link_sqno: props.link_sqno,
              route, 
              direction,
              allProps: props 
            });
          }
          
          // 구체적인 소통정보 데이터 적용 (순차적으로 할당)
          let speed, status, color;
          
          // 업데이트된 속도 데이터
          const mainSpeeds = {
            down: [72, 90, 38, 70, 87, 50, 80, 22, 75, 65], // 본선 하행
            up: [83, 32, 55, 78, 92, 28, 77, 60, 83, 40]    // 본선 상행
          };
          const branchSpeeds = {
            down: [36, 79], // 지선 하행
            up: [58, 82]    // 지선 상행
          };
          
          // 순차적으로 속도 할당
          if (route === 'main') {
            if (direction === 'down') {
              speed = mainSpeeds.down[mainDownIndex] || 60;
              mainDownIndex++;
            } else {
              speed = mainSpeeds.up[mainUpIndex] || 60;
              mainUpIndex++;
            }
          } else {
            if (direction === 'down') {
              speed = branchSpeeds.down[branchDownIndex] || 60;
              branchDownIndex++;
            } else {
              speed = branchSpeeds.up[branchUpIndex] || 60;
              branchUpIndex++;
            }
          }
          
          // 속도에 따른 상태와 색상 결정
          if (speed < 40) {
            status = 'congested';
            color = '#e53935'; // 정체 (빨강)
          } else if (speed < 80) {
            status = 'slow';
            color = '#ffc107'; // 서행 (amber)
          } else {
            status = 'smooth';
            color = '#00ff00'; // 원활 (초록)
          }
          
          // 디버깅: 할당된 속도 정보 출력
          console.log(`🚦 속도 할당: route=${route}, direction=${direction}, speed=${speed}km/h, status=${status}, color=${color}`);
          
          // connectedData의 feature에 소통정보 및 route, direction 추가
          connectedFeature.properties.status = status;
          connectedFeature.properties.speed = speed;
          connectedFeature.properties.color = color;
          connectedFeature.properties.route = route;
          connectedFeature.properties.direction = direction;
          
          // processedData의 해당 feature에도 소통정보 및 route, direction 추가
          if (processedData.features[index]) {
            processedData.features[index].properties.status = status;
            processedData.features[index].properties.speed = speed;
            processedData.features[index].properties.color = color;
            processedData.features[index].properties.route = route;
            processedData.features[index].properties.direction = direction;
          }
          
          const segment = {
            id: props.id || 'unknown',
            name: props.name || 'Unknown Segment',
            status: status,
            speed: speed,
            color: color, // 색상 정보도 포함
            route: route, // 위에서 분류한 route 사용
            direction: direction, // 위에서 분류한 direction 사용
            linkId: props.link_id, // SHP 파일의 원본 link_id
            linkSqno: props.link_sqno // SHP 파일의 원본 link_sqno
          };
          trafficSegments.push(segment);
        }
      });
      
      console.log('📊 추출된 소통정보 세그먼트:', trafficSegments.length, '개');
      
      // LinearDiagram에 전달
      if (onTrafficDataUpdate) {
        onTrafficDataUpdate(trafficSegments);
        console.log('✅ LinearDiagram에 소통정보 전달 완료');
      }
      
      // 내부 상태에도 저장
      setTrafficData(trafficSegments);
      
    } catch (error) {
      console.error('❌ 소통정보 추출 오류:', error);
    }
  };

  const initializeMap = () => {
    if (map.current) return; // 이미 초기화된 경우 중복 실행 방지

    try {
    // MapLibre 초기화: bearing=-90 (반시계방향 90도)
      map.current = new window.maplibregl.Map({
      container: mapContainer.current,
      // MapTiler 스타일 사용
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: [127.15, 37.76],
      zoom: 10,
      bearing: -90, // ★ 반시계방향 90° (북쪽이 화면 왼쪽)
      pitch: 0,
      attributionControl: true
    });

    // 네비게이션 컨트롤 추가 (회전 버튼 제거)
      map.current.addControl(new window.maplibregl.NavigationControl({ 
      showCompass: false, // 회전 버튼 제거
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
            
            // MOCK 데이터 렌더링은 LinearDiagram에서만 처리
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
    } catch (error) {
      console.error('지도 초기화 중 오류:', error);
    }
  };

    // 컴포넌트 언마운트 시 지도 정리
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // SHP 파일을 로드하고 GeoJSON으로 변환하는 함수
  const loadShapefile = async () => {
    try {
      console.log('SHP 파일 로딩 시작...');
      
      // SHP 파일 경로 (public 폴더에 위치)
      const shapefileUrl = '/t_tgpe_vds_pnt_link_01r_geom.zip';
      console.log('SHP 파일 URL:', shapefileUrl);
      
      // fetch로 ZIP 파일 다운로드
      const response = await fetch(shapefileUrl);
      console.log('HTTP 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const zipBuffer = await response.arrayBuffer();
      console.log('ZIP 파일 다운로드 완료, 크기:', zipBuffer.byteLength);
      
      if (zipBuffer.byteLength === 0) {
        throw new Error('ZIP 파일이 비어있습니다');
      }
      
      // shpjs로 SHP 파일 파싱
      console.log('shpjs 호출 중...');
      const geojson = await shp(zipBuffer);
      console.log('GeoJSON 변환 완료:', geojson);
      
      // 좌표계 확인 및 변환
      if (geojson && geojson.features && geojson.features.length > 0) {
        console.log('첫 번째 feature 좌표:', geojson.features[0].geometry.coordinates[0]);
        
        // 좌표가 UTM이나 다른 좌표계인지 확인 (경도가 127 정도, 위도가 37 정도여야 함)
        const firstCoord = geojson.features[0].geometry.coordinates[0][0];
        if (Array.isArray(firstCoord)) {
          const [lng, lat] = firstCoord;
          console.log(`좌표 확인 - 경도: ${lng}, 위도: ${lat}`);
          
          // 좌표가 WGS84 범위가 아닌 경우 (예: UTM 좌표계)
          if (lng > 180 || lng < -180 || lat > 90 || lat < -90) {
            console.log('좌표계 변환이 필요할 수 있습니다.');
            // 여기에 좌표 변환 로직을 추가할 수 있습니다
          }
        }
      }
      
      if (!geojson || !geojson.features) {
        throw new Error('GeoJSON 변환 실패: features가 없습니다');
      }
      
      console.log('GeoJSON features 개수:', geojson.features.length);
      console.log('첫 번째 feature 예시:', geojson.features[0]);
      
      // SHP 파일의 전체 bounds 계산
      const bounds = new window.maplibregl.LngLatBounds();
      let coordCount = 0;
      geojson.features.forEach(feature => {
        if (feature.geometry.type === 'LineString') {
          feature.geometry.coordinates.forEach(coord => {
            bounds.extend(coord);
            coordCount++;
          });
        }
      });
      console.log(`SHP 파일 전체 bounds:`, bounds.toArray());
      console.log(`총 좌표 개수: ${coordCount}`);
      
      // 끊어진 라인 연결 비활성화 - 원본 데이터 그대로 사용
      console.log('원본 데이터 그대로 사용 (라인 연결 안함)');
      
      return { geojson: geojson, connectedGeoJSON: geojson };
    } catch (error) {
      console.error('SHP 파일 로딩 실패:', error);
      console.error('오류 스택:', error.stack);
      return null;
    }
  };

  // 끊어진 라인들을 연결하는 함수
  const connectBrokenLines = (geojson) => {
    if (!geojson || !geojson.features) return geojson;

    const features = [...geojson.features];
    const connectedFeatures = [];
    const maxDistance = 0.001; // 약 100미터 거리 내에서 연결 (경도/위도 단위)

    console.log(`원본 features 개수: ${features.length}`);

    // 거리 계산 함수 (간단한 유클리드 거리)
    const calculateDistance = (coord1, coord2) => {
      const [lng1, lat1] = coord1;
      const [lng2, lat2] = coord2;
      return Math.sqrt(Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2));
    };

    // 라인 끝점들을 찾아서 연결 가능한지 확인
    while (features.length > 0) {
      const currentFeature = features.shift();
      let currentLine = [...currentFeature.geometry.coordinates];
      let connected = true;

      while (connected) {
        connected = false;
        
        // 현재 라인의 끝점들
        const startPoint = currentLine[0];
        const endPoint = currentLine[currentLine.length - 1];

        // 다른 features와 연결 가능한지 확인
        for (let i = features.length - 1; i >= 0; i--) {
          const otherFeature = features[i];
          const otherStart = otherFeature.geometry.coordinates[0];
          const otherEnd = otherFeature.geometry.coordinates[otherFeature.geometry.coordinates.length - 1];

          let shouldConnect = false;
          let newCoords = null;

          // endPoint와 otherStart가 가까운 경우
          if (calculateDistance(endPoint, otherStart) < maxDistance) {
            shouldConnect = true;
            newCoords = currentLine.concat(otherFeature.geometry.coordinates);
          }
          // endPoint와 otherEnd가 가까운 경우 (역방향 연결)
          else if (calculateDistance(endPoint, otherEnd) < maxDistance) {
            shouldConnect = true;
            newCoords = currentLine.concat([...otherFeature.geometry.coordinates].reverse());
          }
          // startPoint와 otherEnd가 가까운 경우
          else if (calculateDistance(startPoint, otherEnd) < maxDistance) {
            shouldConnect = true;
            newCoords = [...otherFeature.geometry.coordinates].concat(currentLine);
          }
          // startPoint와 otherStart가 가까운 경우 (역방향 연결)
          else if (calculateDistance(startPoint, otherStart) < maxDistance) {
            shouldConnect = true;
            newCoords = [...otherFeature.geometry.coordinates].reverse().concat(currentLine);
          }

          if (shouldConnect && newCoords) {
            // 연결된 라인으로 업데이트
            currentLine = newCoords;
            features.splice(i, 1); // 사용된 feature 제거
            connected = true;
            console.log(`라인 연결됨: ${currentFeature.properties?.id || 'unknown'} + ${otherFeature.properties?.id || 'unknown'}`);
            break;
          }
        }
      }

      // 연결된 라인을 새로운 feature로 추가
      connectedFeatures.push({
        ...currentFeature,
        geometry: {
          ...currentFeature.geometry,
          coordinates: currentLine
        }
      });
    }

    console.log(`연결 후 features 개수: ${connectedFeatures.length}`);
    
    return {
      ...geojson,
      features: connectedFeatures
    };
  };

  // SHP 라인을 상행/하행으로 분리하는 함수
  const splitLinesUpDown = (geojson) => {
    if (!geojson || !geojson.features) return geojson;

    const upFeatures = [];
    const downFeatures = [];
    const branchUpFeatures = [];
    const branchDownFeatures = [];

    console.log(`분리할 features 개수: ${geojson.features.length}`);

    geojson.features.forEach((feature, index) => {
      if (feature.geometry.type === 'LineString') {
        const coords = feature.geometry.coordinates;
        
        // 라인이 지선인지 본선인지 판단 (양주 방향으로 가는지 확인)
        const isBranchLine = isBranchRoute(coords);
        
        // 상행 라인 (원본 좌표 + 오프셋)
        const upCoords = coords.map(coord => [
          coord[0] + 0.0001, // 경도 오프셋 (동쪽으로 약간 이동)
          coord[1] + 0.00005  // 위도 오프셋 (북쪽으로 약간 이동)
        ]);

        // 하행 라인 (원본 좌표 - 오프셋)
        const downCoords = coords.map(coord => [
          coord[0] - 0.0001, // 경도 오프셋 (서쪽으로 약간 이동)
          coord[1] - 0.00005  // 위도 오프셋 (남쪽으로 약간 이동)
        ]);

        // 상행 feature 생성
        const upFeature = {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: upCoords
          },
          properties: {
            ...feature.properties,
            direction: 'up',
            route: isBranchLine ? 'branch' : 'main'
          }
        };

        // 하행 feature 생성
        const downFeature = {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: downCoords
          },
          properties: {
            ...feature.properties,
            direction: 'down',
            route: isBranchLine ? 'branch' : 'main'
          }
        };

        // 지선인지 본선인지에 따라 분류
        if (isBranchLine) {
          branchUpFeatures.push(upFeature);
          branchDownFeatures.push(downFeature);
        } else {
          upFeatures.push(upFeature);
          downFeatures.push(downFeature);
        }
      }
    });

    console.log(`본선 상행: ${upFeatures.length}개, 본선 하행: ${downFeatures.length}개`);
    console.log(`지선 상행: ${branchUpFeatures.length}개, 지선 하행: ${branchDownFeatures.length}개`);

    // 모든 feature를 하나의 FeatureCollection으로 합치기
    const allFeatures = [
      ...upFeatures,
      ...downFeatures,
      ...branchUpFeatures,
      ...branchDownFeatures
    ];

    return {
      ...geojson,
      features: allFeatures
    };
  };

  // 지선인지 판단하는 함수 (양주 방향으로 가는지 확인)
  const isBranchRoute = (coords) => {
    if (!coords || coords.length < 2) return false;
    
    const startCoord = coords[0];
    const endCoord = coords[coords.length - 1];
    
    // 양주 방향은 서쪽으로 가는 경향이 있음 (경도가 감소)
    // 소흘JCT 근처에서 시작해서 양주 방향으로 가는지 확인
    const soheulJCX = 127.139683; // 소흘JCT 경도
    const soheulJCY = 37.813561; // 소흘JCT 위도
    
    const startDistance = Math.sqrt(
      Math.pow(startCoord[0] - soheulJCX, 2) + 
      Math.pow(startCoord[1] - soheulJCY, 2)
    );
    
    const endDistance = Math.sqrt(
      Math.pow(endCoord[0] - soheulJCX, 2) + 
      Math.pow(endCoord[1] - soheulJCY, 2)
    );
    
    // 소흘JCT 근처에서 시작하고 서쪽으로 가는 경우 지선으로 판단
    const isNearSoheulJC = startDistance < 0.01; // 약 1km 내
    const isGoingWest = endCoord[0] < startCoord[0]; // 서쪽으로 이동
    
    return isNearSoheulJC && isGoingWest;
  };

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
        
        // 본선 상행 라인 레이어 추가
        console.log('shapefile-main-up 레이어 추가 중...');
        map.current.addLayer({
            id: 'shapefile-main-up',
            type: 'line',
            source: 'shapefile-source',
            filter: ['all', ['==', ['get', 'route'], 'main'], ['==', ['get', 'direction'], 'up']],
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
              ],
              // line-translate 제거 - 원본 위치 그대로 사용
            }
          });
        }

        // 본선 하행 라인 레이어 추가
        console.log('shapefile-main-down 레이어 추가 중...');
        map.current.addLayer({
            id: 'shapefile-main-down',
            type: 'line',
            source: 'shapefile-source',
            filter: ['all', ['==', ['get', 'route'], 'main'], ['==', ['get', 'direction'], 'down']],
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
              ],
              // line-translate 제거 - 원본 위치 그대로 사용
            }
          });

        // 지선 상행 라인 레이어 추가
        console.log('shapefile-branch-up 레이어 추가 중...');
        map.current.addLayer({
            id: 'shapefile-branch-up',
            type: 'line',
            source: 'shapefile-source',
            filter: ['all', ['==', ['get', 'route'], 'branch'], ['==', ['get', 'direction'], 'up']],
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
              ],
              // line-translate 제거 - 원본 위치 그대로 사용
            }
          });

        // 지선 하행 라인 레이어 추가
        console.log('shapefile-branch-down 레이어 추가 중...');
        map.current.addLayer({
            id: 'shapefile-branch-down',
            type: 'line',
            source: 'shapefile-source',
            filter: ['all', ['==', ['get', 'route'], 'branch'], ['==', ['get', 'direction'], 'down']],
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
              ],
              // line-translate 제거 - 원본 위치 그대로 사용
            }
          });
        }

        console.log('SHP 라인 레이어 추가 완료 (4개 레이어 사용)');
        
        // SHP 데이터의 bounds로 지도 범위 조정
        console.log('지도 범위 조정 중...');
        const bounds = new window.maplibregl.LngLatBounds();
        let boundsCount = 0;
        processedData.features.forEach(feature => {
          if (feature.geometry.type === 'LineString') {
            feature.geometry.coordinates.forEach(coord => {
              bounds.extend(coord);
              boundsCount++;
            });
          }
        });
        console.log('bounds 점 개수:', boundsCount);
        map.current.fitBounds(bounds, { padding: 80, duration: 1000 });
        
        console.log('SHP 라인 레이어 추가 완료');
        
        // 소통정보 데이터는 이미 위에서 추가됨
        
        // SHP 파일이 로드되어도 기존 IC 좌표 데이터로 IC 포인트 표시 (라인 위에 표시)
        console.log('SHP 파일 사용 중 - 기존 IC 좌표 데이터로 IC 포인트 추가');
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
      
      // MOCK 데이터 처리 (SHP 파일 로드 실패 시)
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
    const bounds = new window.maplibregl.LngLatBounds();
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
          ['<', ['get', 'speed'], 80], '#ffc107',  // 40-80km/h: amber
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
        'line-translate': [20, 24]  // 본선 상행: 오른쪽으로 20px, 아래쪽으로 24px 이동 (포천방향)
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
          ['<', ['get', 'speed'], 80], '#ffc107',  // 40-80km/h: amber
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
        'line-translate': [0, 0]  // 본선 하행: 원본 위치 고정 (구리방향)
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
          ['<', ['get', 'speed'], 80], '#ffc107',  // 40-80km/h: amber
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
        'line-translate': [24, 18]  // 지선 상행: 오른쪽으로 24px, 아래쪽으로 18px 이동 (양주방향)
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
          ['<', ['get', 'speed'], 80], '#ffc107',  // 40-80km/h: amber
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
        'line-translate': [0, 0]  // 지선 하행: 원본 위치 고정 (소흘방향)
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
    } catch (error) {
      console.error('addTrafficLayers 오류:', error);
      console.log('MOCK 데이터로 대체');
    }
  }; // addTrafficLayers 함수 끝

  // SHP 파일용 IC 포인트 추가 함수
  const addICPointsForShapefile = () => {
    if (!map.current) return;
    
    try {
      console.log('SHP 파일용 IC 포인트 추가 중...');
      
      // IC 포인트 데이터 생성
      const icPointFeatures = [
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
      if (!map.current.getSource('ic-points-shapefile')) {
        map.current.addSource('ic-points-shapefile', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: icPointFeatures }
        });
      }

      // IC 원형 마커
      if (!map.current.getLayer('ic-circles-shapefile')) {
        map.current.addLayer({
          id: 'ic-circles-shapefile',
          type: 'circle',
          source: 'ic-points-shapefile',
          paint: {
            'circle-color': '#ffffff',
            'circle-stroke-color': '#5b74ff',
            'circle-stroke-width': 3,
            'circle-radius': 12
          }
        });
      }

      // IC 라벨
      if (!map.current.getLayer('ic-labels-shapefile')) {
        map.current.addLayer({
          id: 'ic-labels-shapefile',
          type: 'symbol',
          source: 'ic-points-shapefile',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 12,
            'text-offset': [0, 3],
            'text-anchor': 'top',
            'text-allow-overlap': true,
            'text-pitch-alignment': 'viewport',
            'text-rotation-alignment': 'viewport'
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

  const addLineInteractions = () => {
    // 상행/하행 라인 클릭 이벤트 및 툴팁
    const popup = new window.maplibregl.Popup({
      closeButton: true,
      closeOnClick: false
    });
    
    // SHP 라인 클릭 이벤트 (SHP 파일이 로드된 경우)
    if (map.current.getLayer('shapefile-main-up')) {
      console.log('SHP 라인 클릭 이벤트 등록 중...');
      
      // 모든 SHP 라인 레이어에 클릭 이벤트 추가
      const shpLayers = ['shapefile-main-up', 'shapefile-main-down', 'shapefile-branch-up', 'shapefile-branch-down'];
      
      shpLayers.forEach(layerId => {
        map.current.on('click', layerId, (e) => {
          const feature = e.features[0];
          const props = feature.properties;
          
          const direction = props.direction === 'up' ? '상행' : '하행';
          const route = props.route === 'branch' ? '지선' : '본선';
          
          popup.setLngLat(e.lngLat)
            .setHTML(`
              <div style="padding: 8px; min-width: 120px;">
                <div style="font-weight: bold; margin-bottom: 4px; color: #333;">${route} ${direction}</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 2px;">상태: ${props.status || 'unknown'}</div>
                <div style="font-size: 12px; color: #333; font-weight: bold;">ID: ${props.id || 'N/A'}</div>
              </div>
            `)
            .addTo(map.current);
        });

        // 마우스 오버 이벤트
        map.current.on('mouseenter', layerId, () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', layerId, () => {
          map.current.getCanvas().style.cursor = '';
        });
      });
      
      console.log('SHP 라인 클릭 이벤트 등록 완료');
      return; // SHP 라인이 있으면 여기서 종료
    }
    
    console.log('MOCK 데이터 라인 클릭 이벤트 등록 중...');
    
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
    
    console.log('MOCK 데이터 라인 클릭 이벤트 등록 완료');
  };

  // === 거리(km)
  const haversine = (lng1, lat1, lng2, lat2) => {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  // MOCK 데이터 렌더링은 LinearDiagram에서만 처리
  
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
            <div className="legend-color" style={{ backgroundColor: '#ffc107' }}></div>
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
