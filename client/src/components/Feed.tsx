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
  profileImageUrl: string | null;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
}

interface Comment {
  id: number;
  content: string;
  userId: number;
  userName: string;
  profileImageUrl: string | null;
  createdAt: string;
}

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<FeedTodo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<FeedTodo | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    checkAuth();
    loadFeed();
  }, []);

  useEffect(() => {
    if (selectedTodo) {
      loadComments(selectedTodo.id);
    }
  }, [selectedTodo]);

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      navigate('/');
    }
  };

  const loadFeed = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/todos/feed?page=1&limit=20`,
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
      }
    } catch (error) {
      console.error('피드 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (todoId: number) => {
    try {
      setLoadingComments(true);
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/todos/${todoId}/comments`,
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
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('댓글 로드 오류:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async (todo: FeedTodo, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/todos/${todo.id}/like`,
        {
          method: 'POST',
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
        // 피드 목록 업데이트
        setTodos(todos.map(t => 
          t.id === todo.id 
            ? { ...t, isLiked: data.liked, likeCount: data.liked ? t.likeCount + 1 : t.likeCount - 1 }
            : t
        ));

        // 상세보기에서도 업데이트
        if (selectedTodo && selectedTodo.id === todo.id) {
          setSelectedTodo({
            ...selectedTodo,
            isLiked: data.liked,
            likeCount: data.liked ? selectedTodo.likeCount + 1 : selectedTodo.likeCount - 1
          });
        }
      }
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTodo || !newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch(
        `${API_BASE_URL}/api/todos/${selectedTodo.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(headers.Authorization ? { Authorization: headers.Authorization } : {}),
          },
          body: JSON.stringify({ content: newComment.trim() }),
        }
      );

      if (response.status === 401) {
        await removeToken();
        navigate('/');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        await loadComments(selectedTodo.id);
      } else {
        alert(data.message || '댓글 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 추가 오류:', error);
      alert('서버에 연결할 수 없습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (days > 0) {
      return `${days}일 전`;
    } else if (hours > 0) {
      return `${hours}시간 전`;
    } else if (minutes > 0) {
      return `${minutes}분 전`;
    } else {
      return '방금 전';
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="feed-container app-content">
      <div className="feed-header">
        <h1>둘러보기</h1>
      </div>

      {loading ? (
        <div className="feed-loading">로딩 중...</div>
      ) : todos.length === 0 ? (
        <div className="feed-empty">아직 게시글이 없습니다.</div>
      ) : (
        <div className="feed-list">
          {todos.map((todo) => (
            <div key={todo.id} className="feed-post">
              {/* 프로필 헤더 */}
              <div className="feed-post-header">
                <div className="feed-profile">
                  <div className="feed-profile-image">
                    {todo.profileImageUrl ? (
                      <img 
                        src={`${API_BASE_URL}${todo.profileImageUrl}`} 
                        alt={todo.userName}
                      />
                    ) : (
                      <div className="feed-profile-initials">
                        {getInitials(todo.userName)}
                      </div>
                    )}
                  </div>
                  <div className="feed-profile-info">
                    <div className="feed-profile-name">{todo.userName}</div>
                    <div className="feed-post-date">{formatDate(todo.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* 이미지 */}
              {todo.imageUrl && (
                <div 
                  className="feed-post-image-wrapper"
                  onClick={() => {
                    setSelectedTodo(todo);
                    setShowDetailSheet(true);
                  }}
                >
                  <img 
                    src={`${API_BASE_URL}${todo.imageUrl}`} 
                    alt={todo.content}
                    className="feed-post-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* 좋아요 표시 (읽기 전용) */}
              <div className="feed-post-likes-display">
                {todo.likeCount > 0 && (
                  <div className="feed-likes-count-display">
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill={todo.isLiked ? "#ff3040" : "none"} 
                      stroke={todo.isLiked ? "#ff3040" : "#e8ecf4"} 
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>{todo.likeCount}</span>
                  </div>
                )}
              </div>

              {/* 내용 */}
              <div 
                className="feed-post-content"
                onClick={() => {
                  setSelectedTodo(todo);
                  setShowDetailSheet(true);
                }}
              >
                <span className="feed-post-author">{todo.userName}</span>
                <span className="feed-post-text"> {todo.content}</span>
              </div>

              {/* 댓글 미리보기 제거 - 클릭하면 상세보기에서 댓글 확인 가능 */}
            </div>
          ))}
        </div>
      )}

      {/* 상세보기 Bottom Sheet */}
      {showDetailSheet && selectedTodo && (
        <>
          <div 
            className="feed-detail-overlay"
            onClick={() => {
              setShowDetailSheet(false);
              setSelectedTodo(null);
              setComments([]);
            }}
          ></div>
          <div className="feed-detail-sheet">
            <div className="feed-detail-header">
              <h3>게시글</h3>
              <button 
                className="feed-detail-close"
                onClick={() => {
                  setShowDetailSheet(false);
                  setSelectedTodo(null);
                  setComments([]);
                }}
              >
                ×
              </button>
            </div>

            <div className="feed-detail-content">
              {/* 프로필 */}
              <div className="feed-detail-profile">
                <div className="feed-profile-image">
                  {selectedTodo.profileImageUrl ? (
                    <img 
                      src={`${API_BASE_URL}${selectedTodo.profileImageUrl}`} 
                      alt={selectedTodo.userName}
                    />
                  ) : (
                    <div className="feed-profile-initials">
                      {getInitials(selectedTodo.userName)}
                    </div>
                  )}
                </div>
                <div className="feed-profile-info">
                  <div className="feed-profile-name">{selectedTodo.userName}</div>
                  <div className="feed-post-date">{formatDate(selectedTodo.createdAt)}</div>
                </div>
              </div>

              {/* 이미지 */}
              {selectedTodo.imageUrl && (
                <div className="feed-detail-image-wrapper">
                  <img 
                    src={`${API_BASE_URL}${selectedTodo.imageUrl}`} 
                    alt={selectedTodo.content}
                    className="feed-detail-image"
                  />
                </div>
              )}

              {/* 내용 */}
              <div className="feed-detail-text">
                <span className="feed-post-author">{selectedTodo.userName}</span>
                <span className="feed-post-text"> {selectedTodo.content}</span>
              </div>

              {/* 좋아요 */}
              <div className="feed-detail-actions">
                <button
                  className={`feed-like-btn ${selectedTodo.isLiked ? 'liked' : ''}`}
                  onClick={(e) => handleLike(selectedTodo, e)}
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill={selectedTodo.isLiked ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
                {selectedTodo.likeCount > 0 && (
                  <span className="feed-like-count">{selectedTodo.likeCount}개 좋아요</span>
                )}
              </div>

              {/* 댓글 목록 */}
              <div className="feed-detail-comments">
                <h4>댓글</h4>
                {loadingComments ? (
                  <div className="feed-comments-loading">로딩 중...</div>
                ) : comments.length === 0 ? (
                  <div className="feed-comments-empty">댓글이 없습니다.</div>
                ) : (
                  <div className="feed-comments-list">
                    {comments.map((comment) => (
                      <div key={comment.id} className="feed-comment-item">
                        <div className="feed-comment-profile">
                          {comment.profileImageUrl ? (
                            <img 
                              src={`${API_BASE_URL}${comment.profileImageUrl}`} 
                              alt={comment.userName}
                            />
                          ) : (
                            <div className="feed-profile-initials-small">
                              {getInitials(comment.userName)}
                            </div>
                          )}
                        </div>
                        <div className="feed-comment-content">
                          <div className="feed-comment-header">
                            <span className="feed-comment-author">{comment.userName}</span>
                            <span className="feed-comment-date">{formatDate(comment.createdAt)}</span>
                          </div>
                          <div className="feed-comment-text">{comment.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 댓글 입력 */}
              <form onSubmit={handleAddComment} className="feed-comment-form">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글 달기..."
                  className="feed-comment-input"
                  disabled={submittingComment}
                />
                <button
                  type="submit"
                  className="feed-comment-submit"
                  disabled={!newComment.trim() || submittingComment}
                >
                  게시
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Feed;
