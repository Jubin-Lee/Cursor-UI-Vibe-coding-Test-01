import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = ({ onAlarmToggle, activeTab, onTabChange }) => {
  const [currentTime, setCurrentTime] = useState('--:--:--');
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour12: false }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    // 새로고침 로직
    window.location.reload();
  };

  const handleAlarmToggle = () => {
    const newState = !alarmEnabled;
    setAlarmEnabled(newState);
    if (onAlarmToggle) {
      onAlarmToggle(newState);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">🚗</div>
        <h1 className="header-title">서울북부고속도로 교통 상황판</h1>
      </div>
      
      {/* 탭 버튼 */}
      <div className="header-tabs">
        <button 
          className={`tab-button ${activeTab === 'traffic' ? 'active' : ''}`}
          onClick={() => onTabChange('traffic')}
        >
          실시간 교통정보
        </button>
        <button 
          className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => onTabChange('data')}
        >
          데이터 현황
        </button>
      </div>
      
      <div className="header-right">
        <div className="alarm-control">
          <span className="alarm-label">알람</span>
          <label className="alarm-switch">
            <input
              type="checkbox"
              checked={alarmEnabled}
              onChange={handleAlarmToggle}
              aria-label="알람 On/Off"
            />
            <span className="switch-slider"></span>
          </label>
        </div>
        <div className="clock">{currentTime}</div>
        <button 
          className="refresh-btn" 
          onClick={handleRefresh}
          aria-label="데이터 새로고침"
        >
          새로고침
        </button>
      </div>
    </header>
  );
};

export default Header;

