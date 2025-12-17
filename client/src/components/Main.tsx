import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Main.css';
import { getAuthHeaders, removeToken, isAuthenticated } from '../utils/auth';
import { API_BASE_URL } from '../config/api';

interface Todo {
  id: number;
  content: string;
  date: string;
  userId: number;
  userName: string;
}

const Main: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    loadTodos();
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

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/todos`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          content: newTodo,
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
        setNewTodo('');
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

  const handleLogout = async () => {
    await removeToken();
    navigate('/');
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
    <div className="main-container">
      <div className="main-header">
        <h1>스케줄 관리</h1>
        <button onClick={handleLogout} className="logout-btn">로그아웃</button>
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
          <h2>{selectedDate} 할일</h2>
          
          <form onSubmit={handleAddTodo} className="todo-form">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="할일을 입력하세요"
              className="todo-input"
            />
            <button type="submit" className="todo-add-btn">추가</button>
          </form>

          <div className="todos-list">
            {loading ? (
              <div>로딩 중...</div>
            ) : todos.length === 0 ? (
              <div className="no-todos">할일이 없습니다.</div>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className="todo-item">
                  <div className="todo-content">
                    <span className="todo-text">{todo.content}</span>
                    <span className="todo-author">- {todo.userName}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="todo-delete-btn"
                  >
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;

