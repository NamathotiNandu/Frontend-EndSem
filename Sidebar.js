import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiLayout,
  FiFolder,
  FiCheckSquare,
  FiUpload,
  FiUsers,
  FiUser,
  FiMenu,
  FiX
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  const { isStudent, isFaculty, isAdmin } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      path: '/dashboard',
      icon: FiLayout,
      label: 'Dashboard',
      roles: ['student', 'faculty', 'admin']
    },
    {
      path: '/projects',
      icon: FiFolder,
      label: 'Projects',
      roles: ['student', 'faculty', 'admin']
    },
    {
      path: '/tasks',
      icon: FiCheckSquare,
      label: 'Tasks',
      roles: ['student', 'faculty', 'admin']
    },
    {
      path: '/submissions',
      icon: FiUpload,
      label: 'Submissions',
      roles: ['student', 'faculty', 'admin']
    },
    {
      path: '/users',
      icon: FiUsers,
      label: 'Users',
      roles: ['admin']
    },
    {
      path: '/profile',
      icon: FiUser,
      label: 'Profile',
      roles: ['student', 'faculty', 'admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (isAdmin) return true;
    if (isFaculty) return item.roles.includes('faculty') || item.roles.includes('admin');
    if (isStudent) return item.roles.includes('student');
    return false;
  });

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FiX /> : <FiMenu />}
      </button>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default Sidebar;

