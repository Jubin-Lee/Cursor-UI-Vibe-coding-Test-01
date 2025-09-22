import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const SpeedGauge = ({ selectedSegment }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 구간별 속도 데이터 (Mock)
  const getSegmentSpeed = (segment) => {
    if (!segment) {
      // 전체 구간 평균속도
      return 65;
    }

    // 특정 구간별 속도 데이터 (실제 데이터와 일치)
    const speedData = {
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
      '소흘JCT-옥정IC': { up: 58, down: 36 },
      '옥정IC-양주IC': { up: 82, down: 79 }
    };

    const segmentData = speedData[segment.name];
    if (!segmentData) return 65;

    // 방향에 따른 속도 반환 (지선의 경우 방향 수정)
    if (segment.name.includes('소흘JCT-옥정IC') || segment.name.includes('옥정IC-양주IC')) {
      // 지선의 경우 방향을 바꿔서 반환
      return segment.direction === 'up' ? segmentData.down : segmentData.up;
    } else {
      // 본선은 기존 로직 유지
      return segment.direction === 'up' ? segmentData.up : segmentData.down;
    }
  };

  // 속도에 따른 색상 결정 (지도 범례와 동일)
  const getSpeedColor = (speed) => {
    if (speed < 40) return '#e53935'; // 정체 (빨강)
    if (speed < 80) return '#ffc107'; // 서행 (amber)
    return '#00ff00'; // 원활 (초록) - 지도와 동일한 색상
  };

  // 속도에 따른 상태 텍스트
  const getSpeedStatus = (speed) => {
    if (speed < 40) return '정체';
    if (speed < 80) return '서행';
    return '원활';
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const speed = getSegmentSpeed(selectedSegment);
    const color = getSpeedColor(speed);
    const status = getSpeedStatus(speed);

    const option = {
      series: [
        {
          type: 'gauge',
          center: ['50%', '60%'],
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 120,
          splitNumber: 12,
          itemStyle: {
            color: color
          },
          progress: {
            show: true,
            width: 18
          },
          pointer: {
            show: false
          },
          axisLine: {
            lineStyle: {
              width: 18
            }
          },
          axisTick: {
            distance: -35, // 눈금을 더 안쪽으로 이동
            splitNumber: 5,
            lineStyle: {
              width: 2,
              color: '#999'
            }
          },
          splitLine: {
            distance: -35, // 눈금을 더 안쪽으로 이동
            length: 25, // 눈금 길이를 줄임
            lineStyle: {
              width: 4,
              color: '#999'
            }
          },
          axisLabel: {
            distance: -35, // 숫자가 완전히 표시되도록 조금 더 안쪽으로 이동
            color: '#999',
            fontSize: 11, // 폰트 크기를 약간 줄임
            fontFamily: 'Pretendard, system-ui, -apple-system, sans-serif'
          },
          detail: {
            valueAnimation: true,
            formatter: '{value} km/h',
            color: 'inherit',
            fontSize: 20,
            fontWeight: 'bold',
            offsetCenter: [0, '70%']
          },
          title: {
            offsetCenter: [0, '-20%'],
            fontSize: 16,
            fontWeight: 'bold',
            color: '#ffffff',
            fontFamily: 'Pretendard, system-ui, -apple-system, sans-serif'
          },
          data: [
            {
              value: speed,
              name: status
            }
          ]
        }
      ]
    };

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption(option);

    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [selectedSegment]);

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: '100%', 
        height: '200px',
        minHeight: '200px'
      }} 
    />
  );
};

export default SpeedGauge;
