import React, { useState, useEffect, useRef } from 'react';
import './LinearDiagram.css';

const LinearDiagram = ({ onSegmentSelect, trafficData }) => {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const linearRef = useRef(null);
  const routeMainDownRef = useRef(null);
  const routeBranchDownRef = useRef(null);
  const routeMainUpRef = useRef(null);
  const routeBranchUpRef = useRef(null);

  // IC 좌표 데이터 (원래 HTML과 동일)
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

  // 거리 계산 함수 (원래 HTML과 동일)
  const haversine = (lng1, lat1, lng2, lat2) => {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  // 구간 리스트 만들기 (원래 HTML과 동일)
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

  // 직선도 블록 클릭 핸들러 (원래 HTML과 동일) - 지도 포커싱 기능 포함
  const handleLinearBlockClick = (segmentId, direction, index, isBranch = false) => {
    console.log('🎯 직선도 클릭됨:', { segmentId, direction, index, isBranch });
    setSelectedSegment(segmentId);
    
    // 모든 직선도 블록의 선택 상태 해제
    document.querySelectorAll('.seg').forEach(seg => {
      seg.classList.remove('selected');
    });
    
    // 클릭된 블록 선택 상태 표시
    setTimeout(() => {
      const clickedBlock = document.querySelector(`.seg[data-seg="${segmentId}"][data-direction="${direction}"][data-index="${index}"]`);
      if (clickedBlock) {
        clickedBlock.classList.add('selected');
        console.log('✅ 블록 선택됨:', clickedBlock);
      } else {
        console.log('❌ 블록을 찾을 수 없음:', segmentId, direction, index);
      }
    }, 10);
    
    if (onSegmentSelect) {
      // 실제 속도 데이터 가져오기
      const downSpeeds = [72, 90, 38, 70, 87, 50, 80, 22, 75, 65]; // 본선 하행
      const upSpeeds = [83, 32, 55, 78, 92, 28, 77, 60, 83, 40];   // 본선 상행
      const branchDownSpeeds = [36, 79]; // 지선 하행
      const branchUpSpeeds = [58, 82];   // 지선 상행
      
      // 속도와 상태 결정
      let speed = 60;
      let status = '원활';
      
      if (isBranch) {
        // 지선의 경우 상/하행 속도를 바꿔서 할당 (지도와 동기화)
        if (direction === 'down') {
          // 하행으로 클릭된 것을 상행 속도로 할당
          speed = branchUpSpeeds[index] || 60;
        } else {
          // 상행으로 클릭된 것을 하행 속도로 할당
          speed = branchDownSpeeds[index] || 60;
        }
      } else {
        if (direction === 'down') {
          speed = downSpeeds[index] || 60;
        } else {
          speed = upSpeeds[index] || 60;
        }
      }
      
      // 상태 결정
      if (speed < 40) status = '정체';
      else if (speed < 80) status = '서행';
      else status = '원활';
      
      const segmentData = {
        id: segmentId,
        name: segmentId,
        speed: speed,
        status: status,
        direction: direction,
        index: index,
        isBranch: isBranch,
        fromLinear: true // 직선도에서 클릭했음을 표시
      };
      console.log('📤 onSegmentSelect 호출:', segmentData);
      onSegmentSelect(segmentData);
    } else {
      console.log('❌ onSegmentSelect 함수가 없음');
    }
  };

  // IC 명칭을 블록 경계에 맞춰 배치 (원래 HTML과 동일)
  const positionICLabels = () => {
    try {
      const icLabels = document.querySelectorAll('.ic-label');
      const baseLeft = document.getElementById('linear').getBoundingClientRect().left;
      
      // 본선 블록들 가져오기
      const mainSegs = routeMainDownRef.current.querySelectorAll('.seg');
      const branchSegs = routeBranchDownRef.current.querySelectorAll('.seg');
      
      // IC 명칭과 블록 매핑 (원래 HTML과 동일)
      const icNames = [
        '남구리IC', '중랑IC', '갈매동구릉TG', '남별내IC', '동의정부IC', 
        '민락IC', '소흘IC', '소흘JCT', '선단IC', '포천IC', '신북IC',
        '소흘JCT', '옥정IC', '양주IC'
      ];
      
      // 하드코딩으로 정확한 IC 위치 지정 (원래 HTML과 동일)
      icLabels.forEach((label, index) => {
        if (index < icNames.length) {
          const icName = icNames[index];
          let x = 0;
          
          // 본선 IC들 (index 0-10)
          if (index === 0) {
            // 남구리IC - 첫 번째 블록 시작
            const firstSeg = mainSegs[0];
            if (firstSeg) {
              const rect = firstSeg.getBoundingClientRect();
              x = (rect.left - baseLeft);
            }
          } else if (index === 1) {
            // 중랑IC - 첫 번째와 두 번째 블록 경계
            const firstSeg = mainSegs[0];
            const secondSeg = mainSegs[1];
            if (firstSeg && secondSeg) {
              const firstRect = firstSeg.getBoundingClientRect();
              const secondRect = secondSeg.getBoundingClientRect();
              x = (firstRect.right - baseLeft) + (secondRect.left - firstRect.right) / 2;
            }
          } else if (index === 2) {
            // 갈매동구릉TG - 두 번째와 세 번째 블록 경계
            const secondSeg = mainSegs[1];
            const thirdSeg = mainSegs[2];
            if (secondSeg && thirdSeg) {
              const secondRect = secondSeg.getBoundingClientRect();
              const thirdRect = thirdSeg.getBoundingClientRect();
              x = (secondRect.right - baseLeft) + (thirdRect.left - secondRect.right) / 2;
            }
          } else if (index === 3) {
            // 남별내IC - 세 번째와 네 번째 블록 경계
            const thirdSeg = mainSegs[2];
            const fourthSeg = mainSegs[3];
            if (thirdSeg && fourthSeg) {
              const thirdRect = thirdSeg.getBoundingClientRect();
              const fourthRect = fourthSeg.getBoundingClientRect();
              x = (thirdRect.right - baseLeft) + (fourthRect.left - thirdRect.right) / 2;
            }
          } else if (index === 4) {
            // 동의정부IC - 네 번째와 다섯 번째 블록 경계
            const fourthSeg = mainSegs[3];
            const fifthSeg = mainSegs[4];
            if (fourthSeg && fifthSeg) {
              const fourthRect = fourthSeg.getBoundingClientRect();
              const fifthRect = fifthSeg.getBoundingClientRect();
              x = (fourthRect.right - baseLeft) + (fifthRect.left - fourthRect.right) / 2;
            }
          } else if (index === 5) {
            // 민락IC - 다섯 번째와 여섯 번째 블록 경계
            const fifthSeg = mainSegs[4];
            const sixthSeg = mainSegs[5];
            if (fifthSeg && sixthSeg) {
              const fifthRect = fifthSeg.getBoundingClientRect();
              const sixthRect = sixthSeg.getBoundingClientRect();
              x = (fifthRect.right - baseLeft) + (sixthRect.left - fifthRect.right) / 2;
            }
          } else if (index === 6) {
            // 소흘IC - 여섯 번째와 일곱 번째 블록 경계
            const sixthSeg = mainSegs[5];
            const seventhSeg = mainSegs[6];
            if (sixthSeg && seventhSeg) {
              const sixthRect = sixthSeg.getBoundingClientRect();
              const seventhRect = seventhSeg.getBoundingClientRect();
              x = (sixthRect.right - baseLeft) + (seventhRect.left - sixthRect.right) / 2;
            }
          } else if (index === 7) {
            // 소흘JCT - 일곱 번째와 여덟 번째 블록 경계
            const seventhSeg = mainSegs[6];
            const eighthSeg = mainSegs[7];
            if (seventhSeg && eighthSeg) {
              const seventhRect = seventhSeg.getBoundingClientRect();
              const eighthRect = eighthSeg.getBoundingClientRect();
              x = (seventhRect.right - baseLeft) + (eighthRect.left - seventhRect.right) / 2;
            }
          } else if (index === 8) {
            // 선단IC - 여덟 번째와 아홉 번째 블록 경계
            const eighthSeg = mainSegs[7];
            const ninthSeg = mainSegs[8];
            if (eighthSeg && ninthSeg) {
              const eighthRect = eighthSeg.getBoundingClientRect();
              const ninthRect = ninthSeg.getBoundingClientRect();
              x = (eighthRect.right - baseLeft) + (ninthRect.left - eighthRect.right) / 2;
            }
          } else if (index === 9) {
            // 포천IC - 아홉 번째와 열 번째 블록 경계
            const ninthSeg = mainSegs[8];
            const tenthSeg = mainSegs[9];
            if (ninthSeg && tenthSeg) {
              const ninthRect = ninthSeg.getBoundingClientRect();
              const tenthRect = tenthSeg.getBoundingClientRect();
              x = (ninthRect.right - baseLeft) + (tenthRect.left - ninthRect.right) / 2;
            }
          } else if (index === 10) {
            // 신북IC - 포천칩과 겹치지 않도록 왼쪽으로 이동
            const tenthSeg = mainSegs[9];
            if (tenthSeg) {
              const tenthRect = tenthSeg.getBoundingClientRect();
              x = (tenthRect.right - baseLeft) - 60; // 포천칩과 겹치지 않도록 왼쪽으로 60px 이동
            }
          } else if (index === 11) {
            // 지선 소흘JCT - 첫 번째 지선 블록 시작
            const firstBranchSeg = branchSegs[0];
            if (firstBranchSeg) {
              const rect = firstBranchSeg.getBoundingClientRect();
              x = (rect.left - baseLeft);
            }
          } else if (index === 12) {
            // 옥정IC - 양주IC와 겹치지 않도록 더 왼쪽으로 이동
            const firstBranchSeg = branchSegs[0];
            const secondBranchSeg = branchSegs[1];
            if (firstBranchSeg && secondBranchSeg) {
              const firstRect = firstBranchSeg.getBoundingClientRect();
              const secondRect = secondBranchSeg.getBoundingClientRect();
              const centerX = (firstRect.right - baseLeft) + (secondRect.left - firstRect.right) / 2;
              x = centerX - 40; // 양주IC와 겹치지 않도록 왼쪽으로 40px 추가 이동
            }
          } else if (index === 13) {
            // 양주IC - 양주칩과 겹치지 않도록 왼쪽으로 이동
            const secondBranchSeg = branchSegs[1];
            if (secondBranchSeg) {
              const secondRect = secondBranchSeg.getBoundingClientRect();
              x = (secondRect.right - baseLeft) - 60; // 양주칩과 겹치지 않도록 왼쪽으로 60px 이동
            }
          }
          
          label.style.left = x + 'px';
          label.style.position = 'absolute';
        }
      });
    } catch (error) {
      console.error('positionICLabels 오류:', error);
    }
  };

  // 칩 배치: 원래 HTML과 완전히 동일하게 (상하행 기준 중앙에 하나씩만)
  const positionChips = () => {
    try {
      const chipGuri = document.getElementById('chip-guri');
      const chipPocheon = document.getElementById('chip-pocheon');
      const chipSoheul = document.getElementById('chip-soheul');
      const chipYangju = document.getElementById('chip-yangju');
      
      if (!chipGuri || !chipPocheon || !chipSoheul || !chipYangju) return;
      
      // 기준은 linear 섹션의 좌측
      const baseLeft = document.getElementById('linear').getBoundingClientRect().left;

      // 구리 칩: 상하행 시작점 (왼쪽 끝) - 더 왼쪽으로 이동
      const firstSeg = routeMainDownRef.current?.querySelector('.seg:first-child');
      if (firstSeg) {
        const rect = firstSeg.getBoundingClientRect();
        const x = (rect.left - baseLeft) - 100; // 왼쪽으로 100px (기존 60px에서 40px 추가 이동)
        chipGuri.style.left = x + 'px';
        chipGuri.style.top = '50%';
        chipGuri.style.display = 'block';
      }

      // 포천 칩: 상하행 끝점 (오른쪽 끝) - 하행 본선의 마지막 구간
      const lastMainSeg = routeMainDownRef.current?.querySelector('.seg:last-child');
      if (lastMainSeg) {
        const rect = lastMainSeg.getBoundingClientRect();
        const x = (rect.right - baseLeft) + 8;
        chipPocheon.style.left = x + 'px';
        chipPocheon.style.top = '50%';
        chipPocheon.style.display = 'block';
      }

      // 소흘 칩: 지선 앞부분 - 하행 지선의 '소흘JCT-옥정IC' 블록 왼쪽 옆 (지선 경계 알림)
      const soheulSeg = findSegEl(routeBranchDownRef.current, '소흘JCT-옥정IC');
      if (soheulSeg) {
        const rect = soheulSeg.getBoundingClientRect();
        const gap = 8;
        const wS = chipSoheul.offsetWidth;
        const x = (rect.left - baseLeft) - wS - gap;
        chipSoheul.style.left = x + 'px';
        chipSoheul.style.top = '50%';
        chipSoheul.style.display = 'block';
      }

      // 양주 칩: 지선 끝점 (지선의 마지막 구간)
      const lastBranchSeg = routeBranchDownRef.current?.querySelector('.seg:last-child');
      if (lastBranchSeg) {
        const rect = lastBranchSeg.getBoundingClientRect();
        const x = (rect.right - baseLeft) + 8;
        chipYangju.style.left = x + 'px';
        chipYangju.style.top = '50%';
        chipYangju.style.display = 'block';
      }
    } catch (error) {
      console.error('positionChips 오류:', error);
    }
  };

  // 블록 찾기 함수 (원래 HTML과 동일)
  const findSegEl = (row, idPart) => {
    if (!row) return null;
    const segs = row.querySelectorAll('.seg');
    for (let el of segs) {
      if ((el.dataset.seg || '').includes(idPart)) {
        return el;
      }
    }
    return null;
  };

  // renderRows 함수를 외부에서도 사용할 수 있도록 정의
  const renderRows = () => {
    try {
        const mainSegs = makeSegments(MAINLINE);
        const branchSegs = makeSegments(BRANCH);

        // 폭 비례 - 가로폭에 맞게 조정 (원래 HTML과 동일)
        const containerWidth = linearRef.current ? linearRef.current.offsetWidth - 184 : 1736; // 패딩 제외
        const branchOffset = 180; // 지선 좌측 마진
        const marginSpace = 20; // 마진 공간
        const availableWidth = containerWidth - branchOffset - marginSpace;
        const mainWidth = availableWidth * 0.88; // 본선 88%
        const branchWidth = availableWidth * 0.12; // 지선 12%
        
        const mainSegWidth = mainWidth / mainSegs.length;
        const branchSegWidth = branchWidth / branchSegs.length;
        
        const MIN = 30, MAX = 200;
        const mainWidthBy = d => Math.round(Math.max(MIN, Math.min(MAX, mainSegWidth)));
        const branchWidthBy = d => Math.round(Math.max(MIN, Math.min(MAX, branchSegWidth)));

        // 제시된 구체적인 속도 데이터 사용 (지도와 직선도 동일하게)
        const getTrafficSpeeds = () => {
          // 업데이트된 구체적인 속도 데이터 사용
          const downSpeeds = [72, 90, 38, 70, 87, 50, 80, 22, 75, 65]; // 본선 하행
          const upSpeeds = [83, 32, 55, 78, 92, 28, 77, 60, 83, 40];   // 본선 상행
          const branchDownSpeeds = [36, 79]; // 지선 하행
          const branchUpSpeeds = [58, 82];   // 지선 상행
          
          // 속도에 따른 색상 생성 (지도와 동일한 로직)
          const getColor = (speed) => {
            if (speed < 40) return '#e53935';  // 정체 (빨강)
            if (speed < 80) return '#ffc107';  // 서행 (amber)
            return '#00ff00'; // 원활 (초록)
          };
          
          console.log('🚦 LinearDiagram: 제시된 구체적인 속도 데이터 사용');
          console.log('📊 LinearDiagram 속도 데이터:', {
            mainDown: downSpeeds,
            mainUp: upSpeeds,
            branchDown: branchDownSpeeds,
            branchUp: branchUpSpeeds
          });
          console.log('📊 본선 하행:', downSpeeds.map(s => `${s}km/h(${s < 40 ? '정체' : s < 80 ? '서행' : '원활'})`));
          console.log('📊 본선 상행:', upSpeeds.map(s => `${s}km/h(${s < 40 ? '정체' : s < 80 ? '서행' : '원활'})`));
          console.log('📊 지선 하행:', branchDownSpeeds.map(s => `${s}km/h(${s < 40 ? '정체' : s < 80 ? '서행' : '원활'})`));
          console.log('📊 지선 상행:', branchUpSpeeds.map(s => `${s}km/h(${s < 40 ? '정체' : s < 80 ? '서행' : '원활'})`));
          
          return {
            downSpeeds,
            branchDownSpeeds,
            upSpeeds,
            branchUpSpeeds,
            // 색상도 속도 기반으로 생성
            downColors: downSpeeds.map(getColor),
            branchDownColors: branchDownSpeeds.map(getColor),
            upColors: upSpeeds.map(getColor),
            branchUpColors: branchUpSpeeds.map(getColor)
          };
        };

        const { downSpeeds, branchDownSpeeds, upSpeeds, branchUpSpeeds, downColors, branchDownColors, upColors, branchUpColors } = getTrafficSpeeds();

        // 하행 본선 렌더링
        if (routeMainDownRef.current) {
          routeMainDownRef.current.innerHTML = '';
          mainSegs.forEach((s, i) => {
            const el = document.createElement('div');
            el.className = 'seg';
            el.style.width = mainWidthBy(s.dist) + 'px';
            
            // 제시된 속도 데이터 기반 색상 사용 (지도와 완전 동일)
            const color = downColors[i] || '#00ff00';
            
            el.style.background = color;
            el.dataset.seg = s.id;
            el.dataset.direction = 'down';
            el.dataset.index = i;
            el.addEventListener('click', () => handleLinearBlockClick(s.id, 'down', i, false));
            routeMainDownRef.current.appendChild(el);
          });
        }

        // 하행 지선 렌더링
        if (routeBranchDownRef.current) {
          routeBranchDownRef.current.innerHTML = '';
          branchSegs.forEach((s, i) => {
            const el = document.createElement('div');
            el.className = 'seg';
            el.style.width = branchWidthBy(s.dist) + 'px';
            
            // 지도와 동기화: 하행 지선에 상행 색상 할당
            const color = branchUpColors[i] || '#00ff00';
            
            el.style.background = color;
            el.dataset.seg = s.id;
            el.dataset.direction = 'down';
            el.dataset.index = i;
            el.dataset.branch = 'true';
            el.addEventListener('click', () => handleLinearBlockClick(s.id, 'down', i, true));
            routeBranchDownRef.current.appendChild(el);
          });
        }

        // 상행 본선 렌더링
        if (routeMainUpRef.current) {
          routeMainUpRef.current.innerHTML = '';
          mainSegs.forEach((s, i) => {
            const el = document.createElement('div');
            el.className = 'seg';
            el.style.width = mainWidthBy(s.dist) + 'px';
            
            // 제시된 속도 데이터 기반 색상 사용 (지도와 완전 동일)
            const color = upColors[i] || '#00ff00';
            
            el.style.background = color;
            el.dataset.seg = s.id;
            el.dataset.direction = 'up';
            el.dataset.index = i;
            el.addEventListener('click', () => handleLinearBlockClick(s.id, 'up', i, false));
            routeMainUpRef.current.appendChild(el);
          });
        }

        // 상행 지선 렌더링
        if (routeBranchUpRef.current) {
          routeBranchUpRef.current.innerHTML = '';
          branchSegs.forEach((s, i) => {
            const el = document.createElement('div');
            el.className = 'seg';
            el.style.width = branchWidthBy(s.dist) + 'px';
            
            // 지도와 동기화: 상행 지선에 하행 색상 할당
            const color = branchDownColors[i] || '#00ff00';
            
            el.style.background = color;
            el.dataset.seg = s.id;
            el.dataset.direction = 'up';
            el.dataset.index = i;
            el.dataset.branch = 'true';
            el.addEventListener('click', () => handleLinearBlockClick(s.id, 'up', i, true));
            routeBranchUpRef.current.appendChild(el);
          });
        }

        // IC 명칭과 칩 위치 조정
        setTimeout(() => {
          positionICLabels();
          positionChips();
        }, 100);

      } catch (error) {
        console.error('renderRows 오류:', error);
      }
    };

  // trafficData 변경 시 다시 렌더링
  useEffect(() => {
    if (trafficData) {
      console.log('🔄 LinearDiagram: 소통정보 데이터 변경으로 다시 렌더링');
      renderRows();
    }
  }, [trafficData]);

  useEffect(() => {
    // 초기 렌더링
    renderRows();
    
    // 리사이즈 이벤트 리스너
    const handleResize = () => {
      renderRows();
    };
    window.addEventListener('resize', handleResize);
    
    // 디버깅을 위해 전역 함수로 등록
    window.testLinearClick = () => {
      console.log('🧪 테스트 클릭 호출됨');
      handleLinearBlockClick('남구리IC-중랑IC', 'down', 0, false);
    };
    
    window.debugLinearElements = () => {
      console.log('🔍 직선도 요소들:');
      console.log('- .seg 요소들:', document.querySelectorAll('.seg'));
      console.log('- routeMainDownRef:', routeMainDownRef.current);
      console.log('- routeBranchDownRef:', routeBranchDownRef.current);
      console.log('- routeMainUpRef:', routeMainUpRef.current);
      console.log('- routeBranchUpRef:', routeBranchUpRef.current);
    };
    
    return () => {
      window.removeEventListener('resize', handleResize);
      delete window.testLinearClick;
      delete window.debugLinearElements;
    };
  }, []);

  return (
    <section id="linear" className="linear-diagram" ref={linearRef}>
      {/* 하행 (포천→구리) */}
      <div className="route-section downbound">
        <div className="route-container">
          <div className="direction-indicator direction-left">&lt;&lt;</div>
          <div className="route-row">
            <div className="route-main" ref={routeMainDownRef}>
              {/* JS가 .seg를 채움 */}
            </div>
            <div className="route-branch" ref={routeBranchDownRef}>
              {/* JS가 .seg를 채움 */}
            </div>
          </div>
          <div className="direction-indicator direction-right">&lt;&lt;</div>
        </div>
      </div>

      {/* 상행 (구리→포천) */}
      <div className="route-section upbound">
        <div className="route-container">
          <div className="direction-indicator direction-left">&gt;&gt;</div>
          <div className="route-row">
            <div className="route-main" ref={routeMainUpRef}>
              {/* JS가 .seg를 채움 */}
            </div>
            <div className="route-branch" ref={routeBranchUpRef}>
              {/* JS가 .seg를 채움 */}
            </div>
          </div>
          <div className="direction-indicator direction-right">&gt;&gt;</div>
        </div>
      </div>

      {/* 칩 채널: 모든 칩을 중앙에 배치 (원래 HTML과 동일한 구조) */}
      <div className="chip-lane">
        <div className="chip" id="chip-guri">구리</div>
        <div className="chip" id="chip-pocheon">포천</div>
        <div className="chip" id="chip-soheul">소흘</div>
        <div className="chip" id="chip-yangju">양주</div>
      </div>
      
      {/* IC 명칭 표기 (원래 HTML과 동일한 구조) */}
      <div className="ic-labels">
        <div className="ic-label">남구리IC</div>
        <div className="ic-label">중랑IC</div>
        <div className="ic-label">갈매동구릉TG</div>
        <div className="ic-label">남별내IC</div>
        <div className="ic-label">동의정부IC</div>
        <div className="ic-label">민락IC</div>
        <div className="ic-label">소흘IC</div>
        <div className="ic-label">소흘JCT</div>
        <div className="ic-label">선단IC</div>
        <div className="ic-label">포천IC</div>
        <div className="ic-label">신북IC</div>
        <div className="ic-label">소흘JCT</div>
        <div className="ic-label">옥정IC</div>
        <div className="ic-label">양주IC</div>
      </div>
    </section>
  );
};

export default LinearDiagram;