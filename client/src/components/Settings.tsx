import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';
import { removeToken, isAuthenticated } from '../utils/auth';
import BottomNav from './BottomNav';

const Settings: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await removeToken();
      navigate('/');
    }
  };

  return (
    <div className="settings-container app-content">
      <div className="settings-header">
        <h1>설정</h1>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2 className="section-title">계정</h2>
          <button onClick={handleLogout} className="logout-button">
            로그아웃
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;

