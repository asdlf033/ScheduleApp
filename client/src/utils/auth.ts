// 토큰 저장
export const setToken = (token: string) => {
    localStorage.setItem('token', token);
}

// 토큰 가져오기
export const getToken = (): string | null => {
    return localStorage.getItem('token');
}

// 토큰 삭제
export const removeToken = () => {
    localStorage.removeItem('token');
}

// 토큰 유효성 검증 (만료 시간 확인)
export const isTokenValid = (): boolean => {
    const token = getToken();
    if (!token) return false;

    try {
        // JWT 토큰의 payload 부분 디코딩
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        // 만료 시간 확인
        if (payload.exp && payload.exp < currentTime) {
            removeToken(); // 만료된 토큰 삭제
            return false;
        }
        return true;
    } catch (error) {
        console.error('토큰 검증 오류:', error);
        removeToken();
        return false;
    }
}

// 인증된 요청 헤더
export const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

// 로그인 상태 확인
export const isAuthenticated = (): boolean => {
    return isTokenValid();
}