import React from 'react';
import './DataStatus.css';
import TrafficChart from './TrafficChart';

const DataStatus = () => {
  return (
    <div className="data-status">
      <div className="data-status-header">
        <h2>데이터 현황</h2>
        <p>시스템 데이터 수집 및 처리 현황을 확인할 수 있습니다.</p>
      </div>
      
      <div className="data-status-content">
        {/* 교통량 분석 차트 */}
        <div className="status-section">
          <h3>교통량 분석</h3>
          <div className="chart-container">
            <TrafficChart selectedSegment={null} />
          </div>
        </div>
        
        {/* 통계 정보 */}
        <div className="status-section">
          <h3>오늘의 통계</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">1,247</div>
              <div className="stat-label">처리된 데이터 건수</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98.5%</div>
              <div className="stat-label">데이터 정확도</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">발생한 돌발상황</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24</div>
              <div className="stat-label">평균 응답시간(ms)</div>
            </div>
          </div>
        </div>
        
        {/* 데이터 수집 현황 */}
        <div className="status-section">
          <h3>데이터 수집 현황</h3>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-icon">📊</div>
              <div className="status-info">
                <div className="status-label">교통량 데이터</div>
                <div className="status-value">정상 수집 중</div>
                <div className="status-time">마지막 업데이트: 14:30:25</div>
              </div>
            </div>
            
            <div className="status-card">
              <div className="status-icon">🚗</div>
              <div className="status-info">
                <div className="status-label">속도 데이터</div>
                <div className="status-value">정상 수집 중</div>
                <div className="status-time">마지막 업데이트: 14:30:20</div>
              </div>
            </div>
            
            <div className="status-card">
              <div className="status-icon">📹</div>
              <div className="status-info">
                <div className="status-label">CCTV 데이터</div>
                <div className="status-value">정상 수집 중</div>
                <div className="status-time">마지막 업데이트: 14:30:28</div>
              </div>
            </div>
            
            <div className="status-card">
              <div className="status-icon">⚠️</div>
              <div className="status-info">
                <div className="status-label">돌발상황 데이터</div>
                <div className="status-value">정상 수집 중</div>
                <div className="status-time">마지막 업데이트: 14:30:22</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 시스템 상태 */}
        <div className="status-section">
          <h3>시스템 상태</h3>
          <div className="system-status">
            <div className="system-item">
              <span className="system-label">데이터베이스</span>
              <span className="system-status-indicator online">연결됨</span>
            </div>
            <div className="system-item">
              <span className="system-label">API 서버</span>
              <span className="system-status-indicator online">정상</span>
            </div>
            <div className="system-item">
              <span className="system-label">웹소켓</span>
              <span className="system-status-indicator online">연결됨</span>
            </div>
            <div className="system-item">
              <span className="system-label">지도 서비스</span>
              <span className="system-status-indicator online">정상</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataStatus;
