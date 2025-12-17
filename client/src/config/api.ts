// API 기본 URL 설정
// 웹: localhost 사용
// Android 에뮬레이터: 10.0.2.2 사용 (localhost를 가리킴)
// iOS 시뮬레이터: localhost 사용
// 실제 기기: 컴퓨터의 실제 IP 주소 사용

import { Capacitor } from '@capacitor/core';

const getApiBaseUrl = (): string => {
  // 환경 변수에서 가져오기 (설정된 경우)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Capacitor 네이티브 플랫폼 확인
  if (Capacitor.isNativePlatform()) {
    // Android 에뮬레이터 또는 기기
    if (Capacitor.getPlatform() === 'android') {
      // ⚠️ 중요: 에뮬레이터와 실제 기기 구분
      // 에뮬레이터: 10.0.2.2 사용 (호스트의 localhost를 가리킴)
      // 실제 기기: 컴퓨터의 실제 IP 주소 사용 (192.168.219.184)
      
      // 에뮬레이터에서는 반드시 10.0.2.2 사용
      // 실제 기기에서는 192.168.219.184 사용 필요
      // 현재는 에뮬레이터용으로 10.0.2.2 사용
      return 'http://10.0.2.2:5000';
    }
    // iOS 시뮬레이터 (localhost 작동)
    // iOS 실제 기기는 컴퓨터 IP 주소 필요
    return 'http://localhost:5000';
  }

  // 웹 브라우저
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// 디버깅: API URL 출력
if (typeof window !== 'undefined') {
  console.log('API Base URL:', API_BASE_URL);
  console.log('Platform:', Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web');
}

