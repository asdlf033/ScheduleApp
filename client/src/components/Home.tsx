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

  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showGoalBottomSheet, setShowGoalBottomSheet] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [showTodoDetailSheet, setShowTodoDetailSheet] = useState(false);
  const [completingGoalId, setCompletingGoalId] = useState<number | null>(null);
  const [isEditingTodo, setIsEditingTodo] = useState(false);
  const [editTodoContent, setEditTodoContent] = useState('');
  const [editTodoImage, setEditTodoImage] = useState<File | null>(null);
  const [editTodoImagePreview, setEditTodoImagePreview] = useState<string | null>(null);

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

  const handleAddTodo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // 스케줄 내용은 필수, 이미지는 선택 (없어도 추가 가능)
    if (!newTodo.trim()) {
      alert('스케줄 내용을 입력해주세요.');
      return;
    }

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
        handleCloseBottomSheet();
      } else {
        alert(data.message || '할일 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('할일 추가 오류:', error);
      alert('서버에 연결할 수 없습니다.');
    }
  };

  const handleAddGoal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        handleCloseGoalBottomSheet();
        loadGoals();
      } else {
        alert(data.message || '목표 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('목표 추가 오류:', error);
      alert('서버에 연결할 수 없습니다.');
    }
  };

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
    setNewTodo('');
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleCloseGoalBottomSheet = () => {
    setShowGoalBottomSheet(false);
    setNewGoal('');
  };

  const handleDeleteTodo = async (id: number) => {
    if (!window.confirm('스케줄을 삭제하시겠습니까?')) return;

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
        setShowTodoDetailSheet(false);
        setSelectedTodo(null);
        loadTodos();
      } else {
        alert(data.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('할일 삭제 오류:', error);
      alert('서버에 연결할 수 없습니다.');
    }
  };

  const handleEditTodoImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      setEditTodoImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditTodoImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeEditTodoImage = () => {
    setEditTodoImage(null);
    setEditTodoImagePreview(null);
  };

  const handleUpdateTodo = async () => {
    if (!selectedTodo || (!editTodoContent.trim() && !editTodoImage)) {
      alert('내용 또는 이미지를 입력해주세요.');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      
      const formData = new FormData();
      formData.append('content', editTodoContent);
      if (editTodoImage) {
        formData.append('image', editTodoImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/todos/${selectedTodo.id}`, {
        method: 'PATCH',
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
        setIsEditingTodo(false);
        setEditTodoContent('');
        setEditTodoImage(null);
        setEditTodoImagePreview(null);
        loadTodos();
        setShowTodoDetailSheet(false);
        setSelectedTodo(null);
      } else {
        alert(data.message || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('할일 수정 오류:', error);
      alert('서버에 연결할 수 없습니다.');
    }
  };

  const handleStartEdit = () => {
    if (selectedTodo) {
      setEditTodoContent(selectedTodo.content);
      setEditTodoImage(null);
      setEditTodoImagePreview(selectedTodo.imageUrl ? `${API_BASE_URL}${selectedTodo.imageUrl}` : null);
      setIsEditingTodo(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTodo(false);
    setEditTodoContent('');
    setEditTodoImage(null);
    setEditTodoImagePreview(null);
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
        <h1 className="app-title">Daily Scheduler</h1>
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

          <div className="add-buttons-row">
            <button
              onClick={() => setShowBottomSheet(true)}
              className="todo-add-btn-main"
            >
              + 스케줄 추가
            </button>
            <button
              onClick={() => setShowGoalBottomSheet(true)}
              className="goal-add-btn-main"
            >
              + 목표 추가
            </button>
          </div>

          <div className="todos-list">
            {loading ? (
              <div>로딩 중...</div>
            ) : todos.length === 0 ? (
              <div className="no-todos">할일이 없습니다.</div>
            ) : (
              todos.map((todo) => (
                <div 
                  key={todo.id} 
                  className={`todo-item ${todo.imageUrl ? 'has-image' : ''}`}
                  onClick={() => {
                    setSelectedTodo(todo);
                    setShowTodoDetailSheet(true);
                  }}
                >
                  {todo.imageUrl && (
                    <div className="todo-image-wrapper">
                      <img
                        src={`${API_BASE_URL}${todo.imageUrl}`}
                        alt={todo.content}
                        className="todo-list-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="todo-content-wrapper">
                    <div className="todo-text">{todo.content}</div>
                    <div className="todo-author">{todo.userName}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Goals 목록 */}
          <div className="goals-list-section">
            <h3>오늘 목표</h3>
            {goalsLoading ? (
              <div className="goals-loading">목표 불러오는 중...</div>
            ) : goals.length === 0 ? (
              <div className="goals-empty">아직 오늘 목표가 없습니다.</div>
            ) : (
              <div className="goals-list">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`goal-item ${
                      goal.isCompleted ? 'completed' : ''
                    } ${completingGoalId === goal.id ? 'completing' : ''}`}
                  >
                    <div className="goal-main">
                      <span className="goal-title">{goal.title}</span>
                      {goal.isCompleted ? (
                        <span className="goal-status">달성되었음 ✓</span>
                      ) : null}
                    </div>
                    {!goal.isCompleted && (
                      <button
                        type="button"
                        className="goal-complete-btn"
                        onClick={async () => {
                          try {
                            setCompletingGoalId(goal.id);
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
                              await loadGoals();
                              setShowCelebrate(true);
                              setTimeout(() => {
                                setShowCelebrate(false);
                                setCompletingGoalId(null);
                              }, 2000);
                            } else {
                              alert(data.message || '목표 달성 처리에 실패했습니다.');
                              setCompletingGoalId(null);
                            }
                          } catch (error) {
                            console.error('목표 달성 오류:', error);
                            alert('서버에 연결할 수 없습니다.');
                            setCompletingGoalId(null);
                          }
                        }}
                      >
                        달성!
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 할일 상세 Bottom Sheet Dialog */}
      {showTodoDetailSheet && selectedTodo && (
        <>
          <div className="bottom-sheet-overlay" onClick={() => {
            setShowTodoDetailSheet(false);
            setIsEditingTodo(false);
            handleCancelEdit();
          }}></div>
          <div className="bottom-sheet">
            <div className="bottom-sheet-header">
              <h3>{isEditingTodo ? '스케줄 수정' : '스케줄 상세'}</h3>
              <button className="bottom-sheet-close" onClick={() => {
                setShowTodoDetailSheet(false);
                setIsEditingTodo(false);
                handleCancelEdit();
              }}>×</button>
            </div>
            
            <div className="bottom-sheet-content">
              {!isEditingTodo ? (
                <>
                  <div className="todo-detail-section">
                    <div className="todo-detail-info">
                      <label>내용</label>
                      <p className="todo-detail-text">{selectedTodo.content}</p>
                      <span className="todo-detail-author">- {selectedTodo.userName}</span>
                    </div>
                    
                    {selectedTodo.imageUrl && (
                      <div className="todo-detail-image">
                        <img
                          src={`${API_BASE_URL}${selectedTodo.imageUrl}`}
                          alt="스케줄 이미지"
                          className="todo-detail-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="todo-detail-actions">
                    <button
                      onClick={handleStartEdit}
                      className="todo-edit-btn"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(selectedTodo.id)}
                      className="todo-delete-btn-detail"
                    >
                      삭제
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateTodo(); }}>
                  <div className="bottom-sheet-form-group">
                    <label>스케줄 내용</label>
                    <input
                      type="text"
                      value={editTodoContent}
                      onChange={(e) => setEditTodoContent(e.target.value)}
                      placeholder="무슨 스케줄인가요?"
                      className="bottom-sheet-input"
                    />
                  </div>

                  <div className="bottom-sheet-form-group">
                    <label>사진 변경 (선택)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditTodoImageSelect}
                      id="edit-todo-image-upload"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="edit-todo-image-upload" className="bottom-sheet-image-btn">
                      📷 사진 선택
                    </label>
                    {editTodoImagePreview && (
                      <div className="bottom-sheet-image-preview">
                        <img src={editTodoImagePreview} alt="미리보기" />
                        <button type="button" onClick={removeEditTodoImage} className="bottom-sheet-remove-image">×</button>
                      </div>
                    )}
                  </div>

                  <div className="todo-edit-actions">
                    <button type="submit" className="todo-save-btn">
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="todo-cancel-btn"
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bottom Sheet Dialog - 스케줄 추가 */}
      {showBottomSheet && (
        <>
          <div className="bottom-sheet-overlay" onClick={handleCloseBottomSheet}></div>
          <div className="bottom-sheet">
            <div className="bottom-sheet-header">
              <h3>스케줄 추가</h3>
              <button className="bottom-sheet-close" onClick={handleCloseBottomSheet}>×</button>
            </div>
            
            <div className="bottom-sheet-content">
              <form onSubmit={(e) => { e.preventDefault(); handleAddTodo(); }}>
                <div className="bottom-sheet-form-group">
                  <label>스케줄 내용</label>
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="무슨 스케줄인가요?"
                    className="bottom-sheet-input"
                  />
                </div>

                <div className="bottom-sheet-form-group">
                  <label>사진 추가 (선택)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    id="bottom-sheet-image-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="bottom-sheet-image-upload" className="bottom-sheet-image-btn">
                    📷 사진 선택
                  </label>
                  {imagePreview && (
                    <div className="bottom-sheet-image-preview">
                      <img src={imagePreview} alt="미리보기" />
                      <button type="button" onClick={removeImage} className="bottom-sheet-remove-image">×</button>
                    </div>
                  )}
                </div>

                <button type="submit" className="bottom-sheet-submit-btn">
                  스케줄 추가하기
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* 목표 추가 Bottom Sheet Dialog */}
      {showGoalBottomSheet && (
        <>
          <div className="bottom-sheet-overlay" onClick={handleCloseGoalBottomSheet}></div>
          <div className="bottom-sheet">
            <div className="bottom-sheet-header">
              <h3>목표 추가</h3>
              <button className="bottom-sheet-close" onClick={handleCloseGoalBottomSheet}>×</button>
            </div>
            
            <div className="bottom-sheet-content">
              <form onSubmit={(e) => { e.preventDefault(); handleAddGoal(); }}>
                <div className="bottom-sheet-form-group">
                  <label>목표 내용</label>
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="오늘 꼭 달성하고 싶은 목표를 적어보세요"
                    className="bottom-sheet-input"
                  />
                </div>

                <button type="submit" className="bottom-sheet-submit-btn">
                  목표 추가하기
                </button>
              </form>
            </div>
          </div>
        </>
      )}

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

