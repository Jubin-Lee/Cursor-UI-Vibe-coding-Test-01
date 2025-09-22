import React, { useState } from 'react';
import './BottomPanels.css';
import IncidentModal from './IncidentModal';
import SpeedGauge from './SpeedGauge';

const BottomPanels = ({ selectedSegment = null }) => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 돌발상황 데이터 (세로 스크롤 테스트를 위해 더 많은 데이터 추가)
  const incidents = [
    { 
      id: "E201", 
      type: "사고", 
      segmentId: "S3", 
      time: "14:03", 
      lane: "2차로", 
      severity: "중", 
      note: "추돌 2건", 
      direction: "상행" 
    },
    { 
      id: "E202", 
      type: "장애물", 
      segmentId: "S7", 
      time: "14:12", 
      lane: "1차로", 
      severity: "하", 
      note: "낙하물 제거중", 
      direction: "하행" 
    },
    { 
      id: "E203", 
      type: "고장차량", 
      segmentId: "S2", 
      time: "14:18", 
      lane: "갓길", 
      severity: "하", 
      note: "견인 대기", 
      direction: "상행" 
    },
    { 
      id: "E204", 
      type: "공사", 
      segmentId: "S5", 
      time: "14:25", 
      lane: "3차로", 
      severity: "중", 
      note: "도로 공사 진행", 
      direction: "하행" 
    },
    { 
      id: "E205", 
      type: "교통정체", 
      segmentId: "S1", 
      time: "14:30", 
      lane: "전차로", 
      severity: "중", 
      note: "정체 구간 발생", 
      direction: "상행" 
    },
    { 
      id: "E206", 
      type: "사고", 
      segmentId: "S8", 
      time: "14:35", 
      lane: "1차로", 
      severity: "하", 
      note: "단순 접촉사고", 
      direction: "하행" 
    },
    { 
      id: "E207", 
      type: "고장차량", 
      segmentId: "S9", 
      time: "14:40", 
      lane: "갓길", 
      severity: "하", 
      note: "타이어 펑크", 
      direction: "상행" 
    },
    { 
      id: "E208", 
      type: "장애물", 
      segmentId: "S4", 
      time: "14:45", 
      lane: "2차로", 
      severity: "하", 
      note: "낙하물 발견", 
      direction: "하행" 
    }
  ];

  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedIncident(null);
  };

  const getSegName = (segmentId) => {
    const segmentNames = {
      'S1': '남구리IC-중랑IC',
      'S2': '중랑IC-갈매동구릉TG', 
      'S3': '갈매동구릉TG-남별내IC',
      'S4': '남별내IC-동의정부IC',
      'S5': '동의정부IC-민락IC',
      'S6': '민락IC-소흘IC',
      'S7': '소흘IC-소흘JCT',
      'S8': '소흘JCT-선단IC',
      'S9': '선단IC-포천IC',
      'S10': '포천IC-신북IC'
    };
    return segmentNames[segmentId] || segmentId;
  };

  // 소통정보 패널 제목 생성
  const getTrafficInfoTitle = () => {
    if (!selectedSegment) {
      return '소통정보 (전체구간 평균)';
    }
    
    let direction;
    if (selectedSegment.isBranch) {
      // 지선 구간의 경우
      direction = selectedSegment.direction === 'up' ? '양주방향' : '소흘방향';
    } else {
      // 본선 구간의 경우
      direction = selectedSegment.direction === 'up' ? '포천방향' : '구리방향';
    }
    
    return `소통정보 (${selectedSegment.name} ${direction})`;
  };
  return (
    <section className="bottom-panels">
      <div className="panel">
        <div className="panel-header">{getTrafficInfoTitle()}</div>
        <div className="panel-body">
          <SpeedGauge selectedSegment={selectedSegment} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">돌발/특별상황</div>
        <div className="panel-body">
          <div className="event-list">
            {incidents.map((incident) => (
              <div 
                key={incident.id}
                className="event-item clickable"
                onClick={() => handleIncidentClick(incident)}
                style={{ cursor: 'pointer' }}
              >
                <div className="event-time">{incident.time}</div>
                <div className="event-type">
                  {incident.type} - {getSegName(incident.segmentId)}
                </div>
              </div>
            ))}
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
      
      {/* 돌발상황 모달 */}
      <IncidentModal 
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
};

export default BottomPanels;



