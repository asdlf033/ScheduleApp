import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Home from './components/Home';
import Feed from './components/Feed';
import Settings from './components/Settings';
import { isAuthenticated } from './utils/auth';

function App() {
  return (
    <BrowserRouter>
      <div className='App'>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/main" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
