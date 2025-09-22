import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import MapContainer from './components/MapContainer';
import LinearDiagram from './components/LinearDiagram';
import BottomPanels from './components/BottomPanels';
import DataStatus from './components/DataStatus';
import Toast from './components/Toast';

function App() {
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [activeTab, setActiveTab] = useState('traffic'); // 'traffic' 또는 'data'
  const [trafficData, setTrafficData] = useState(null);

  const handleAlarmToggle = (enabled) => {
    setAlarmEnabled(enabled);
  };

  const handleSegmentSelect = (segment) => {
    console.log('📥 App.js handleSegmentSelect 호출:', segment);
    setSelectedSegment(segment);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    console.log('📱 탭 변경:', tab);
  };

  const handleTrafficDataUpdate = (data) => {
    setTrafficData(data);
    console.log('📊 소통정보 데이터 업데이트:', data?.length, '개 세그먼트');
  };

  return (
    <div className="app">
      <Header 
        onAlarmToggle={handleAlarmToggle} 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      {/* 탭에 따른 조건부 렌더링 */}
      {activeTab === 'traffic' ? (
        <div className="traffic-screen">
          <MapContainer 
            onSegmentSelect={handleSegmentSelect} 
            selectedSegment={selectedSegment}
            onTrafficDataUpdate={handleTrafficDataUpdate}
          />
          <LinearDiagram 
            onSegmentSelect={handleSegmentSelect} 
            trafficData={trafficData}
          />
          <BottomPanels selectedSegment={selectedSegment} />
        </div>
      ) : (
        <DataStatus />
      )}
      
      <Toast alarmEnabled={alarmEnabled} />
    </div>
  );
}

export default App;

