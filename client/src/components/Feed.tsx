import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Feed.css';
import { getAuthHeaders, removeToken, isAuthenticated } from '../utils/auth';
import { API_BASE_URL } from '../config/api';
import BottomNav from './BottomNav';

interface FeedTodo {
  id: number;
  content: string;
  date: string;
  imageUrl: string | null;
  userId: number;
  userName: string;
  createdAt: string;
}

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<FeedTodo[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    checkAuth();
    loadFeed();
  }, [currentPage]);

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      navigate('/');
    }
  };

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/todos/feed?page=${currentPage}&limit=${ITEMS_PER_PAGE}`,
        {
          method: 'GET',
          headers: headers,
        }
      );

      if (response.status === 401) {
        await removeToken();
        navigate('/');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setTodos(data.todos || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.message || '피드를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('피드 로드 오류:', error);
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="feed-container app-content">
      <div className="feed-header">
        <h1>소통</h1>
        <p className="feed-subtitle">다른 사람들의 할일을 확인해보세요</p>
      </div>

      {loading && (
        <div className="loading">로딩 중...</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="feed-list">
            {todos.length === 0 ? (
              <div className="no-feed">아직 게시글이 없습니다.</div>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className="feed-item">
                  <div className="feed-item-header">
                    <div className="feed-author">
                      <span className="author-name">{todo.userName}</span>
                      <span className="feed-date">{formatDate(todo.date)}</span>
                    </div>
                  </div>
                  <div className="feed-content">
                    <p className="feed-text">{todo.content}</p>
                    {todo.imageUrl && (
                      <div className="feed-image-container">
                        <img 
                          src={`${API_BASE_URL}${todo.imageUrl}`} 
                          alt="할일 이미지" 
                          className="feed-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pagination">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              이전
            </button>
            <span className="pagination-info">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="pagination-btn"
            >
              다음
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Feed;

