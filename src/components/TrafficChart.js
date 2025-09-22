import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const TrafficChart = ({ selectedSegment = null }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 교통량 데이터 (예시)
  const generateTrafficData = (segmentName = '전체 구간') => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}시`);
    
    // 전체 구간 데이터
    const overallData = [
      [120, 95, 140, 160, 180, 220, 280, 320, 290, 250, 200, 180, 190, 210, 240, 260, 280, 300, 320, 290, 250, 220, 180, 150],
      [80, 60, 90, 110, 130, 160, 200, 240, 220, 180, 140, 120, 130, 150, 180, 200, 220, 240, 260, 230, 190, 160, 120, 100],
      [40, 35, 50, 50, 50, 60, 80, 80, 70, 70, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 50]
    ];

    // 특정 구간 선택 시 데이터 변경
    const segmentData = [
      [100, 80, 120, 140, 160, 200, 250, 280, 260, 220, 180, 160, 170, 190, 220, 240, 260, 280, 300, 270, 230, 200, 160, 130],
      [60, 45, 70, 90, 110, 140, 180, 210, 190, 150, 120, 100, 110, 130, 160, 180, 200, 220, 240, 210, 170, 140, 100, 80],
      [40, 35, 50, 50, 50, 60, 70, 70, 70, 70, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 50]
    ];

    const data = selectedSegment ? segmentData : overallData;
    const title = selectedSegment ? `${selectedSegment.name} 구간` : '전체 구간';

    return {
      hours,
      data,
      title
    };
  };

  const initChart = () => {
    if (!chartRef.current) return;

    const chartData = generateTrafficData(selectedSegment);
    
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
        data: ['승용차', '화물차', '버스'],
        top: 30,
        textStyle: {
          color: '#ffffff'
        }
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
          name: '승용차',
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
          name: '화물차',
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
          name: '버스',
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
    initChart();

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
      }
    };
  }, [selectedSegment]);

  return (
    <div className="traffic-chart">
      <div 
        ref={chartRef} 
        style={{ 
          width: '100%', 
          height: '300px',
          backgroundColor: '#1a1f2e',
          borderRadius: '8px',
          padding: '10px'
        }}
      />
    </div>
  );
};

export default TrafficChart;

