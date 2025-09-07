import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('새 이벤트 발생');

  useEffect(() => {
    // 컴포넌트 마운트 후 2초 뒤에 토스트 표시
    const timer = setTimeout(() => {
      setIsVisible(true);
      setMessage('새로운 돌발사고 발생: 갈매동구릉TG-남별내IC 구간');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible) {
      // 3초 후 자동 숨김
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClick = () => {
    // 토스트 클릭 시 상세 정보 표시 (추후 구현)
    console.log('토스트 클릭됨');
    setIsVisible(false);
  };

  return (
    <div 
      className={`toast ${isVisible ? 'show' : ''}`}
      onClick={handleClick}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
};

export default Toast;

