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
            ]
          }
        });

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
            ]
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
            ]
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
            ]
          }
        });

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

