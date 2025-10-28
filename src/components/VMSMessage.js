import React, { useState, useEffect } from 'react';
import './VMSMessage.css';

const VMSMessage = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // 교통안전 메시지 이미지 데이터
  const safetyMessages = [
    {
      id: 1,
      type: 'seatbelt',
      title: '안전벨트를 착용합시다',
      image: process.env.PUBLIC_URL + '/images/seatbelt.png'
    },
    {
      id: 2,
      type: 'phone',
      title: '운전중 휴대폰 사용금지',
      image: process.env.PUBLIC_URL + '/images/phone.png'
    },
    {
      id: 3,
      type: 'drowsy',
      title: '졸음운전 주의',
      image: process.env.PUBLIC_URL + '/images/nap.png'
    },
    {
      id: 4,
      type: 'info',
      title: '구리포천 이용안내',
      image: process.env.PUBLIC_URL + '/images/info.png'
    }
  ];

  // 3초마다 메시지 로테이션
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        (prevIndex + 1) % safetyMessages.length
      );
    }, 3000); // 3초

    return () => clearInterval(interval);
  }, [safetyMessages.length]);

  const currentMessage = safetyMessages[currentMessageIndex];

  return (
    <div className="vms-message-container">
      <div className="vms-message-header">
        <div className="vms-status-indicator">
          <div className="vms-status-dot active"></div>
          <span className="vms-status-text">VMS 작동중</span>
        </div>
        <div className="vms-message-counter">
          {currentMessageIndex + 1} / {safetyMessages.length}
        </div>
      </div>
      
      <div className="vms-message-display">
        <div 
          className="vms-message-content"
          style={{ 
            animation: 'slideIn 0.5s ease-in-out'
          }}
        >
          <img 
            src={currentMessage.image} 
            alt={currentMessage.title}
            className="vms-message-image"
            onLoad={() => console.log('이미지 로드 성공:', currentMessage.image)}
            onError={(e) => {
              console.error('이미지 로드 실패:', currentMessage.image);
              console.error('에러:', e);
            }}
          />
        </div>
      </div>
      
      <div className="vms-message-footer">
        <div className="vms-message-info">
          <span className="vms-message-type">{currentMessage.type.toUpperCase()}</span>
          <span className="vms-message-time">
            {new Date().toLocaleTimeString('ko-KR')}
          </span>
        </div>
        <div className="vms-progress-bar">
          <div 
            className="vms-progress-fill"
            style={{
              width: '100%',
              animation: 'progressBar 3s linear infinite'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default VMSMessage;
