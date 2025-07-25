import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import CreatePost from './components/CreatePost';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} logout={logout} />}
        
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" /> : <Login onLogin={login} />
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/" /> : <Register onLogin={login} />
            } 
          />
          <Route 
            path="/" 
            element={
              user ? <Home user={user} /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/create-post" 
            element={
              user ? <CreatePost user={user} /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/profile" 
            element={
              user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;