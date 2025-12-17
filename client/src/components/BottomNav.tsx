import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${isActive('/home') ? 'active' : ''}`}
        onClick={() => navigate('/home')}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">홈</span>
      </button>
      <button
        className={`nav-item ${isActive('/feed') ? 'active' : ''}`}
        onClick={() => navigate('/feed')}
      >
        <span className="nav-icon">💬</span>
        <span className="nav-label">소통</span>
      </button>
      <button
        className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
        onClick={() => navigate('/settings')}
      >
        <span className="nav-icon">⚙️</span>
        <span className="nav-label">설정</span>
      </button>
    </nav>
  );
};

export default BottomNav;

