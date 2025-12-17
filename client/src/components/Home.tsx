import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Main.css';
import { getAuthHeaders, removeToken, isAuthenticated } from '../utils/auth';
import { API_BASE_URL } from '../config/api';
import BottomNav from './BottomNav';

interface Todo {
  id: number;
  content: string;
  date: string;
  userId: number;
  userName: string;
  imageUrl?: string | null;
}

interface Goal {
  id: number;
  title: string;
  date: string;
  userId: number;
  isCompleted: boolean;
  completedAt?: string | null;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedTodoId, setExpandedTodoId] = useState<number | null>(null);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);

  useEffect(() => {
    checkAuth();
    loadTodos();
    loadGoals();
  }, [selectedDate]);

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      navigate('/');
    }
  };

  const loadTodos = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/todos?date=${selectedDate}`,
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
      console.error('할일 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      setGoalsLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/goals?date=${selectedDate}`,
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
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('목표 로드 오류:', error);
    } finally {
      setGoalsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    // 스케줄 내용은 필수, 이미지는 선택
    if (!newTodo.trim()) return;

    try {
      const headers = await getAuthHeaders();
      
      // FormData 사용 (이미지 포함)
      const formData = new FormData();
      formData.append('content', newTodo);
      formData.append('date', selectedDate);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Authorization': headers.Authorization || '',
        },
        body: formData,
      });

      if (response.status === 401) {
        await removeToken();
        navigate('/');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setNewTodo('');
        setSelectedImage(null);
        setImagePreview(null);
        loadTodos();
      } else {
        alert(data.message || '할일 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('할일 추가 오류:', error);
      alert('서버에 연결할 수 없습니다.');
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!window.confirm('할일을 삭제하시겠습니까?')) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (response.status === 401) {
        await removeToken();
        navigate('/');
        return;
      }

      const data = await response.json();
      if (data.success) {
        loadTodos();
      }
    } catch (error) {
      console.error('할일 삭제 오류:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0] === selectedDate;
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  return (
    <div className="main-container app-content">
      <div className="main-header">
        <h1 className="app-title">In Schedule</h1>
      </div>

      <div className="main-content">
        <div className="calendar-section">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="month-nav">‹</button>
            <h2>{year}년 {monthNames[month]}</h2>
            <button onClick={handleNextMonth} className="month-nav">›</button>
          </div>

          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-days">
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty"></div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
                  onClick={() => handleDateClick(day)}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="todos-section">
          <h2>{selectedDate} 스케줄</h2>

          <form onSubmit={handleAddTodo} className="todo-form">
            <button type="submit" className="todo-add-btn">
              + 스케줄 추가
            </button>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="무슨 스케줄인가요?"
              className="todo-input"
            />
            <div className="image-upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                id="image-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="image-upload" className="image-upload-btn">
                📷 사진 선택 (선택)
              </label>
              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="미리보기" className="image-preview" />
                  <button type="button" onClick={removeImage} className="remove-image-btn">×</button>
                </div>
              )}
            </div>
          </form>

          <div className="todos-list">
            {loading ? (
              <div>로딩 중...</div>
            ) : todos.length === 0 ? (
              <div className="no-todos">할일이 없습니다.</div>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className="todo-item">
                  <div
                    className="todo-header-row"
                    onClick={() =>
                      setExpandedTodoId(
                        expandedTodoId === todo.id ? null : todo.id
                      )
                    }
                  >
                    <div className="todo-header-main">
                      <span className="todo-text">{todo.content}</span>
                      <span className="todo-author">- {todo.userName}</span>
                    </div>
                    <div className="todo-header-actions">
                      <span
                        className={`todo-expand-icon ${
                          expandedTodoId === todo.id ? 'expanded' : ''
                        }`}
                      >
                        ▼
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTodo(todo.id);
                        }}
                        className="todo-delete-btn"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {expandedTodoId === todo.id && (
                    <div className="todo-detail-drop">
                      <div className="todo-detail-row">
                        <span className="todo-detail-label">내용</span>
                        <p className="todo-detail-text">{todo.content}</p>
                      </div>
                      {todo.imageUrl && (
                        <div className="todo-image-container">
                          <img
                            src={`${API_BASE_URL}${todo.imageUrl}`}
                            alt="할일 이미지"
                            className="todo-image"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="goals-section">
            <div className="goals-header">
              <h2>오늘 목표</h2>
            </div>

            <form
              className="goal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newGoal.trim()) return;
                try {
                  const headers = await getAuthHeaders();
                  const response = await fetch(`${API_BASE_URL}/api/goals`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(headers.Authorization
                        ? { Authorization: headers.Authorization }
                        : {}),
                    },
                    body: JSON.stringify({
                      title: newGoal,
                      date: selectedDate,
                    }),
                  });

                  if (response.status === 401) {
                    await removeToken();
                    navigate('/');
                    return;
                  }

                  const data = await response.json();
                  if (data.success) {
                    setNewGoal('');
                    loadGoals();
                  } else {
                    alert(data.message || '목표 추가에 실패했습니다.');
                  }
                } catch (error) {
                  console.error('목표 추가 오류:', error);
                  alert('서버에 연결할 수 없습니다.');
                }
              }}
            >
              <input
                type="text"
                className="goal-input"
                placeholder="오늘 꼭 달성하고 싶은 목표를 적어보세요"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
              />
              <button type="submit" className="goal-add-btn">
                + 목표 추가
              </button>
            </form>

            <div className="goals-list">
              {goalsLoading ? (
                <div className="goals-loading">목표 불러오는 중...</div>
              ) : goals.length === 0 ? (
                <div className="goals-empty">아직 오늘 목표가 없습니다.</div>
              ) : (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`goal-item ${
                      goal.isCompleted ? 'completed' : ''
                    }`}
                  >
                    <div className="goal-main">
                      <span className="goal-title">{goal.title}</span>
                      {goal.isCompleted && (
                        <span className="goal-status">달성 완료!</span>
                      )}
                    </div>
                    {!goal.isCompleted && (
                      <button
                        type="button"
                        className="goal-complete-btn"
                        onClick={async () => {
                          try {
                            const headers = await getAuthHeaders();
                            const response = await fetch(
                              `${API_BASE_URL}/api/goals/${goal.id}/complete`,
                              {
                                method: 'PATCH',
                                headers: {
                                  ...(headers.Authorization
                                    ? { Authorization: headers.Authorization }
                                    : {}),
                                },
                              }
                            );

                            if (response.status === 401) {
                              await removeToken();
                              navigate('/');
                              return;
                            }

                            const data = await response.json();
                            if (data.success) {
                              loadGoals();
                              setShowCelebrate(true);
                              setTimeout(
                                () => setShowCelebrate(false),
                                1800
                              );
                            } else {
                              alert(
                                data.message ||
                                  '목표 달성 처리에 실패했습니다.'
                              );
                            }
                          } catch (error) {
                            console.error('목표 달성 오류:', error);
                            alert('서버에 연결할 수 없습니다.');
                          }
                        }}
                      >
                        달성!
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showCelebrate && (
        <div className="celebrate-overlay">
          <div className="celebrate-content">
            <div className="celebrate-burst" />
            <p className="celebrate-text">목표 달성! 잘했어요 🎉</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Home;

