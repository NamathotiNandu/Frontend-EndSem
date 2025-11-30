import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiUsers, FiTrash2, FiEdit } from 'react-icons/fi';
import './Users.css';

const Users = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, filter]);

  const fetchUsers = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/users${filter !== 'all' ? `?role=${filter}` : ''}`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      await axios.delete(`${apiUrl}/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage all system users</p>
        </div>
        <div className="user-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Users
          </button>
          <button
            className={`filter-btn ${filter === 'student' ? 'active' : ''}`}
            onClick={() => setFilter('student')}
          >
            Students
          </button>
          <button
            className={`filter-btn ${filter === 'faculty' ? 'active' : ''}`}
            onClick={() => setFilter('faculty')}
          >
            Faculty
          </button>
          <button
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            Admins
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <FiUsers className="empty-state-icon" />
          <p className="empty-state-text">No users found</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Student ID</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.role === 'admin' ? 'danger' : user.role === 'faculty' ? 'info' : 'success'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.studentId || '-'}</td>
                  <td>{user.department || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(user._id)}
                        title="Delete user"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Users;
