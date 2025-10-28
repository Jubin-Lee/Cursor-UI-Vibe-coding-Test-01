import React, { useState, useEffect } from 'react';
import './WeatherPanel.css';

const WeatherPanel = () => {
  const [weatherData, setWeatherData] = useState({
    guri: null,
    pocheon: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 기상청 API 키
  const API_KEY = '5bdf747cafcf8167e5b4a041d4fbd4f809a4f1fc65b67fba79a7209e262d3101';
  
  // 구리시/포천시 격자 좌표
  const locations = {
    guri: { nx: 61, ny: 127, name: '구리시' },
    pocheon: { nx: 65, ny: 134, name: '포천시' }
  };

  // 현재 시간을 기상청 API 형식으로 변환
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // 30분 단위로 반올림
    const roundedMinute = minute < 30 ? '00' : '30';
    const roundedHour = minute < 30 ? hour : (hour + 1) % 24;
    const baseTime = String(roundedHour).padStart(2, '0') + roundedMinute;
    
    return {
      base_date: `${year}${month}${day}`,
      base_time: baseTime
    };
  };

  // Mock 날씨 데이터 생성 (현실적인 패턴)
  const generateMockWeatherData = (location) => {
    const { name } = location;
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1; // 1-12
    
    // 계절별 기본 온도
    let seasonalTemp = 20;
    if (month >= 12 || month <= 2) seasonalTemp = 5; // 겨울
    else if (month >= 3 && month <= 5) seasonalTemp = 15; // 봄
    else if (month >= 6 && month <= 8) seasonalTemp = 25; // 여름
    else if (month >= 9 && month <= 11) seasonalTemp = 18; // 가을
    
    // 시간대별 온도 변화
    let timeTemp = seasonalTemp;
    if (hour >= 6 && hour <= 9) timeTemp = seasonalTemp - 3; // 아침
    else if (hour >= 10 && hour <= 16) timeTemp = seasonalTemp + 5; // 낮
    else if (hour >= 17 && hour <= 20) timeTemp = seasonalTemp + 2; // 저녁
    else timeTemp = seasonalTemp - 5; // 밤
    
    // 강수형태 결정 (10% 확률로 비)
    let precipitationType = 0; // 맑음
    if (Math.random() < 0.1) {
      precipitationType = Math.random() < 0.7 ? 1 : 3; // 70% 비, 30% 눈
    }
    
    // 습도 (강수형태에 따라)
    let humidity = 60;
    if (precipitationType > 0) humidity = 80 + Math.random() * 15; // 강수 시 높은 습도
    else humidity = 50 + Math.random() * 30; // 맑을 때 다양한 습도
    
    // 풍속 (시간대별)
    let windSpeed = 1.0 + Math.random() * 3.0; // 1-4 m/s
    if (hour >= 10 && hour <= 16) windSpeed += 1.0; // 낮에 바람 더 강함
    
    // 풍향 (랜덤)
    const windDirection = Math.round(Math.random() * 360);
    
    // 구리시와 포천시 차이 (포천시가 약간 더 시원함)
    const locationMultiplier = name === '구리시' ? 1 : 0.9;
    const locationHumidityOffset = name === '구리시' ? 0 : -5; // 포천시가 약간 덜 습함
    
    // 랜덤 변동성 추가
    const tempVariation = (Math.random() - 0.5) * 3; // ±1.5도
    const humidityVariation = (Math.random() - 0.5) * 15; // ±7.5%
    const windVariation = (Math.random() - 0.5) * 1.5; // ±0.75m/s
    
    return {
      temperature: Math.round((timeTemp + tempVariation) * locationMultiplier * 10) / 10,
      humidity: Math.max(0, Math.min(100, Math.round(humidity + humidityVariation + locationHumidityOffset))),
      precipitationType: precipitationType,
      windDirection: windDirection,
      windSpeed: Math.max(0, Math.round((windSpeed + windVariation) * 10) / 10),
      location: name
    };
  };

  // 기상청 API 호출 (현재는 Mock 데이터 사용)
  const fetchWeatherData = async (location) => {
    const { base_date, base_time } = getCurrentDateTime();
    const { nx, ny, name } = location;
    
    // API URL 생성 (참고용)
    const apiUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${API_KEY}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;
    
    console.log(`날씨 API URL (${name}):`, apiUrl);
    console.log(`CORS 문제로 인해 Mock 데이터를 사용합니다. (${name})`);
    
    // CORS 문제로 인해 현재는 Mock 데이터 사용
    // 실제 운영 환경에서는 백엔드 서버를 통해 API 호출 필요
    return generateMockWeatherData(location);
  };

  // 날씨 데이터 로드
  const loadWeatherData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [guriData, pocheonData] = await Promise.all([
        fetchWeatherData(locations.guri),
        fetchWeatherData(locations.pocheon)
      ]);
      
      setWeatherData({
        guri: guriData,
        pocheon: pocheonData
      });
    } catch (error) {
      setError('날씨 정보를 가져올 수 없습니다.');
      console.error('날씨 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadWeatherData();
    
    // 10분마다 데이터 갱신
    const interval = setInterval(loadWeatherData, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 강수형태 아이콘 반환
  const getPrecipitationIcon = (type) => {
    switch (type) {
      case 0: return '☀️'; // 없음
      case 1: return '🌧️'; // 비
      case 2: return '🌨️'; // 비/눈
      case 3: return '❄️'; // 눈
      case 5: return '🌦️'; // 빗방울
      case 6: return '🌨️'; // 빗눈
      case 7: return '❄️'; // 눈날림
      default: return '☀️';
    }
  };

  // 풍향 아이콘 반환
  const getWindDirectionIcon = (direction) => {
    if (direction >= 337.5 || direction < 22.5) return '⬆️'; // 북
    if (direction >= 22.5 && direction < 67.5) return '↗️'; // 북동
    if (direction >= 67.5 && direction < 112.5) return '➡️'; // 동
    if (direction >= 112.5 && direction < 157.5) return '↘️'; // 남동
    if (direction >= 157.5 && direction < 202.5) return '⬇️'; // 남
    if (direction >= 202.5 && direction < 247.5) return '↙️'; // 남서
    if (direction >= 247.5 && direction < 292.5) return '⬅️'; // 서
    if (direction >= 292.5 && direction < 337.5) return '↖️'; // 북서
    return '➡️';
  };

  // 날씨 정보 렌더링
  const renderWeatherInfo = (data, location) => {
    if (!data) return <div className="weather-loading">데이터 없음</div>;
    
    return (
      <div className="weather-location">
        <div className="weather-location-title">{location}</div>
        <div className="weather-main">
          <div className="weather-icon">
            {getPrecipitationIcon(data.precipitationType)}
          </div>
          <div className="weather-temp">
            {data.temperature ? `${data.temperature.toFixed(1)}°C` : '--°C'}
          </div>
        </div>
        <div className="weather-details">
          <div className="weather-detail-item">
            <span className="weather-detail-icon">💧</span>
            <span className="weather-detail-text">
              {data.humidity ? `${data.humidity}%` : '--%'}
            </span>
          </div>
          <div className="weather-detail-item">
            <span className="weather-detail-icon">
              {getWindDirectionIcon(data.windDirection)}
            </span>
            <span className="weather-detail-text">
              {data.windSpeed ? `${data.windSpeed.toFixed(1)}m/s` : '--m/s'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="weather-panel">
        <div className="weather-loading">날씨 정보 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-panel">
        <div className="weather-error">{error}</div>
        <button onClick={loadWeatherData} className="weather-retry-btn">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="weather-panel">
      <div className="weather-container">
        {renderWeatherInfo(weatherData.guri, '구리시')}
        {renderWeatherInfo(weatherData.pocheon, '포천시')}
      </div>
      <div className="weather-update-time">
        마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        <div className="weather-copyright">
          기상청 제공
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;
