import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiMoon, FiSun, FiLogOut, FiUser } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <h2>ProjectHub</h2>
        </Link>
        <div className="navbar-actions">
          <button
            className="navbar-icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <FiMoon /> : <FiSun />}
          </button>
          <div className="navbar-user">
            <FiUser />
            <span>{user?.name}</span>
            <span className="navbar-role">{user?.role}</span>
          </div>
          <button className="navbar-icon-btn" onClick={handleLogout} aria-label="Logout">
            <FiLogOut />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
