
  // SHP ?뚯씪??IC ?ъ씤??異붽? ?⑥닔
  const addICPointsForShapefile = () => {
    if (!map.current) return;
    
    try {
      console.log('SHP ?뚯씪??IC ?ъ씤??異붽? 以?..');
      
      // IC ?ъ씤???곗씠???앹꽦
      const icPointFeatures = [
        ...MAINLINE.map(p => ({ 
          type: 'Feature', 
          properties: { id: p.id, name: p.id, kind: 'main', chipText: p.chipText }, 
          geometry: { type: 'Point', coordinates: [p.x, p.y] } 
        })),
        ...BRANCH.filter(p => p.id !== '?뚰쓽JCT')
        .map(p => ({ 
          type: 'Feature', 
          properties: { id: p.id, name: p.id, kind: 'branch', chipText: p.chipText }, 
          geometry: { type: 'Point', coordinates: [p.x, p.y] } 
        }))
      ];

      // IC ?ъ씤???뚯뒪 異붽?
      if (!map.current.getSource('ic-points-shapefile')) {
        map.current.addSource('ic-points-shapefile', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: icPointFeatures }
        });
      }

      // IC ?먰삎 留덉빱
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

      // IC ?쇰꺼
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
      
      console.log('SHP ?뚯씪??IC ?ъ씤??異붽? ?꾨즺');
    } catch (error) {
      console.error('SHP ?뚯씪??IC ?ъ씤??異붽? 以??ㅻ쪟:', error);
    }
  };

  const addLineInteractions = () => {
    // ?곹뻾/?섑뻾 ?쇱씤 ?대┃ ?대깽??諛??댄똻
    const popup = new window.maplibregl.Popup({
      closeButton: true,
      closeOnClick: false
    });
    
    // SHP ?쇱씤 ?대┃ ?대깽??(SHP ?뚯씪??濡쒕뱶??寃쎌슦)
    if (map.current.getLayer('shapefile-main-up')) {
      console.log('SHP ?쇱씤 ?대┃ ?대깽???깅줉 以?..');
      
      // 紐⑤뱺 SHP ?쇱씤 ?덉씠?댁뿉 ?대┃ ?대깽??異붽?
      const shpLayers = ['shapefile-main-up', 'shapefile-main-down', 'shapefile-branch-up', 'shapefile-branch-down'];
      
      shpLayers.forEach(layerId => {
        map.current.on('click', layerId, (e) => {
          const feature = e.features[0];
          const props = feature.properties;
          
          const direction = props.direction === 'up' ? '?곹뻾' : '?섑뻾';
          const route = props.route === 'branch' ? '吏?? : '蹂몄꽑';
          
          popup.setLngLat(e.lngLat)
            .setHTML(`
              <div style="padding: 8px; min-width: 120px;">
                <div style="font-weight: bold; margin-bottom: 4px; color: #333;">${route} ${direction}</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 2px;">?곹깭: ${props.status || 'unknown'}</div>
                <div style="font-size: 12px; color: #333; font-weight: bold;">ID: ${props.id || 'N/A'}</div>
              </div>
            `)
            .addTo(map.current);
        });

        // 留덉슦???ㅻ쾭 ?대깽??
        map.current.on('mouseenter', layerId, () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', layerId, () => {
          map.current.getCanvas().style.cursor = '';
        });
      });
      
      console.log('SHP ?쇱씤 ?대┃ ?대깽???깅줉 ?꾨즺');
      return; // SHP ?쇱씤???덉쑝硫??ш린??醫낅즺
    }
    
    console.log('MOCK ?곗씠???쇱씤 ?대┃ ?대깽???깅줉 以?..');
    
    // ?곹뻾 ?쇱씤 ?대┃ ?대깽??
    map.current.on('click', 'segments-line-up', (e) => {
      const feature = e.features[0];
      const props = feature.properties;
      
      popup.setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${props.name} (?곹뻾)</h3>
            <p style="margin: 4px 0;"><strong>?띾룄:</strong> ${props.speed} km/h</p>
            <p style="margin: 4px 0;"><strong>?뚯슂?쒓컙:</strong> ${props.travelTime}遺?/p>
            <p style="margin: 4px 0;"><strong>諛⑺뼢:</strong> ?곹뻾</p>
          </div>
        `)
        .addTo(map.current);
    });
    
    // ?섑뻾 ?쇱씤 ?대┃ ?대깽??
    map.current.on('click', 'segments-line-down', (e) => {
      const feature = e.features[0];
      const props = feature.properties;
      
      popup.setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${props.name} (?섑뻾)</h3>
            <p style="margin: 4px 0;"><strong>?띾룄:</strong> ${props.speed} km/h</p>
            <p style="margin: 4px 0;"><strong>?뚯슂?쒓컙:</strong> ${props.travelTime}遺?/p>
            <p style="margin: 4px 0;"><strong>諛⑺뼢:</strong> ?섑뻾</p>
          </div>
        `)
        .addTo(map.current);
    });
    
    // 留덉슦???ㅻ쾭 ??而ㅼ꽌 蹂寃?
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
    
    // 吏???곹뻾 ?쇱씤 ?대┃ ?대깽??
    map.current.on('click', 'branch-line-up', (e) => {
      const feature = e.features[0];
      const props = feature.properties;
      
      popup.setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${props.name} (吏???곹뻾)</h3>
            <p style="margin: 4px 0;"><strong>?띾룄:</strong> ${props.speed} km/h</p>
            <p style="margin: 4px 0;"><strong>諛⑺뼢:</strong> ?묒＜諛⑺뼢 (?곹뻾)</p>
            <p style="margin: 4px 0;"><strong>?몄꽑:</strong> 吏??/p>
          </div>
        `)
        .addTo(map.current);
    });
    
    // 吏???섑뻾 ?쇱씤 ?대┃ ?대깽??
    map.current.on('click', 'branch-line-down', (e) => {
      const feature = e.features[0];
      const props = feature.properties;
      
      popup.setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${props.name} (吏???섑뻾)</h3>
            <p style="margin: 4px 0;"><strong>?띾룄:</strong> ${props.speed} km/h</p>
            <p style="margin: 4px 0;"><strong>諛⑺뼢:</strong> ?묒＜諛⑺뼢 (?섑뻾)</p>
            <p style="margin: 4px 0;"><strong>?몄꽑:</strong> 吏??/p>
          </div>
        `)
        .addTo(map.current);
    });
    
    // 吏???쇱씤 留덉슦???ㅻ쾭 ?대깽??
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
    
    console.log('MOCK ?곗씠???쇱씤 ?대┃ ?대깽???깅줉 ?꾨즺');
  };

  // === 嫄곕━(km)
  const haversine = (lng1, lat1, lng2, lat2) => {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  // MOCK ?곗씠???뚮뜑留곸? LinearDiagram?먯꽌留?泥섎━
  
  const findSegEl = (row, idPart) => {
    return [...row.querySelectorAll('.seg')].find(el => (el.dataset.seg || '').includes(idPart)) || null;
  };

  // IC 紐낆묶??釉붾줉 寃쎄퀎??留욎떠 諛곗튂
  const positionICLabels = () => {
    try {
      const icLabels = document.querySelectorAll('.ic-label');
      const baseLeft = document.getElementById('linear').getBoundingClientRect().left;
      
      // 蹂몄꽑 釉붾줉??媛?몄삤湲?
      const mainSegs = routeMainDown.querySelectorAll('.seg');
      const branchSegs = routeBranchDown.querySelectorAll('.seg');
      
      // IC 紐낆묶怨?釉붾줉 留ㅽ븨
      const icNames = [
        '?④뎄由촇C', '以묐옉IC', '媛덈ℓ?숆뎄由뎆G', '?⑤퀎?퀹C', '?숈쓽?뺣?IC', 
        '誘쇰씫IC', '?뚰쓽IC', '?뚰쓽JCT', '?좊떒IC', '?ъ쿇IC', '?좊턿IC',
        '?뚰쓽JCT', '?μ젙IC', '?묒＜IC'
      ];
      
      // ?섎뱶肄붾뵫?쇰줈 ?뺥솗??IC ?꾩튂 吏??
      icLabels.forEach((label, index) => {
        if (index < icNames.length) {
          const icName = icNames[index];
          let x = 0;
          
          // 蹂몄꽑 IC??(index 0-10)
          if (index === 0) {
            // ?④뎄由촇C - 泥?踰덉㎏ 釉붾줉 ?쒖옉
            const firstSeg = mainSegs[0];
            const rect = firstSeg.getBoundingClientRect();
            x = (rect.left - baseLeft);
          } else if (index === 1) {
            // 以묐옉IC - 泥?踰덉㎏? ??踰덉㎏ 釉붾줉 寃쎄퀎
            const firstSeg = mainSegs[0];
            const secondSeg = mainSegs[1];
            const firstRect = firstSeg.getBoundingClientRect();
            const secondRect = secondSeg.getBoundingClientRect();
            x = (firstRect.right - baseLeft) + (secondRect.left - firstRect.right) / 2;
          } else if (index === 2) {
            // 媛덈ℓ?숆뎄由뎆G - ??踰덉㎏? ??踰덉㎏ 釉붾줉 寃쎄퀎
            const secondSeg = mainSegs[1];
            const thirdSeg = mainSegs[2];
            const secondRect = secondSeg.getBoundingClientRect();
            const thirdRect = thirdSeg.getBoundingClientRect();
            x = (secondRect.right - baseLeft) + (thirdRect.left - secondRect.right) / 2;
          } else if (index === 3) {
            // ?⑤퀎?퀹C - ??踰덉㎏? ??踰덉㎏ 釉붾줉 寃쎄퀎
            const thirdSeg = mainSegs[2];
            const fourthSeg = mainSegs[3];
            const thirdRect = thirdSeg.getBoundingClientRect();
            const fourthRect = fourthSeg.getBoundingClientRect();
            x = (thirdRect.right - baseLeft) + (fourthRect.left - thirdRect.right) / 2;
          } else if (index === 4) {
            // ?숈쓽?뺣?IC - ??踰덉㎏? ?ㅼ꽢 踰덉㎏ 釉붾줉 寃쎄퀎
            const fourthSeg = mainSegs[3];
            const fifthSeg = mainSegs[4];
            const fourthRect = fourthSeg.getBoundingClientRect();
            const fifthRect = fifthSeg.getBoundingClientRect();
            x = (fourthRect.right - baseLeft) + (fifthRect.left - fourthRect.right) / 2;
          } else if (index === 5) {
            // 誘쇰씫IC - ?ㅼ꽢 踰덉㎏? ?ъ꽢 踰덉㎏ 釉붾줉 寃쎄퀎
            const fifthSeg = mainSegs[4];
            const sixthSeg = mainSegs[5];
            const fifthRect = fifthSeg.getBoundingClientRect();
            const sixthRect = sixthSeg.getBoundingClientRect();
            x = (fifthRect.right - baseLeft) + (sixthRect.left - fifthRect.right) / 2;
          } else if (index === 6) {
            // ?뚰쓽IC - ?ъ꽢 踰덉㎏? ?쇨낢 踰덉㎏ 釉붾줉 寃쎄퀎
            const sixthSeg = mainSegs[5];
            const seventhSeg = mainSegs[6];
            const sixthRect = sixthSeg.getBoundingClientRect();
            const seventhRect = seventhSeg.getBoundingClientRect();
            x = (sixthRect.right - baseLeft) + (seventhRect.left - sixthRect.right) / 2;
          } else if (index === 7) {
            // ?뚰쓽JCT - ?쇨낢 踰덉㎏ 釉붾줉???ㅻⅨ履?寃쎄퀎硫?(??移??쇱そ?쇰줈 ?대룞)
            const seventhSeg = mainSegs[6];
            const rect = seventhSeg.getBoundingClientRect();
            x = (rect.right - baseLeft);
          } else if (index === 8) {
            // ?좊떒IC - ?щ뜜 踰덉㎏ 釉붾줉???ㅻⅨ履?寃쎄퀎硫?(??移??쇱そ?쇰줈 ?대룞)
            const eighthSeg = mainSegs[7];
            const rect = eighthSeg.getBoundingClientRect();
            x = (rect.right - baseLeft);
          } else if (index === 9) {
            // ?ъ쿇IC - ?꾪솄 踰덉㎏ 釉붾줉???ㅻⅨ履?寃쎄퀎硫?(??移??쇱そ?쇰줈 ?대룞)
            const ninthSeg = mainSegs[8];
            const rect = ninthSeg.getBoundingClientRect();
            x = (rect.right - baseLeft);
          } else if (index === 10) {
            // ?좊턿IC - ??踰덉㎏ 釉붾줉???ㅻⅨ履?寃쎄퀎硫?(??移??쇱そ?쇰줈 ?대룞)
            const tenthSeg = mainSegs[9];
            const rect = tenthSeg.getBoundingClientRect();
            x = (rect.right - baseLeft);
          }
          // 吏??IC??(index 11-13)
          else if (index === 11) {
            // ?뚰쓽JCT - 吏??泥?踰덉㎏ 釉붾줉???쇱そ 寃쎄퀎硫?(以묐났 ?쒓린)
            const firstBranchSeg = branchSegs[0];
            const rect = firstBranchSeg.getBoundingClientRect();
            x = (rect.left - baseLeft);
          } else if (index === 12) {
            // ?μ젙IC - 泥?踰덉㎏? ??踰덉㎏ 吏??釉붾줉??寃쎄퀎硫?
            const firstBranchSeg = branchSegs[0];
            const secondBranchSeg = branchSegs[1];
            const firstRect = firstBranchSeg.getBoundingClientRect();
            const secondRect = secondBranchSeg.getBoundingClientRect();
            x = (firstRect.right - baseLeft) + (secondRect.left - firstRect.right) / 2;
          } else if (index === 13) {
            // ?묒＜IC - ??踰덉㎏ 吏??釉붾줉???ㅻⅨ履?edge
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
      console.error('positionICLabels ?ㅻ쪟:', error);
    }
  };

  // 移?諛곗튂: ?ъ쿇='?ъ쿇IC-?좊턿IC' ?ㅻⅨ履??? ?뚰쓽='?뚰쓽JCT-?μ젙IC' ?쇱そ ??
  const positionChips = () => {
    try {
      // 湲곗?? linear ?뱀뀡??醫뚯륫
      const baseLeft = document.getElementById('linear').getBoundingClientRect().left;

      // ?ъ쿇 移? ?섑뻾 蹂몄꽑??'?ъ쿇IC-?좊턿IC' 釉붾줉 ?ㅻⅨ履???
      const segP = findSegEl(routeMainDown, '?ъ쿇IC-?좊턿IC');
      if (segP) {
        const rP = segP.getBoundingClientRect();
        const gap = 8;
        const xP = (rP.right - baseLeft) + gap;
        chipP.style.left = xP + 'px';
        chipP.style.top = '50%';
      }

      // ?뚰쓽 移? ?섑뻾 吏?좎쓽 '?뚰쓽JCT-?μ젙IC' 釉붾줉 ?쇱そ ??
      const segS = findSegEl(routeBranchDown, '?뚰쓽JCT-?μ젙IC');
      if (segS) {
        const rS = segS.getBoundingClientRect();
        const gap = 8;
        const wS = chipS.offsetWidth;
        const xS = (rS.left - baseLeft) - wS - gap;
        chipS.style.left = xS + 'px';
        chipS.style.top = '50%';
      }

      // 寃뱀묠 諛⑹?: ?ъ쿇(?? ???뚰쓽(?? ?쒖꽌 ?좎?
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
      console.error('positionChips ?ㅻ쪟:', error);
    }
  };

  const addKoreanLabels = () => {
    // 二쇱슂 ?꾩떆/吏???쒓? ?쇰꺼 ?곗씠??
    const koreanLabels = [
      { name: '?쒖슱', coordinates: [126.978, 37.5665], type: 'city' },
      { name: '援щ━??, coordinates: [127.131, 37.5945], type: 'city' },
      { name: '?⑥뼇二쇱떆', coordinates: [127.216, 37.6365], type: 'city' },
      { name: '?ъ쿇??, coordinates: [127.201, 37.8947], type: 'city' },
      { name: '?묒＜??, coordinates: [126.999, 37.7840], type: 'city' },
      { name: '?섏젙遺??, coordinates: [127.047, 37.7381], type: 'city' },
      { name: '以묐옉援?, coordinates: [127.095, 37.6064], type: 'district' },
      { name: '媛뺣룞援?, coordinates: [127.123, 37.5301], type: 'district' },
      { name: '?≫뙆援?, coordinates: [127.105, 37.5145], type: 'district' },
      { name: '愿묒쭊援?, coordinates: [127.082, 37.5384], type: 'district' },
      { name: '?몄썝援?, coordinates: [127.057, 37.6542], type: 'district' },
      { name: '?꾨큺援?, coordinates: [127.047, 37.6688], type: 'district' },
      { name: '?깅턿援?, coordinates: [127.016, 37.5894], type: 'district' },
      { name: '媛뺣턿援?, coordinates: [127.025, 37.6398], type: 'district' },
      { name: '?숇?臾멸뎄', coordinates: [127.059, 37.5744], type: 'district' },
      { name: '?깅룞援?, coordinates: [127.036, 37.5633], type: 'district' },
      { name: '以묎뎄', coordinates: [126.997, 37.5636], type: 'district' },
      { name: '醫낅줈援?, coordinates: [126.978, 37.5735], type: 'district' },
      { name: '??됯뎄', coordinates: [126.930, 37.6028], type: 'district' },
      { name: '?쒕?臾멸뎄', coordinates: [126.936, 37.5791], type: 'district' },
      { name: '留덊룷援?, coordinates: [126.902, 37.5663], type: 'district' },
      { name: '?⑹궛援?, coordinates: [126.978, 37.5384], type: 'district' },
      { name: '?곷벑?ш뎄', coordinates: [126.896, 37.5264], type: 'district' },
      { name: '?숈옉援?, coordinates: [126.939, 37.5124], type: 'district' },
      { name: '愿?낃뎄', coordinates: [126.951, 37.4754], type: 'district' },
      { name: '?쒖큹援?, coordinates: [127.032, 37.4837], type: 'district' },
      { name: '媛뺣궓援?, coordinates: [127.028, 37.5172], type: 'district' },
      { name: '媛뺤꽌援?, coordinates: [126.821, 37.5509], type: 'district' },
      { name: '?묒쿇援?, coordinates: [126.866, 37.5163], type: 'district' },
      { name: '援щ줈援?, coordinates: [126.887, 37.4954], type: 'district' },
      { name: '湲덉쿇援?, coordinates: [126.902, 37.4563], type: 'district' },
      { name: '?곷벑?ш뎄', coordinates: [126.896, 37.5264], type: 'district' }
    ];

    // ?쒓? ?쇰꺼 GeoJSON ?앹꽦
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

    // ?쒓? ?쇰꺼 ?뚯뒪 異붽?
    map.current.addSource('korean-labels', {
      type: 'geojson',
      data: koreanLabelsGeoJSON
    });

    // ?꾩떆 ?쇰꺼 ?덉씠??
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
        'text-pitch-alignment': 'viewport',  // 酉고룷??湲곗??쇰줈 ?띿뒪???뺣젹
        'text-rotation-alignment': 'viewport'  // 酉고룷??湲곗??쇰줈 ?띿뒪???뚯쟾 (吏???뚯쟾怨?臾닿??섍쾶 ?뺤쐞移??좎?)
      },
      paint: {
        'text-color': '#2c3e50',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
        'text-halo-blur': 1
      }
    });

    // 援?援??쇰꺼 ?덉씠??
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
        'text-pitch-alignment': 'viewport',  // 酉고룷??湲곗??쇰줈 ?띿뒪???뺣젹
        'text-rotation-alignment': 'viewport'  // 酉고룷??湲곗??쇰줈 ?띿뒪???뚯쟾 (吏???뚯쟾怨?臾닿??섍쾶 ?뺤쐞移??좎?)
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
      
      {/* ?띾룄 踰붾? */}
      <div className="speed-legend">
        <div className="legend-header" onClick={toggleLegend}>
          <span className="legend-title">?띾룄 踰붾?</span>
          <span className={`legend-arrow ${isLegendCollapsed ? 'rotated' : ''}`}>??/span>
        </div>
        <div className={`legend-content ${isLegendCollapsed ? 'collapsed' : ''}`}>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#e53935' }}></div>
            <span className="legend-text">?뺤껜 (0-40km/h)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ffc107' }}></div>
            <span className="legend-text">?쒗뻾 (40-80km/h)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#00ff00' }}></div>
            <span className="legend-text">?먰솢 (80+km/h)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;
