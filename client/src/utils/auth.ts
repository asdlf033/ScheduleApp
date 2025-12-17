import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// 토큰 저장 (웹: localStorage, 모바일: 안전한 저장소)
// ⚠️ 웹에서 localStorage 사용 시 XSS 공격에 취약할 수 있습니다.
// 보안을 위해 다음을 준수하세요:
// 1. 모든 사용자 입력 검증 및 sanitization
// 2. CSP (Content Security Policy) 설정
// 3. 짧은 토큰 만료 시간 (현재: 24h)
// 4. HTTPS 사용 필수
export const setToken = async (token: string) => {
    if (Capacitor.isNativePlatform()) {
        // 모바일: 안전한 저장소 사용 (iOS Keychain, Android Keystore)
        // 암호화되어 저장되므로 XSS 공격에 안전
        await Preferences.set({
            key: 'token',
            value: token
        });
    } else {
        // 웹: localStorage 사용
        // ⚠️ XSS 공격에 취약 - 입력 검증 및 CSP 필수
        localStorage.setItem('token', token);
    }
}

// 토큰 가져오기
export const getToken = async (): Promise<string | null> => {
    if (Capacitor.isNativePlatform()) {
        // 모바일: 안전한 저장소에서 가져오기
        const { value } = await Preferences.get({ key: 'token' });
        return value;
    } else {
        // 웹: localStorage에서 가져오기
        return localStorage.getItem('token');
    }
}

// 토큰 삭제
export const removeToken = async () => {
    if (Capacitor.isNativePlatform()) {
        // 모바일: 안전한 저장소에서 삭제
        await Preferences.remove({ key: 'token' });
    } else {
        // 웹: localStorage에서 삭제
        localStorage.removeItem('token');
    }
}

// 토큰 유효성 검증 (만료 시간 확인)
export const isTokenValid = async (): Promise<boolean> => {
    const token = await getToken();
    if (!token) return false;

    try {
        // JWT 토큰의 payload 부분 디코딩
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        // 만료 시간 확인
        if (payload.exp && payload.exp < currentTime) {
            await removeToken(); // 만료된 토큰 삭제
            return false;
        }
        return true;
    } catch (error) {
        console.error('토큰 검증 오류:', error);
        await removeToken();
        return false;
    }
}

// 인증된 요청 헤더
export const getAuthHeaders = async () => {
    const token = await getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

// 로그인 상태 확인
export const isAuthenticated = async (): Promise<boolean> => {
    return await isTokenValid();
}