// client/src/pages/SignUp.tsx 또는 client/src/components/SignUp.tsx

import React, { useState } from 'react';
import './SignUp.css'; 
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: String(value), // 명시적으로 string으로 변환
    }));
    // 에러 초기화
    if (errors[name as keyof SignUpFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SignUpFormData, string>> = {};

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        console.log('API URL:', `${API_BASE_URL}/api/auth/signup`);
        
        // 타임아웃 설정 (10초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText || '서버 오류가 발생했습니다.' };
          }
          alert(errorData.message || '회원가입에 실패했습니다.');
          return;
        }

        const data = await response.json();

        if (data.success) {
          alert('회원가입이 완료되었습니다!');
          navigate('/login');
        } else {
          alert(data.message || '회원가입에 실패했습니다.');
        }
      } catch (error: any) {
        console.error('회원가입 오류:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('API URL 시도:', `${API_BASE_URL}/api/auth/signup`);
        
        let errorMessage = '서버에 연결할 수 없습니다.';
        if (error.name === 'AbortError') {
          errorMessage = '서버 응답 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.';
        } else if (error.message) {
          errorMessage = `연결 오류: ${error.message}`;
        }
        
        const debugInfo = `오류 상세:\n- 오류 타입: ${error.name}\n- 오류 메시지: ${error.message}\n\n시도한 URL:\n${API_BASE_URL}/api/auth/signup\n\n해결 방법:\n1. Android Studio에서 앱 재빌드 (Build → Rebuild Project)\n2. 에뮬레이터 재시작\n3. 서버 실행 확인: http://localhost:5000\n\n에뮬레이터용: http://10.0.2.2:5000\n실제 기기용: http://192.168.219.184:5000`;
        
        alert(`${errorMessage}\n\n${debugInfo}`);
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form-wrapper">
        <h2>회원가입</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요 (최소 8자)"
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
            />
            {errors.confirmPassword && (
              <span className="error">{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="submit-button">
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;