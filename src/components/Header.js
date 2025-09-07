import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [currentTime, setCurrentTime] = useState('--:--:--');

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

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">🚗</div>
        <h1 className="header-title">서울북부고속도로 교통 상황판</h1>
      </div>
      <div className="header-right">
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

