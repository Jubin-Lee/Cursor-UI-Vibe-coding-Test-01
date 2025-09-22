import React, { useEffect, useRef, useState } from 'react';
import './MapContainer.css';
import shp from 'shpjs';

// IC 醫뚰몴 ?곗씠??
const MAINLINE = [
  { id: "?④뎄由촇C", x: 127.134028, y: 37.578702, chipText: "IC" },
  { id: "以묐옉IC", x: 127.114804, y: 37.607384, chipText: "IC" },
  { id: "媛덈ℓ?숆뎄由뎆G", x: 127.124788, y: 37.632290, chipText: "TG" },
  { id: "?⑤퀎?퀹C", x: 127.136868, y: 37.669719, chipText: "IC" },
  { id: "?숈쓽?뺣?IC", x: 127.110712, y: 37.717605, chipText: "IC" },
  { id: "誘쇰씫IC", x: 127.121973, y: 37.747985, chipText: "IC" },
  { id: "?뚰쓽IC", x: 127.131603, y: 37.795780, chipText: "IC" },
  { id: "?뚰쓽JCT", x: 127.139683, y: 37.813561, chipText: "JCT" },
  { id: "?좊떒IC", x: 127.167382, y: 37.845173, chipText: "IC" },
  { id: "?ъ쿇IC", x: 127.217538, y: 37.879258, chipText: "IC" },
  { id: "?좊턿IC", x: 127.218493, y: 37.911444, chipText: "IC" },
];

const BRANCH = [
  { id: "?뚰쓽JCT", x: 127.139683, y: 37.813561, chipText: "JCT" },
  { id: "?μ젙IC", x: 127.108479, y: 37.835295, chipText: "IC" },
  { id: "?묒＜IC", x: 127.087211, y: 37.842319, chipText: "IC" },
];

