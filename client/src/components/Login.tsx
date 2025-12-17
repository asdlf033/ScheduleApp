import React, {useState, useEffect} from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { setToken, isAuthenticated } from '../utils/auth';
import { API_BASE_URL } from '../config/api';

interface LoginFormData {
    email: string;
    password: string;
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

    // JWT 토큰이 유효하면 홈 페이지로 리다이렉트
    useEffect(() => {
        const checkAuth = async () => {
            const authenticated = await isAuthenticated();
            if (authenticated) {
                navigate('/home');
            }
        };
        checkAuth();
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: String(value),
        }));
        if(errors[name as keyof LoginFormData]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof LoginFormData, string>> = {};

        if(!formData.email) {
            newErrors.email = '이메일을 입력해주세요.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = '올바른 이메일 형식이 아닙니다.';
        }

        if(!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();

        if(validateForm()) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                });

                const data = await response.json();

                if(data.success) {
                    // 토큰 저장
                    await setToken(data.token);
                    alert('로그인 성공!');
                    navigate('/home'); // 홈 페이지로 이동
                }else {
                    alert(data.message || '로그인에 실패했습니다.');
                }
            }catch(error) {
                console.error('로그인 오류:', error);
                alert('로그인 중 오류가 발생했습니다.');
            }
        }
    };

    return (
        <div className='login-container'>
            <div className='login-form-wrapper'>
                <h2>로그인</h2>
                <form onSubmit={handleSubmit}>
                    <div className='form-group'>
                        <label htmlFor="email">이메일</label>
                        <input 
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder='이메일을 입력하세요'
                        />
                        {errors.email && <span className='error'>{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호</label>
                        <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="비밀번호를 입력하세요"
                        />
                        {errors.password && <span className="error">{errors.password}</span>}
                    </div>

                    <button type="submit" className="submit-button">
                        로그인
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Link to="/signup" style={{ color: '#007bff', textDecoration: 'none' }}>
                        회원가입
                    </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;