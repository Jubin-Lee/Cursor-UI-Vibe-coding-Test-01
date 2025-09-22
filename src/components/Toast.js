import React, { useState, useEffect, useRef } from 'react';
import './Toast.css';
import IncidentModal from './IncidentModal';

const Toast = ({ alarmEnabled = true }) => {
  const [toasts, setToasts] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toastIndexRef = useRef(0);

  // 테스트용 토스트 데이터 (원래 HTML과 동일)
  const testIncidents = [
    { id: "TEST1", type: "사고", segmentId: "S3", time: "10:15", note: "추돌사고 발생", direction: "상행" },
    { id: "TEST2", type: "고장차량", segmentId: "S7", time: "10:18", note: "견인 대기중", direction: "하행" },
    { id: "TEST3", type: "장애물", segmentId: "S5", time: "10:22", note: "낙하물 제거중", direction: "상행" },
    { id: "TEST4", type: "공사", segmentId: "S10", time: "10:25", note: "도로 공사 진행", direction: "하행" },
    { id: "TEST5", type: "교통정체", segmentId: "S2", time: "10:28", note: "정체 구간 발생", direction: "상행" },
    { id: "TEST6", type: "사고", segmentId: "S8", time: "10:31", note: "단순 접촉사고", direction: "하행" },
    { id: "TEST7", type: "고장차량", segmentId: "S1", time: "10:34", note: "타이어 펑크", direction: "상행" },
    { id: "TEST8", type: "장애물", segmentId: "S9", time: "10:37", note: "낙하물 발견", direction: "하행" }
  ];

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

  const showToast = (incident) => {
    if (!alarmEnabled) return;

    const toastId = Date.now();
    const newToast = {
      id: toastId,
      message: `[${incident.type}] ${getSegName(incident.segmentId)} ${incident.time}`,
      incident: incident
    };

    setToasts(prev => [...prev, newToast]);

    // 3초 후 자동 제거
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== toastId));
    }, 3000);
  };

  useEffect(() => {
    if (!alarmEnabled) {
      setToasts([]);
      return;
    }

    // 즉시 첫 번째 토스트 표시 (1초 후)
    const timer1 = setTimeout(() => {
      showToast(testIncidents[0]);
    }, 1000);

    // 추가 테스트: 3초 후
    const timer2 = setTimeout(() => {
      showToast(testIncidents[1]);
    }, 3000);

    // 자동 토스트 알림 (5초마다) - 원래보다 조금 더 자주
    const interval = setInterval(() => {
      const incident = testIncidents[toastIndexRef.current % testIncidents.length];
      showToast(incident);
      toastIndexRef.current++;
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearInterval(interval);
    };
  }, [alarmEnabled]);

  const handleToastClick = (toast) => {
    console.log('토스트 클릭됨:', toast.incident);
    setSelectedIncident(toast.incident);
    setIsModalOpen(true);
    setToasts(prev => prev.filter(t => t.id !== toast.id));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedIncident(null);
  };

  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="toast show"
          onClick={() => handleToastClick(toast)}
          role="status"
          aria-live="polite"
          style={{
            top: `${50 + (index * 80)}px`,
            zIndex: 10000 + index
          }}
        >
          {toast.message}
        </div>
      ))}
      
      {/* 돌발상황 모달 */}
      <IncidentModal 
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default Toast;



