import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, logout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          🏪 ร้านอาหารไทย
        </Link>

        <div className="nav-menu">
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            🏠 หน้าหลัก
          </Link>
          
          <Link to="/create-post" className={`nav-link ${isActive('/create-post')}`}>
            ➕ แบ่งปันร้านค้า
          </Link>
          
          <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>
            👤 โปรไฟล์
          </Link>
        </div>

        <div className="nav-user">
          <div className="user-info">
            {user.profile_image && (
              <img 
                src={`http://localhost:5000${user.profile_image}`} 
                alt={user.username}
                className="user-avatar"
              />
            )}
            <span className="username">สวัสดี, {user.username}</span>
          </div>
          
          <button onClick={logout} className="logout-btn">
            ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;