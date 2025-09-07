import React from 'react';
import './BottomPanels.css';

const BottomPanels = () => {
  return (
    <section className="bottom-panels">
      <div className="panel">
        <div className="panel-header">소통정보</div>
        <div className="panel-body">
          <div className="info-item">
            <span className="info-label">전체 구간:</span>
            <span className="info-value">10개</span>
          </div>
          <div className="info-item">
            <span className="info-label">정체 구간:</span>
            <span className="info-value">3개</span>
          </div>
          <div className="info-item">
            <span className="info-label">평균 속도:</span>
            <span className="info-value">45km/h</span>
          </div>
          <div className="info-item">
            <span className="info-label">최고 속도:</span>
            <span className="info-value">72km/h</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">돌발/특별상황</div>
        <div className="panel-body">
          <div className="event-list">
            <div className="event-item">
              <div className="event-time">14:03</div>
              <div className="event-type">사고 - 갈매동구릉TG-남별내IC</div>
            </div>
            <div className="event-item">
              <div className="event-time">14:12</div>
              <div className="event-type">장애물 - 소흘IC-소흘JCT</div>
            </div>
            <div className="event-item">
              <div className="event-time">14:18</div>
              <div className="event-type">고장 - 중랑IC-갈매동구릉TG</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">VMS/LCS</div>
        <div className="panel-body">
          <div className="info-item">
            <span className="info-label">VMS 작동:</span>
            <span className="info-value">8/10</span>
          </div>
          <div className="info-item">
            <span className="info-label">LCS 작동:</span>
            <span className="info-value">6/8</span>
          </div>
          <div className="info-item">
            <span className="info-label">메시지:</span>
            <span className="info-value">3개</span>
          </div>
          <div className="info-item">
            <span className="info-label">상태:</span>
            <span className="info-value status-normal">정상</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">날씨</div>
        <div className="panel-body">
          <div className="weather-item">
            <span className="weather-place">구리시</span>
            <span className="weather-temp">21°C</span>
          </div>
          <div className="weather-item">
            <span className="weather-place">포천시</span>
            <span className="weather-temp">25°C</span>
          </div>
          <div className="weather-detail">
            맑음, 바람 2-3m/s
          </div>
        </div>
      </div>
    </section>
  );
};

export default BottomPanels;

