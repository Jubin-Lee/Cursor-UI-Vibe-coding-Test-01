import React from 'react';
import './IncidentModal.css';

const IncidentModal = ({ incident, isOpen, onClose }) => {
  if (!isOpen || !incident) return null;

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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="incident-modal" onClick={handleBackdropClick}>
      <div className="incident-modal-content">
        <span className="incident-modal-close" onClick={onClose}>
          &times;
        </span>
        <h2 className="incident-modal-title">{incident.type}</h2>
        <div className="incident-modal-body">
          <p className="incident-note">{incident.note}</p>
          <p><strong>위치:</strong> <span className="incident-segment">{getSegName(incident.segmentId)}</span></p>
          <p><strong>방향:</strong> <span className="incident-direction">{incident.direction || '상행'}</span></p>
          <p><strong>차로:</strong> <span className="incident-lane">{incident.lane}</span></p>
          <p><strong>시간:</strong> <span className="incident-time">{incident.time}</span></p>
          <div className="incident-video-container">
            <video controls autoplay muted width="100%" height="240">
              <source src="https://samplelib.com/lib/preview/mp4/sample-5s.mp4" type="video/mp4" />
              브라우저가 비디오를 지원하지 않습니다.
            </video>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentModal;