const MapContainer = ({ onSegmentSelect, selectedSegment, onTrafficDataUpdate }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const currentPopup = useRef(null);
  const MAPTILER_KEY = 'H6Lx59Ru6ZrCUGzhseII';
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [trafficData, setTrafficData] = useState(null);

  // ?띾룄 踰붾? ?좉? ?⑥닔
  const toggleLegend = () => {
    setIsLegendCollapsed(!isLegendCollapsed);
  };

  // ?곷Ц ?쇰꺼 ?④린湲??⑥닔
  const hideEnglishLabels = () => {
    if (!map.current) return;
    
    // MapTiler streets-v2 ?ㅽ??쇱쓽 紐⑤뱺 ?곷Ц ?쇰꺼 ?덉씠?대뱾???④?
    const englishLabelLayers = [
      // ?꾩떆/吏???쇰꺼
      'place-city-lg-n', 'place-city-md-n', 'place-city-sm-n',
      'place-town-n', 'place-village-n', 'place-hamlet-n',
      'place-suburb-n', 'place-neighbourhood-n',
      'place-state-n', 'place-country-n',
      'place-city-lg-s', 'place-city-md-s', 'place-city-sm-s',
      'place-town-s', 'place-village-s', 'place-hamlet-s',
      'place-suburb-s', 'place-neighbourhood-s',
      'place-state-s', 'place-country-s',
      // 異붽? ?곷Ц ?쇰꺼??
      'place-label-city', 'place-label-town', 'place-label-village',
      'place-label-hamlet', 'place-label-suburb', 'place-label-neighbourhood',
      'place-label-state', 'place-label-country',
      'place-label-city-lg', 'place-label-city-md', 'place-label-city-sm',
      'place-label-town-lg', 'place-label-town-md', 'place-label-town-sm',
      'place-label-village-lg', 'place-label-village-md', 'place-label-village-sm',
      // ?ㅻⅨ 媛?ν븳 ?쇰꺼??
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
    
    // 紐⑤뱺 ?덉씠?대? ?뺤씤?섏뿬 ?곷Ц ?띿뒪?멸? ?ы븿???덉씠??李얘린
    const allLayers = map.current.getStyle().layers;
    allLayers.forEach(layer => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        const textField = layer.layout['text-field'];
        // ?곷Ц ?띿뒪?멸? ?ы븿???덉씠?댁씤吏 ?뺤씤
        if (typeof textField === 'string' && 
            (textField.includes('name_en') || 
             textField.includes('name:en') || 
             textField.includes('name_en:') ||
             textField.includes('name:en:'))) {
          map.current.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      }
    });
    
    // 異붽?: 紐⑤뱺 ?띿뒪???덉씠?대? ?뺤씤?섏뿬 ?쒓????꾨땶 寃??④린湲?(???덉쟾??諛⑹떇)
    setTimeout(() => {
      const allLayers2 = map.current.getStyle().layers;
      allLayers2.forEach(layer => {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          const layerId = layer.id;
          // ?쒓? ?쇰꺼, IC ?쇰꺼, ?ш퀬 ?쇰꺼? 蹂댄샇?섍퀬, ?곷Ц ?쇰꺼留??④린湲?
          if (!layerId.includes('korean') && 
              !layerId.includes('ic') && 
              !layerId.includes('incidents') &&
              (layerId.includes('place') || 
               layerId.includes('text') || 
               layerId.includes('label'))) {
            try {
              // ?곷Ц ?쇰꺼留??④린湲?(?쒓? ?쇰꺼? 蹂댄샇)
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
              // ?덉씠?닿? 議댁옱?섏? ?딆쓣 ???덉쓬
            }
          }
        }
      });
    }, 1000);
  };

  useEffect(() => {
    if (map.current) return; // ?대? 珥덇린?붾맂 寃쎌슦 以묐났 ?ㅽ뻾 諛⑹?

    // MapLibre GL JS ?ㅽ겕由쏀듃 ?숈쟻 濡쒕뱶
    const loadMapLibre = async () => {
      try {
        // MapLibre GL JS CDN?먯꽌 濡쒕뱶
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.js';
        script.onload = () => {
          // CSS???숈쟻?쇰줈 濡쒕뱶
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.css';
          document.head.appendChild(link);

          // ?쎄컙??吏????吏??珥덇린??
          setTimeout(() => {
            initializeMap();
          }, 100);
        };
        script.onerror = () => {
          console.error('MapLibre GL JS 濡쒕뱶 ?ㅽ뙣');
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('MapLibre GL JS 濡쒕뱶 以??ㅻ쪟:', error);
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

  // 吏곸꽑?꾩뿉??援ш컙 ?좏깮 ??吏???ъ빱??
  useEffect(() => {
    if (map.current && selectedSegment && selectedSegment.fromLinear) {
      console.log('吏???ъ빱???붿껌:', selectedSegment);
      // 湲곗〈 ?앹뾽 ?リ린
      if (currentPopup.current) {
        currentPopup.current.remove();
        currentPopup.current = null;
      }

      // SHP ?뚯씪??濡쒕뱶??寃쎌슦 SHP ?쇱씤?쇰줈 ?ъ빱??
      if (map.current.getLayer('shapefile-main-up')) {
        focusSHPSegment(selectedSegment);
      } else {
        // MOCK ?곗씠?곕줈 ?ъ빱??
        focusMockSegment(selectedSegment);
      }
    }
  }, [selectedSegment]);

  // SHP ?쇱씤 ?멸렇癒쇳듃 ?ъ빱???⑥닔
  const focusSHPSegment = (segment) => {
    if (!map.current) return;

    // 援ш컙紐낆뿉??IC/JC ?뺣낫 異붿텧 (?? "?④뎄由촇C-以묐옉IC")
    const segmentName = segment.name;
    const [startIC, endIC] = segmentName.split('-');
    
    console.log(`SHP 援ш컙 ?ъ빱?? ${segmentName} (${startIC} ??${endIC})`);

    // IC 醫뚰몴 李얘린
    const allICs = [
      ...MAINLINE.map(p => ({ ...p, isBranch: false })),
      ...BRANCH.map(p => ({ ...p, isBranch: true }))
    ];

    const startPoint = allICs.find(ic => ic.id === startIC);
    const endPoint = allICs.find(ic => ic.id === endIC);

    if (startPoint && endPoint) {
      // ??IC ?ъ씠??以묒젏 怨꾩궛
      const centerLng = (startPoint.x + endPoint.x) / 2;
      const centerLat = (startPoint.y + endPoint.y) / 2;

      // 吏???ъ빱??
      map.current.flyTo({
        center: [centerLng, centerLat],
        zoom: 13,
        speed: 1.2,
        curve: 1,
        easing(t) {
          return t;
        }
      });

      // 援ш컙 ?뺣낫 ?앹뾽 ?쒖떆
      const direction = segment.isBranch ? 
        (segment.direction === 'up' ? '?묒＜諛⑺뼢' : '?뚰쓽諛⑺뼢') :
        (segment.direction === 'up' ? '?ъ쿇諛⑺뼢' : '援щ━諛⑺뼢');

      const routeType = segment.isBranch ? '吏?? : '蹂몄꽑';

      const popup = new window.maplibregl.Popup({
        closeButton: true,
        closeOnClick: false
      })
        .setLngLat([centerLng, centerLat])
        .setHTML(`
          <div style="padding: 8px; min-width: 140px;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #333;">${segmentName}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">${routeType} ${direction}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">?띾룄: ${segment.speed || 'N/A'} km/h</div>
          </div>
        `)
        .addTo(map.current);
      currentPopup.current = popup;

      console.log(`SHP 援ш컙 ?ъ빱???꾨즺: ${segmentName}`);
    } else {
      console.log(`IC 醫뚰몴瑜?李얠쓣 ???놁쓬: ${startIC} ?먮뒗 ${endIC}`);
    }
  };

  // MOCK ?곗씠???멸렇癒쇳듃 ?ъ빱???⑥닔
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

      // ?앹뾽 ?쒖떆
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

  // SHP ?곗씠?곗뿉???뚰넻?뺣낫 異붿텧 諛?LinearDiagram???꾨떖
  // 援ъ껜?곸씤 ?띾룄 ?곗씠???⑥닔
  const getSpecificSpeed = (props, route, direction) => {
    // ?낅뜲?댄듃??蹂몄꽑 援ш컙蹂??띾룄 ?곗씠??
    const mainSpeeds = {
      down: [72, 90, 38, 70, 87, 50, 80, 22, 75, 65], // ?섑뻾
      up: [83, 32, 55, 78, 92, 28, 77, 60, 83, 40]    // ?곹뻾
    };
    
    // ?낅뜲?댄듃??吏??援ш컙蹂??띾룄 ?곗씠??
    const branchSpeeds = {
      down: [36, 79], // ?섑뻾
      up: [58, 82]    // ?곹뻾
    };
    
    // link_sqno瑜?湲곕컲?쇰줈 援ш컙 ?몃뜳??寃곗젙 (???뺥솗??留ㅽ븨)
    let segmentIndex = 0;
    
    if (props.link_sqno) {
      // link_sqno媛 1遺???쒖옉?쒕떎硫?0遺???쒖옉?섎뒗 ?몃뜳?ㅻ줈 蹂??
      segmentIndex = Math.max(0, parseInt(props.link_sqno) - 1);
      
      // ?붾쾭源? 紐⑤뱺 援ш컙 ?몃뜳???뺣낫 異쒕젰
      console.log(`?뵇 援ш컙 留ㅽ븨: link_sqno=${props.link_sqno}, segmentIndex=${segmentIndex}, route=${route}, direction=${direction}`);
    } else if (props.link_id) {
      // link_id?먯꽌 ?レ옄 異붿텧?섏뿬 ?몃뜳??寃곗젙
      const numericPart = props.link_id.replace(/[^0-9]/g, '');
      segmentIndex = parseInt(numericPart) % 10; // 0-9 踰붿쐞濡??뺢퇋??
      console.log(`?뵇 link_id 湲곕컲 留ㅽ븨: link_id=${props.link_id}, segmentIndex=${segmentIndex}`);
    }
    
    // 踰붿쐞 泥댄겕
    if (route === 'main') {
      segmentIndex = Math.min(segmentIndex, mainSpeeds[direction].length - 1);
      return mainSpeeds[direction][segmentIndex];
    } else {
      segmentIndex = Math.min(segmentIndex, branchSpeeds[direction].length - 1);
      return branchSpeeds[direction][segmentIndex];
    }
  };

  const extractTrafficDataFromSHP = (processedData, connectedData) => {
    console.log('?슗 SHP ?곗씠?곗뿉???뚰넻?뺣낫 異붿텧 以?..');
    
    try {
      const trafficSegments = [];
      let mainDownIndex = 0, mainUpIndex = 0, branchDownIndex = 0, branchUpIndex = 0;
      
      // connectedData??features???뚰넻?뺣낫 異붽??섍퀬 processedData?먮룄 諛섏쁺
      connectedData.features.forEach((connectedFeature, index) => {
        if (connectedFeature.geometry.type === 'LineString' && connectedFeature.properties) {
          const props = connectedFeature.properties;
          
          // 泥섏쓬 紐?媛?feature???띿꽦?ㅼ쓣 肄섏넄??異쒕젰 (?붾쾭源낆슜)
          if (index < 3) {
            console.log(`?뵇 SHP ?곗씠??feature ${index} ?띿꽦:`, props);
          }
          
          // route 諛?direction 遺꾨쪟 (SHP ?곗씠???띿꽦 湲곕컲)
          let route = 'main'; // 湲곕낯媛?
          let direction = 'up'; // 湲곕낯媛?
          
          // SHP ?곗씠?곗쓽 ?띿꽦???뺤씤?댁꽌 蹂몄꽑/吏??諛????섑뻾 援щ텇
          if (props.link_id) {
            const linkId = props.link_id;
            
            // link_id瑜?湲곕컲?쇰줈 蹂몄꽑/吏??援щ텇
            if (typeof linkId === 'string') {
              // 'LK10006000' ?뺥깭?먯꽌 ?レ옄 遺遺꾩쓣 ?뺤씤
              const numericPart = linkId.replace(/[^0-9]/g, '');
              if (numericPart && parseInt(numericPart) > 100000) {
                route = 'branch'; // ???レ옄??吏?좎쑝濡??먮떒
              }
            }
          }
          
          // 諛⑺뼢 援щ텇 (SHP ?뚯씪??諛⑺뼢 ?뺣낫媛 ?덈떎硫??쒖슜)
          // ?쇰컲?곸씤 諛⑺뼢 ?띿꽦紐낅뱾???뺤씤
          if (props.direction || props.dir || props.way || props.side) {
            const dir = props.direction || props.dir || props.way || props.side;
            if (typeof dir === 'string') {
              if (dir.toLowerCase().includes('down') || dir.toLowerCase().includes('?섑뻾') || dir === '0') {
                direction = 'down';
              } else if (dir.toLowerCase().includes('up') || dir.toLowerCase().includes('?곹뻾') || dir === '1') {
                direction = 'up';
              }
            } else if (typeof dir === 'number') {
              direction = dir === 0 ? 'down' : 'up';
            }
          } else {
            // 諛⑺뼢 ?뺣낫媛 ?놁쑝硫?link_sqno???ㅻⅨ ?띿꽦?쇰줈 異붿젙
            if (props.link_sqno) {
              const sqno = parseInt(props.link_sqno);
              direction = sqno % 2 === 0 ? 'down' : 'up';
            }
          }
          
          // 泥섏쓬 紐?媛?feature??遺꾨쪟 寃곌낵瑜?肄섏넄??異쒕젰 (?붾쾭源낆슜)
          if (index < 3) {
            console.log(`?뵇 feature ${index} 遺꾨쪟:`, { 
              linkId: props.link_id, 
              link_sqno: props.link_sqno,
              route, 
              direction,
              allProps: props 
            });
          }
          
          // 援ъ껜?곸씤 ?뚰넻?뺣낫 ?곗씠???곸슜 (?쒖감?곸쑝濡??좊떦)
          let speed, status, color;
          
          // ?낅뜲?댄듃???띾룄 ?곗씠??
          const mainSpeeds = {
            down: [72, 90, 38, 70, 87, 50, 80, 22, 75, 65], // 蹂몄꽑 ?섑뻾
            up: [83, 32, 55, 78, 92, 28, 77, 60, 83, 40]    // 蹂몄꽑 ?곹뻾
          };
          const branchSpeeds = {
            down: [36, 79], // 吏???섑뻾
            up: [58, 82]    // 吏???곹뻾
          };
          
          // ?쒖감?곸쑝濡??띾룄 ?좊떦
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
          
          // ?띾룄???곕Ⅸ ?곹깭? ?됱긽 寃곗젙
          if (speed < 40) {
            status = 'congested';
            color = '#e53935'; // ?뺤껜 (鍮④컯)
          } else if (speed < 80) {
            status = 'slow';
            color = '#ffc107'; // ?쒗뻾 (amber)
          } else {
            status = 'smooth';
            color = '#00ff00'; // ?먰솢 (珥덈줉)
          }
          
          // ?붾쾭源? ?좊떦???띾룄 ?뺣낫 異쒕젰
          console.log(`?슗 ?띾룄 ?좊떦: route=${route}, direction=${direction}, speed=${speed}km/h, status=${status}, color=${color}`);
          
          // connectedData??feature???뚰넻?뺣낫 諛?route, direction 異붽?
          connectedFeature.properties.status = status;
          connectedFeature.properties.speed = speed;
          connectedFeature.properties.color = color;
          connectedFeature.properties.route = route;
          connectedFeature.properties.direction = direction;
          
          // processedData???대떦 feature?먮룄 ?뚰넻?뺣낫 諛?route, direction 異붽?
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
            color: color, // ?됱긽 ?뺣낫???ы븿
            route: route, // ?꾩뿉??遺꾨쪟??route ?ъ슜
            direction: direction, // ?꾩뿉??遺꾨쪟??direction ?ъ슜
            linkId: props.link_id, // SHP ?뚯씪???먮낯 link_id
            linkSqno: props.link_sqno // SHP ?뚯씪???먮낯 link_sqno
          };
          trafficSegments.push(segment);
        }
      });
      
      console.log('?뱤 異붿텧???뚰넻?뺣낫 ?멸렇癒쇳듃:', trafficSegments.length, '媛?);
      
      // LinearDiagram???꾨떖
      if (onTrafficDataUpdate) {
        onTrafficDataUpdate(trafficSegments);
        console.log('??LinearDiagram???뚰넻?뺣낫 ?꾨떖 ?꾨즺');
      }
      
      // ?대? ?곹깭?먮룄 ???
      setTrafficData(trafficSegments);
      
    } catch (error) {
      console.error('???뚰넻?뺣낫 異붿텧 ?ㅻ쪟:', error);
    }
  };

  const initializeMap = () => {
    if (map.current) return; // ?대? 珥덇린?붾맂 寃쎌슦 以묐났 ?ㅽ뻾 諛⑹?

    try {
    // MapLibre 珥덇린?? bearing=-90 (諛섏떆怨꾨갑??90??
      map.current = new window.maplibregl.Map({
      container: mapContainer.current,
      // MapTiler ?ㅽ????ъ슜
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: [127.15, 37.76],
      zoom: 10,
      bearing: -90, // ??諛섏떆怨꾨갑??90째 (遺곸そ???붾㈃ ?쇱そ)
      pitch: 0,
      attributionControl: true
    });

    // ?ㅻ퉬寃뚯씠??而⑦듃濡?異붽? (?뚯쟾 踰꾪듉 ?쒓굅)
      map.current.addControl(new window.maplibregl.NavigationControl({ 
      showCompass: false, // ?뚯쟾 踰꾪듉 ?쒓굅
      showZoom: true 
    }));

    // ?ㅽ???濡쒕뱶 ?꾩뿉????踰???怨좎젙(?ㅻⅨ 肄붾뱶媛 ??쑝硫??ㅼ떆 ?≪븘以?
    map.current.on('styledata', () => {
      // ?ㅽ??쇱씠 媛덉븘?쇱썙?몃룄 ??긽 ?숈そ???꾧? ?섎룄濡?蹂댁젙
      if (map.current.getBearing() !== -90) {
        map.current.setBearing(-90);
      }
    });

    // 吏??濡쒕뱶 ?꾨즺 ???덉씠??異붽?
    map.current.on('load', () => {
      // ?곷Ц ?쇰꺼 ?④린湲?
      hideEnglishLabels();
      
      // IC 移??대?吏 ?앹꽦 諛?濡쒕뱶 (?먰삎) - ?띿뒪?몃퀎濡??앹꽦
      const createChipImage = (text) => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // ?먰삎 諛곌꼍 洹몃씪?붿뼵??
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        
        // ?멸낸??洹몃씪?붿뼵??
        const borderGradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        borderGradient.addColorStop(0, '#4a90e2');
        borderGradient.addColorStop(0.5, '#87ceeb');
        borderGradient.addColorStop(1, '#4a90e2');
        
        // ?멸낸????洹몃━湲?
        ctx.beginPath();
        ctx.arc(16, 16, 15, 0, 2 * Math.PI);
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 諛곌꼍 ??梨꾩슦湲?
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // ?섏씠?쇱씠???④낵 (?먰삎)
        const highlightGradient = ctx.createRadialGradient(12, 12, 0, 12, 12, 8);
        highlightGradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        highlightGradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(12, 12, 8, 0, 2 * Math.PI);
        ctx.fillStyle = highlightGradient;
        ctx.fill();
        
        // ?띿뒪??(留ㅺ컻蹂?섎줈 諛쏆? ?띿뒪???ъ슜)
        ctx.fillStyle = '#87ceeb';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(135, 206, 235, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(text, 16, 16);
        
        return canvas.toDataURL();
      };
      
      // 媛?IC蹂꾨줈 ?ㅻⅨ 移??대?吏 ?앹꽦 諛?濡쒕뱶
      const chipTexts = ['IC', 'TG', 'JCT'];
      let loadedImages = 0;
      const totalImages = chipTexts.length;
      
      chipTexts.forEach(text => {
        const chipImageData = createChipImage(text);
        map.current.loadImage(chipImageData, (error, image) => {
          if (error) throw error;
          map.current.addImage(`ic-chip-${text}`, image);
          loadedImages++;
          
          // 紐⑤뱺 ?대?吏媛 濡쒕뱶?섎㈃ ?덉씠??異붽?
          if (loadedImages === totalImages) {
      addTrafficLayers();
      addKoreanLabels();
            addLineInteractions();
            
            // MOCK ?곗씠???뚮뜑留곸? LinearDiagram?먯꽌留?泥섎━
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
      console.error('吏??珥덇린??以??ㅻ쪟:', error);
    }
  };

    // 而댄룷?뚰듃 ?몃쭏?댄듃 ??吏???뺣━
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // SHP ?뚯씪??濡쒕뱶?섍퀬 GeoJSON?쇰줈 蹂?섑븯???⑥닔
  const loadShapefile = async () => {
    try {
      console.log('SHP ?뚯씪 濡쒕뵫 ?쒖옉...');
      
      // SHP ?뚯씪 寃쎈줈 (public ?대뜑???꾩튂)
      const shapefileUrl = '/t_tgpe_vds_pnt_link_01r_geom.zip';
      console.log('SHP ?뚯씪 URL:', shapefileUrl);
      
      // fetch濡?ZIP ?뚯씪 ?ㅼ슫濡쒕뱶
      const response = await fetch(shapefileUrl);
      console.log('HTTP ?묐떟 ?곹깭:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const zipBuffer = await response.arrayBuffer();
      console.log('ZIP ?뚯씪 ?ㅼ슫濡쒕뱶 ?꾨즺, ?ш린:', zipBuffer.byteLength);
      
      if (zipBuffer.byteLength === 0) {
        throw new Error('ZIP ?뚯씪??鍮꾩뼱?덉뒿?덈떎');
      }
      
      // shpjs濡?SHP ?뚯씪 ?뚯떛
      console.log('shpjs ?몄텧 以?..');
      const geojson = await shp(zipBuffer);
      console.log('GeoJSON 蹂???꾨즺:', geojson);
      
      // 醫뚰몴怨??뺤씤 諛?蹂??
      if (geojson && geojson.features && geojson.features.length > 0) {
        console.log('泥?踰덉㎏ feature 醫뚰몴:', geojson.features[0].geometry.coordinates[0]);
        
        // 醫뚰몴媛 UTM?대굹 ?ㅻⅨ 醫뚰몴怨꾩씤吏 ?뺤씤 (寃쎈룄媛 127 ?뺣룄, ?꾨룄媛 37 ?뺣룄?ъ빞 ??
        const firstCoord = geojson.features[0].geometry.coordinates[0][0];
        if (Array.isArray(firstCoord)) {
          const [lng, lat] = firstCoord;
          console.log(`醫뚰몴 ?뺤씤 - 寃쎈룄: ${lng}, ?꾨룄: ${lat}`);
          
          // 醫뚰몴媛 WGS84 踰붿쐞媛 ?꾨땶 寃쎌슦 (?? UTM 醫뚰몴怨?
          if (lng > 180 || lng < -180 || lat > 90 || lat < -90) {
            console.log('醫뚰몴怨?蹂?섏씠 ?꾩슂?????덉뒿?덈떎.');
            // ?ш린??醫뚰몴 蹂??濡쒖쭅??異붽??????덉뒿?덈떎
          }
        }
      }
      
      if (!geojson || !geojson.features) {
        throw new Error('GeoJSON 蹂???ㅽ뙣: features媛 ?놁뒿?덈떎');
      }
      
      console.log('GeoJSON features 媛쒖닔:', geojson.features.length);
      console.log('泥?踰덉㎏ feature ?덉떆:', geojson.features[0]);
      
      // SHP ?뚯씪???꾩껜 bounds 怨꾩궛
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
      console.log(`SHP ?뚯씪 ?꾩껜 bounds:`, bounds.toArray());
      console.log(`珥?醫뚰몴 媛쒖닔: ${coordCount}`);
      
      // ?딆뼱吏??쇱씤 ?곌껐 鍮꾪솢?깊솕 - ?먮낯 ?곗씠??洹몃?濡??ъ슜
      console.log('?먮낯 ?곗씠??洹몃?濡??ъ슜 (?쇱씤 ?곌껐 ?덊븿)');
      
      return { geojson: geojson, connectedGeoJSON: geojson };
    } catch (error) {
      console.error('SHP ?뚯씪 濡쒕뵫 ?ㅽ뙣:', error);
      console.error('?ㅻ쪟 ?ㅽ깮:', error.stack);
      return null;
    }
  };

  // ?딆뼱吏??쇱씤?ㅼ쓣 ?곌껐?섎뒗 ?⑥닔
  const connectBrokenLines = (geojson) => {
    if (!geojson || !geojson.features) return geojson;

    const features = [...geojson.features];
    const connectedFeatures = [];
    const maxDistance = 0.001; // ??100誘명꽣 嫄곕━ ?댁뿉???곌껐 (寃쎈룄/?꾨룄 ?⑥쐞)

    console.log(`?먮낯 features 媛쒖닔: ${features.length}`);

    // 嫄곕━ 怨꾩궛 ?⑥닔 (媛꾨떒???좏겢由щ뱶 嫄곕━)
    const calculateDistance = (coord1, coord2) => {
      const [lng1, lat1] = coord1;
      const [lng2, lat2] = coord2;
      return Math.sqrt(Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2));
    };

    // ?쇱씤 ?앹젏?ㅼ쓣 李얠븘???곌껐 媛?ν븳吏 ?뺤씤
    while (features.length > 0) {
      const currentFeature = features.shift();
      let currentLine = [...currentFeature.geometry.coordinates];
      let connected = true;

      while (connected) {
        connected = false;
        
        // ?꾩옱 ?쇱씤???앹젏??
        const startPoint = currentLine[0];
        const endPoint = currentLine[currentLine.length - 1];

        // ?ㅻⅨ features? ?곌껐 媛?ν븳吏 ?뺤씤
        for (let i = features.length - 1; i >= 0; i--) {
          const otherFeature = features[i];
          const otherStart = otherFeature.geometry.coordinates[0];
          const otherEnd = otherFeature.geometry.coordinates[otherFeature.geometry.coordinates.length - 1];

          let shouldConnect = false;
          let newCoords = null;

          // endPoint? otherStart媛 媛源뚯슫 寃쎌슦
          if (calculateDistance(endPoint, otherStart) < maxDistance) {
            shouldConnect = true;
            newCoords = currentLine.concat(otherFeature.geometry.coordinates);
          }
          // endPoint? otherEnd媛 媛源뚯슫 寃쎌슦 (??갑???곌껐)
          else if (calculateDistance(endPoint, otherEnd) < maxDistance) {
            shouldConnect = true;
            newCoords = currentLine.concat([...otherFeature.geometry.coordinates].reverse());
          }
          // startPoint? otherEnd媛 媛源뚯슫 寃쎌슦
          else if (calculateDistance(startPoint, otherEnd) < maxDistance) {
            shouldConnect = true;
            newCoords = [...otherFeature.geometry.coordinates].concat(currentLine);
          }
          // startPoint? otherStart媛 媛源뚯슫 寃쎌슦 (??갑???곌껐)
          else if (calculateDistance(startPoint, otherStart) < maxDistance) {
            shouldConnect = true;
            newCoords = [...otherFeature.geometry.coordinates].reverse().concat(currentLine);
          }

          if (shouldConnect && newCoords) {
            // ?곌껐???쇱씤?쇰줈 ?낅뜲?댄듃
            currentLine = newCoords;
            features.splice(i, 1); // ?ъ슜??feature ?쒓굅
            connected = true;
            console.log(`?쇱씤 ?곌껐?? ${currentFeature.properties?.id || 'unknown'} + ${otherFeature.properties?.id || 'unknown'}`);
            break;
          }
        }
      }

      // ?곌껐???쇱씤???덈줈??feature濡?異붽?
      connectedFeatures.push({
        ...currentFeature,
        geometry: {
          ...currentFeature.geometry,
          coordinates: currentLine
        }
      });
    }

    console.log(`?곌껐 ??features 媛쒖닔: ${connectedFeatures.length}`);
    
    return {
      ...geojson,
      features: connectedFeatures
    };
  };

  // SHP ?쇱씤???곹뻾/?섑뻾?쇰줈 遺꾨━?섎뒗 ?⑥닔
  const splitLinesUpDown = (geojson) => {
    if (!geojson || !geojson.features) return geojson;

    const upFeatures = [];
    const downFeatures = [];
    const branchUpFeatures = [];
    const branchDownFeatures = [];

    console.log(`遺꾨━??features 媛쒖닔: ${geojson.features.length}`);

    geojson.features.forEach((feature, index) => {
      if (feature.geometry.type === 'LineString') {
        const coords = feature.geometry.coordinates;
        
        // ?쇱씤??吏?좎씤吏 蹂몄꽑?몄? ?먮떒 (?묒＜ 諛⑺뼢?쇰줈 媛?붿? ?뺤씤)
        const isBranchLine = isBranchRoute(coords);
        
        // ?곹뻾 ?쇱씤 (?먮낯 醫뚰몴 + ?ㅽ봽??
        const upCoords = coords.map(coord => [
          coord[0] + 0.0001, // 寃쎈룄 ?ㅽ봽??(?숈そ?쇰줈 ?쎄컙 ?대룞)
          coord[1] + 0.00005  // ?꾨룄 ?ㅽ봽??(遺곸そ?쇰줈 ?쎄컙 ?대룞)
        ]);

        // ?섑뻾 ?쇱씤 (?먮낯 醫뚰몴 - ?ㅽ봽??
        const downCoords = coords.map(coord => [
          coord[0] - 0.0001, // 寃쎈룄 ?ㅽ봽??(?쒖そ?쇰줈 ?쎄컙 ?대룞)
          coord[1] - 0.00005  // ?꾨룄 ?ㅽ봽??(?⑥そ?쇰줈 ?쎄컙 ?대룞)
        ]);

        // ?곹뻾 feature ?앹꽦
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

        // ?섑뻾 feature ?앹꽦
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

        // 吏?좎씤吏 蹂몄꽑?몄????곕씪 遺꾨쪟
        if (isBranchLine) {
          branchUpFeatures.push(upFeature);
          branchDownFeatures.push(downFeature);
        } else {
          upFeatures.push(upFeature);
          downFeatures.push(downFeature);
        }
      }
    });

    console.log(`蹂몄꽑 ?곹뻾: ${upFeatures.length}媛? 蹂몄꽑 ?섑뻾: ${downFeatures.length}媛?);
    console.log(`吏???곹뻾: ${branchUpFeatures.length}媛? 吏???섑뻾: ${branchDownFeatures.length}媛?);

    // 紐⑤뱺 feature瑜??섎굹??FeatureCollection?쇰줈 ?⑹튂湲?
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

  // 吏?좎씤吏 ?먮떒?섎뒗 ?⑥닔 (?묒＜ 諛⑺뼢?쇰줈 媛?붿? ?뺤씤)
  const isBranchRoute = (coords) => {
    if (!coords || coords.length < 2) return false;
    
    const startCoord = coords[0];
    const endCoord = coords[coords.length - 1];
    
    // ?묒＜ 諛⑺뼢? ?쒖そ?쇰줈 媛??寃쏀뼢???덉쓬 (寃쎈룄媛 媛먯냼)
    // ?뚰쓽JCT 洹쇱쿂?먯꽌 ?쒖옉?댁꽌 ?묒＜ 諛⑺뼢?쇰줈 媛?붿? ?뺤씤
    const soheulJCX = 127.139683; // ?뚰쓽JCT 寃쎈룄
    const soheulJCY = 37.813561; // ?뚰쓽JCT ?꾨룄
    
    const startDistance = Math.sqrt(
      Math.pow(startCoord[0] - soheulJCX, 2) + 
      Math.pow(startCoord[1] - soheulJCY, 2)
    );
    
    const endDistance = Math.sqrt(
      Math.pow(endCoord[0] - soheulJCX, 2) + 
      Math.pow(endCoord[1] - soheulJCY, 2)
    );
    
    // ?뚰쓽JCT 洹쇱쿂?먯꽌 ?쒖옉?섍퀬 ?쒖そ?쇰줈 媛??寃쎌슦 吏?좎쑝濡??먮떒
    const isNearSoheulJC = startDistance < 0.01; // ??1km ??
    const isGoingWest = endCoord[0] < startCoord[0]; // ?쒖そ?쇰줈 ?대룞
    
    return isNearSoheulJC && isGoingWest;
  };

