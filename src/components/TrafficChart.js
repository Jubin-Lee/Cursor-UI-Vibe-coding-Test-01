import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

const TrafficChart = ({ selectedSegment = null }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const rankingChartRef = useRef(null);
  const rankingChartInstance = useRef(null);
  
  // 상태 관리
  const [selectedDirection, setSelectedDirection] = useState('전체');
  const [selectedSection, setSelectedSection] = useState('전체구간');
  const [currentChartData, setCurrentChartData] = useState(null);
  const [trafficRankingData, setTrafficRankingData] = useState([]);
  const [currentRankingIndex, setCurrentRankingIndex] = useState(0);
  
  // 방향별 구간 옵션
  const sectionOptions = {
    '전체': [],
    '구리': [
      '신북IC-포천IC',
      '포천IC-선단IC', 
      '선단IC-소흘JCT',
      '소흘JCT-소흘IC',
      '소흘IC-민락IC',
      '민락IC-동의정부IC',
      '동의정부IC-남별내IC',
      '남별내IC-중랑IC',
      '중랑IC-남구리IC'
    ],
    '포천': [
      '남구리IC-중랑IC',
      '중랑IC-남별내IC',
      '남별내IC-동의정부IC',
      '동의정부IC-민락IC',
      '민락IC-소흘IC',
      '소흘IC-소흘JCT',
      '소흘JCT-선단IC',
      '선단IC-포천IC',
      '포천IC-신북IC'
    ],
    '소흘': [
      '양주IC-옥정IC',
      '옥정IC-소흘JCT'
    ],
    '양주': [
      '소흘JCT-옥정IC',
      '옥정IC-양주IC'
    ]
  };

  // 구간별 교통량 데이터 생성 함수
  const generateTrafficData = (direction = '전체', section = '전체구간') => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}시`);
    
    // 구간별 기본 교통량 계수 (구간의 특성에 따라 다름)
    const getSectionMultiplier = (direction, section) => {
      if (direction === '전체') return 1.0;
      
      // 구간별 특성에 따른 계수 (실제 교통량 패턴을 반영)
      const sectionMultipliers = {
        '구리': {
          '신북IC-포천IC': 0.6,      // 시골 구간 (더 낮은 교통량)
          '포천IC-선단IC': 0.7,      // 시골 구간
          '선단IC-소흘JCT': 1.3,     // 주요 분기점 (더 높은 교통량)
          '소흘JCT-소흘IC': 1.2,     // 분기점 근처
          '소흘IC-민락IC': 1.5,      // 도시 구간 (더 높은 교통량)
          '민락IC-동의정부IC': 1.6,  // 도시 구간 (최고 교통량)
          '동의정부IC-남별내IC': 1.4, // 도시 구간
          '남별내IC-중랑IC': 1.3,    // 도시 구간
          '중랑IC-남구리IC': 1.1     // 도시 구간
        },
        '포천': {
          '남구리IC-중랑IC': 1.1,    // 도시 구간
          '중랑IC-남별내IC': 1.3,    // 도시 구간
          '남별내IC-동의정부IC': 1.4, // 도시 구간
          '동의정부IC-민락IC': 1.6,  // 도시 구간 (최고 교통량)
          '민락IC-소흘IC': 1.5,      // 도시 구간
          '소흘IC-소흘JCT': 1.2,     // 분기점 근처
          '소흘JCT-선단IC': 1.3,     // 주요 분기점
          '선단IC-포천IC': 0.7,      // 시골 구간
          '포천IC-신북IC': 0.6       // 시골 구간 (더 낮은 교통량)
        },
        '소흘': {
          '양주IC-옥정IC': 0.3,      // 지선 구간 (매우 낮은 교통량)
          '옥정IC-소흘JCT': 0.4      // 지선 구간 (매우 낮은 교통량)
        },
        '양주': {
          '소흘JCT-옥정IC': 0.4,     // 지선 구간 (매우 낮은 교통량)
          '옥정IC-양주IC': 0.3       // 지선 구간 (매우 낮은 교통량)
        }
      };
      
      return sectionMultipliers[direction]?.[section] || 1.0;
    };

    // 각 차종별 고유한 교통 패턴 정의 (실제 교통 분류 기준)
    const vehiclePatterns = [
      { // 1종 - 2축 1단위, 16인승 미만 여객용 또는 미니트럭 (승용차, 소나타, 소렌토)
        baseValue: 150,
        variation: 30,
        peakHours: [7, 8, 9, 17, 18, 19],
        peakMultiplier: 2.5,
        nightMultiplier: 0.15,
        weekendPattern: true
      },
      { // 2종 - 2축 1단위, 16인승 이상 여객용 버스 (고속버스, 시내버스)
        baseValue: 80,
        variation: 20,
        peakHours: [6, 7, 8, 9, 17, 18, 19, 20],
        peakMultiplier: 2.2,
        nightMultiplier: 0.05,
        weekendPattern: true
      },
      { // 3종 - 2축 1단위, 1~2.5톤 미만 화물차 (포터, 봉고)
        baseValue: 100,
        variation: 25,
        peakHours: [2, 3, 4, 5, 22, 23],
        peakMultiplier: 2.0,
        nightMultiplier: 0.3,
        weekendPattern: false
      },
      { // 4종 - 2축 1단위, 2.5~4톤 미만 화물차 (마이티, 라이노)
        baseValue: 90,
        variation: 22,
        peakHours: [2, 3, 4, 5, 22, 23],
        peakMultiplier: 1.9,
        nightMultiplier: 0.3,
        weekendPattern: false
      },
      { // 5종 - 2축 1단위, 4~6톤 미만 화물차
        baseValue: 70,
        variation: 18,
        peakHours: [2, 3, 4, 5, 22, 23],
        peakMultiplier: 1.8,
        nightMultiplier: 0.25,
        weekendPattern: false
      },
      { // 6종 - 2축 1단위, 6~8톤 미만 화물차
        baseValue: 55,
        variation: 15,
        peakHours: [2, 3, 4, 5, 22, 23],
        peakMultiplier: 1.7,
        nightMultiplier: 0.2,
        weekendPattern: false
      },
      { // 7종 - 3축 1단위, 8톤 이상 화물차
        baseValue: 45,
        variation: 12,
        peakHours: [2, 3, 4, 5, 22, 23],
        peakMultiplier: 1.6,
        nightMultiplier: 0.15,
        weekendPattern: false
      },
      { // 8종 - 4축 세미 트레일러
        baseValue: 35,
        variation: 10,
        peakHours: [2, 3, 4, 5, 22, 23],
        peakMultiplier: 1.5,
        nightMultiplier: 0.1,
        weekendPattern: false
      },
      { // 9종 - 4축 풀 트레일러
        baseValue: 30,
        variation: 8,
        peakHours: [2, 3, 4, 5, 22, 23],
        peakMultiplier: 1.4,
        nightMultiplier: 0.05,
        weekendPattern: false
      },
      { // 10종 - 5축 2단위 화물차
        baseValue: 25,
        variation: 6,
        peakHours: [2, 3, 4, 5, 22, 23],
        peakMultiplier: 1.3,
        nightMultiplier: 0.05,
        weekendPattern: false
      },
      { // 11종 - 2단위 4축 화물차
        baseValue: 20,
        variation: 5,
        peakHours: [2, 3, 4, 5, 22, 23],
        peakMultiplier: 1.2,
        nightMultiplier: 0.05,
        weekendPattern: false
      },
      { // 12종 - 2단위 4축 화물차
        baseValue: 15,
        variation: 4,
        peakHours: [2, 3, 4, 5, 22, 23],
        peakMultiplier: 1.1,
        nightMultiplier: 0.05,
        weekendPattern: false
      }
    ];
    
    // 구간별 계수 가져오기
    const sectionMultiplier = getSectionMultiplier(direction, section);
    
    // 차종별 데이터 생성 함수
    const generateVehicleData = (pattern) => {
      return Array.from({ length: 24 }, (_, i) => {
        const hour = i;
        let multiplier = 1;
        
        // 피크 시간대 확인
        if (pattern.peakHours.includes(hour)) {
          multiplier = pattern.peakMultiplier;
        } else if (hour >= 22 || hour <= 5) {
          multiplier = pattern.nightMultiplier;
        } else {
          multiplier = 1.0;
        }
        
        // 랜덤 변동성 추가 (더 현실적인 패턴)
        const randomFactor = (Math.random() - 0.5) * 2; // -1 ~ 1
        const variationFactor = randomFactor * pattern.variation;
        
        // 시간대별 추가 변동성
        const timeVariation = Math.sin((hour / 24) * Math.PI * 2) * 0.1; // 시간대별 사인파 패턴
        
        // 구간별 계수 적용
        const baseValue = pattern.baseValue * multiplier * sectionMultiplier;
        const finalValue = baseValue + variationFactor + (baseValue * timeVariation);
        
        return Math.max(0, Math.round(finalValue)); // 음수 방지
      });
    };
    
    // 전체 구간 데이터 (12개 차종)
    const overallData = vehiclePatterns.map(pattern => generateVehicleData(pattern));

    // 차트 제목 생성
    const getChartTitle = (direction, section) => {
      if (direction === '전체') {
        return '전체 구간';
      } else {
        return `${direction}방향-${section}`;
      }
    };

    return {
      hours,
      data: overallData,
      title: getChartTitle(direction, section)
    };
  };

  // 정체구간 순위 데이터 생성 함수
  const generateTrafficRankingData = () => {
    const allSections = [
      // 구리 방향 (다양한 포화도 구간들)
      { direction: '구리', section: '신북IC-포천IC', congestion: 0.4 }, // 원활 (40%)
      { direction: '구리', section: '포천IC-선단IC', congestion: 0.5 }, // 원활 (50%)
      { direction: '구리', section: '선단IC-소흘JCT', congestion: 0.75 }, // 서행 (75%)
      { direction: '구리', section: '소흘JCT-소흘IC', congestion: 0.65 }, // 원활 (65%)
      { direction: '구리', section: '소흘IC-민락IC', congestion: 0.9 }, // 정체 시작 (90%)
      { direction: '구리', section: '민락IC-동의정부IC', congestion: 1.05 }, // 심각 정체 (105%)
      { direction: '구리', section: '동의정부IC-남별내IC', congestion: 0.8 }, // 서행 (80%)
      { direction: '구리', section: '남별내IC-중랑IC', congestion: 0.6 }, // 원활 (60%)
      { direction: '구리', section: '중랑IC-남구리IC', congestion: 0.45 }, // 원활 (45%)
      
      // 포천 방향 (다양한 포화도 구간들)
      { direction: '포천', section: '남구리IC-중랑IC', congestion: 0.45 }, // 원활 (45%)
      { direction: '포천', section: '중랑IC-남별내IC', congestion: 0.55 }, // 원활 (55%)
      { direction: '포천', section: '남별내IC-동의정부IC', congestion: 0.75 }, // 서행 (75%)
      { direction: '포천', section: '동의정부IC-민락IC', congestion: 1.05 }, // 심각 정체 (105%)
      { direction: '포천', section: '민락IC-소흘IC', congestion: 0.9 }, // 정체 시작 (90%)
      { direction: '포천', section: '소흘IC-소흘JCT', congestion: 0.65 }, // 원활 (65%)
      { direction: '포천', section: '소흘JCT-선단IC', congestion: 0.8 }, // 서행 (80%)
      { direction: '포천', section: '선단IC-포천IC', congestion: 0.35 }, // 원활 (35%)
      { direction: '포천', section: '포천IC-신북IC', congestion: 0.3 }, // 원활 (30%)
      
      // 소흘 방향 (지선으로 포화도 낮음)
      { direction: '소흘', section: '양주IC-옥정IC', congestion: 0.2 }, // 원활 (20%)
      { direction: '소흘', section: '옥정IC-소흘JCT', congestion: 0.25 }, // 원활 (25%)
      
      // 양주 방향 (지선으로 포화도 낮음)
      { direction: '양주', section: '소흘JCT-옥정IC', congestion: 0.25 }, // 원활 (25%)
      { direction: '양주', section: '옥정IC-양주IC', congestion: 0.2 } // 원활 (20%)
    ];

    // 시간대별 정체도 변화 시뮬레이션
    const timeVariations = [
      { hour: 0, multiplier: 0.1 },   // 새벽 - 매우 낮음
      { hour: 1, multiplier: 0.1 },
      { hour: 2, multiplier: 0.2 },
      { hour: 3, multiplier: 0.3 },
      { hour: 4, multiplier: 0.4 },
      { hour: 5, multiplier: 0.5 },
      { hour: 6, multiplier: 0.7 },   // 출근시간 시작
      { hour: 7, multiplier: 1.0 },   // 출근시간 피크
      { hour: 8, multiplier: 1.2 },
      { hour: 9, multiplier: 1.0 },
      { hour: 10, multiplier: 0.8 },
      { hour: 11, multiplier: 0.7 },
      { hour: 12, multiplier: 0.8 },
      { hour: 13, multiplier: 0.7 },
      { hour: 14, multiplier: 0.8 },
      { hour: 15, multiplier: 0.9 },
      { hour: 16, multiplier: 1.0 },
      { hour: 17, multiplier: 1.2 },  // 퇴근시간 피크
      { hour: 18, multiplier: 1.3 },
      { hour: 19, multiplier: 1.1 },
      { hour: 20, multiplier: 0.9 },
      { hour: 21, multiplier: 0.7 },
      { hour: 22, multiplier: 0.5 },
      { hour: 23, multiplier: 0.3 }
    ];

    const rankingData = [];
    
    // 24시간 데이터 생성
    for (let hour = 0; hour < 24; hour++) {
      const timeMultiplier = timeVariations[hour].multiplier;
      const hourData = allSections.map(section => {
        // 정체 시 교통량 포화도 계산 (정체도가 높을수록 포화도 높음)
        const congestionLevel = section.congestion * timeMultiplier;
        // 포화도는 0-120% 범위로 설정 (100% 초과도 가능)
        const saturationLevel = Math.min(congestionLevel * 1.0, 1.2);
        
        // 랜덤 변동성 추가 (더 현실적인 변화)
        const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% 변동
        const finalSaturation = Math.max(0, Math.min(1.2, saturationLevel + randomVariation));
        
        return {
          name: `(${section.direction}) ${section.section}`,
          value: Math.round(finalSaturation * 100) / 100, // 포화도로 변경
          direction: section.direction,
          section: section.section,
          congestionLevel: congestionLevel
        };
      }).sort((a, b) => b.value - a.value); // 포화도 순으로 정렬
      
      rankingData.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        data: hourData // 모든 구간 포함
      });
    }
    
    return rankingData;
  };

  // 방향 변경 핸들러
  const handleDirectionChange = (direction) => {
    setSelectedDirection(direction);
    if (direction === '전체') {
      setSelectedSection('전체구간');
    } else {
      setSelectedSection(sectionOptions[direction][0] || '전체구간');
    }
  };

  // 조회 버튼 핸들러
  const handleQuery = () => {
    const chartData = generateTrafficData(selectedDirection, selectedSection);
    setCurrentChartData(chartData);
  };

  // 바 레이스 차트 초기화 함수
  const initRankingChart = () => {
    if (!rankingChartRef.current || !trafficRankingData.length) return;

    const currentData = trafficRankingData[currentRankingIndex];
    if (!currentData) return;

    // 현재 시간 표시
    const now = new Date();
    const currentTime = now.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });

    const option = {
      title: {
        text: `교통량 포화도 순위 - ${currentTime}`,
        left: 'center',
        textStyle: {
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 1.2,
        axisLine: {
          lineStyle: {
            color: '#ffffff'
          }
        },
        axisLabel: {
          color: '#ffffff',
          formatter: function(value) {
            return (value * 100).toFixed(0) + '%';
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: currentData.data.map(item => item.name),
        axisLine: {
          lineStyle: {
            color: '#ffffff'
          }
        },
        axisLabel: {
          color: '#ffffff',
          fontSize: 10
        },
        inverse: true // 상위 구간이 위에 오도록
      },
      series: [{
        type: 'bar',
        data: currentData.data.map(item => ({
          value: item.value,
          itemStyle: {
            color: (() => {
              const saturation = item.value * 100; // 퍼센트로 변환
              if (saturation >= 100) return '#e53935'; // 심각 정체 (빨강) - 100% 이상
              if (saturation >= 85) return '#ff9800'; // 정체 시작 (주황) - 85-100%
              if (saturation >= 70) return '#ffc107'; // 서행 (amber) - 70-85%
              return '#4caf50'; // 원활 (초록) - 70% 미만
            })()
          }
        })),
        label: {
          show: true,
          position: 'right',
          color: '#ffffff',
          formatter: function(params) {
            return (params.value * 100).toFixed(1) + '%';
          }
        },
        animationDuration: 2000, // 더 부드러운 애니메이션
        animationEasing: 'cubicOut',
        animationDelay: function (idx) {
          return idx * 100; // 순차적 애니메이션
        }
      }]
    };

    if (rankingChartInstance.current) {
      rankingChartInstance.current.dispose();
    }

    rankingChartInstance.current = echarts.init(rankingChartRef.current);
    rankingChartInstance.current.setOption(option);
  };

  const initChart = () => {
    if (!chartRef.current) return;

    const chartData = currentChartData || generateTrafficData(selectedDirection, selectedSection);
    
    const option = {
      title: {
        text: `교통량 (${chartData.title})`,
        left: 'center',
        textStyle: {
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#333',
        textStyle: {
          color: '#fff'
        }
      },
      legend: {
        data: ['1종', '2종', '3종', '4종', '5종', '6종', '7종', '8종', '9종', '10종', '11종', '12종'],
        top: 30,
        textStyle: {
          color: '#ffffff',
          fontSize: 12
        },
        itemWidth: 12,
        itemHeight: 8,
        orient: 'horizontal',
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: chartData.hours,
          axisLine: {
            lineStyle: {
              color: '#ffffff'
            }
          },
          axisLabel: {
            color: '#ffffff'
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '교통량 (대/시간)',
          nameTextStyle: {
            color: '#ffffff'
          },
          axisLine: {
            lineStyle: {
              color: '#ffffff'
            }
          },
          axisLabel: {
            color: '#ffffff'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      ],
      series: [
        {
          name: '1종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[0],
          itemStyle: {
            color: '#5470c6'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(84, 112, 198, 0.6)' },
                { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
              ]
            }
          }
        },
        {
          name: '2종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[1],
          itemStyle: {
            color: '#91cc75'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(145, 204, 117, 0.6)' },
                { offset: 1, color: 'rgba(145, 204, 117, 0.1)' }
              ]
            }
          }
        },
        {
          name: '3종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[2],
          itemStyle: {
            color: '#fac858'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(250, 200, 88, 0.6)' },
                { offset: 1, color: 'rgba(250, 200, 88, 0.1)' }
              ]
            }
          }
        },
        {
          name: '4종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[3],
          itemStyle: {
            color: '#ee6666'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(238, 102, 102, 0.6)' },
                { offset: 1, color: 'rgba(238, 102, 102, 0.1)' }
              ]
            }
          }
        },
        {
          name: '5종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[4],
          itemStyle: {
            color: '#73c0de'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(115, 192, 222, 0.6)' },
                { offset: 1, color: 'rgba(115, 192, 222, 0.1)' }
              ]
            }
          }
        },
        {
          name: '6종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[5],
          itemStyle: {
            color: '#3ba272'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 162, 114, 0.6)' },
                { offset: 1, color: 'rgba(59, 162, 114, 0.1)' }
              ]
            }
          }
        },
        {
          name: '7종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[6],
          itemStyle: {
            color: '#fc8452'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(252, 132, 82, 0.6)' },
                { offset: 1, color: 'rgba(252, 132, 82, 0.1)' }
              ]
            }
          }
        },
        {
          name: '8종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[7],
          itemStyle: {
            color: '#9a60b4'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(154, 96, 180, 0.6)' },
                { offset: 1, color: 'rgba(154, 96, 180, 0.1)' }
              ]
            }
          }
        },
        {
          name: '9종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[8],
          itemStyle: {
            color: '#ea7ccc'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(234, 124, 204, 0.6)' },
                { offset: 1, color: 'rgba(234, 124, 204, 0.1)' }
              ]
            }
          }
        },
        {
          name: '10종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[9],
          itemStyle: {
            color: '#5470c6'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(84, 112, 198, 0.4)' },
                { offset: 1, color: 'rgba(84, 112, 198, 0.05)' }
              ]
            }
          }
        },
        {
          name: '11종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[10],
          itemStyle: {
            color: '#91cc75'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(145, 204, 117, 0.4)' },
                { offset: 1, color: 'rgba(145, 204, 117, 0.05)' }
              ]
            }
          }
        },
        {
          name: '12종',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: chartData.data[11],
          itemStyle: {
            color: '#fac858'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(250, 200, 88, 0.4)' },
                { offset: 1, color: 'rgba(250, 200, 88, 0.05)' }
              ]
            }
          }
        }
      ]
    };

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption(option);
  };

  useEffect(() => {
    // 초기 차트 데이터 설정
    if (!currentChartData) {
      const initialData = generateTrafficData('전체', '전체구간');
      setCurrentChartData(initialData);
    }
    
    // 정체구간 순위 데이터 초기화
    if (!trafficRankingData.length) {
      const rankingData = generateTrafficRankingData();
      setTrafficRankingData(rankingData);
    }
  }, []);

  useEffect(() => {
    if (currentChartData) {
    initChart();
    }
  }, [currentChartData]);

  useEffect(() => {
    if (trafficRankingData.length > 0) {
      initRankingChart();
    }
  }, [trafficRankingData, currentRankingIndex]);

  // 10초마다 자동 갱신 (실제 시간 기준)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      setCurrentRankingIndex(currentHour);
    };

    // 초기 설정
    updateTime();

    // 10초마다 업데이트 (더 자주 갱신)
    const interval = setInterval(updateTime, 10000); // 10초 = 10000ms

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
      if (rankingChartInstance.current) {
        rankingChartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
      if (rankingChartInstance.current) {
        rankingChartInstance.current.dispose();
      }
    };
  }, []);

  return (
    <div className="traffic-chart">
      {/* 컨트롤 패널 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#2a2f3e',
        borderRadius: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>방향:</label>
          <select 
            value={selectedDirection}
            onChange={(e) => handleDirectionChange(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #555',
              backgroundColor: '#1a1f2e',
              color: '#ffffff',
              fontSize: '14px',
              minWidth: '100px'
            }}
          >
            <option value="전체">전체</option>
            <option value="구리">구리</option>
            <option value="포천">포천</option>
            <option value="소흘">소흘</option>
            <option value="양주">양주</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>구간:</label>
          <select 
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #555',
              backgroundColor: '#1a1f2e',
              color: '#ffffff',
              fontSize: '14px',
              minWidth: '200px'
            }}
            disabled={selectedDirection === '전체'}
          >
            {selectedDirection === '전체' ? (
              <option value="전체구간">전체구간</option>
            ) : (
              sectionOptions[selectedDirection].map((section, index) => (
                <option key={index} value={section}>{section}</option>
              ))
            )}
          </select>
        </div>

        <button 
          onClick={handleQuery}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          조회
        </button>
      </div>

      {/* 교통량 분석 차트 영역 */}
      <div 
        ref={chartRef} 
        style={{ 
          width: '100%', 
          height: '300px',
          backgroundColor: '#1a1f2e',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '20px'
        }}
      />

      {/* 정체구간 순위 차트 영역 */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ 
          color: '#ffffff', 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          교통량 포화도 순위 (실시간)
        </h3>
        <div 
          ref={rankingChartRef} 
          style={{ 
            width: '100%', 
            height: '600px', // 높이 증가
            backgroundColor: '#1a1f2e',
            borderRadius: '8px',
            padding: '10px'
          }}
        />
      </div>
    </div>
  );
};

export default TrafficChart;

