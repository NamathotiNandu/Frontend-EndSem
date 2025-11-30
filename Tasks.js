import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { FiCheckSquare, FiCalendar, FiUser } from 'react-icons/fi';
import './Tasks.css';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/tasks`);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      await axios.put(`${apiUrl}/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'my-tasks') return task.assignedTo?._id === user?.id;
    return task.status === filter;
  });

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
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage and track your project tasks</p>
        </div>
        <div className="task-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Tasks
          </button>
          <button
            className={`filter-btn ${filter === 'my-tasks' ? 'active' : ''}`}
            onClick={() => setFilter('my-tasks')}
          >
            My Tasks
          </button>
          <button
            className={`filter-btn ${filter === 'todo' ? 'active' : ''}`}
            onClick={() => setFilter('todo')}
          >
            To Do
          </button>
          <button
            className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress
          </button>
          <button
            className={`filter-btn ${filter === 'done' ? 'active' : ''}`}
            onClick={() => setFilter('done')}
          >
            Done
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <FiCheckSquare className="empty-state-icon" />
          <p className="empty-state-text">No tasks found</p>
          <p className="empty-state-subtext">Tasks will appear here once created</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task) => (
            <div key={task._id} className="task-card-large">
              <div className="task-card-header">
                <Link to={`/projects/${task.project?._id}`} className="task-project-link">
                  {task.project?.title}
                </Link>
                <select
                  className="form-select task-status-select"
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <h3 className="task-title">{task.title}</h3>
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              <div className="task-footer">
                {task.assignedTo && (
                  <div className="task-meta-item">
                    <FiUser />
                    <span>{task.assignedTo.name}</span>
                  </div>
                )}
                {task.deadline && (
                  <div className="task-meta-item">
                    <FiCalendar />
                    <span>{format(new Date(task.deadline), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                <span className={`badge badge-${task.priority || 'medium'}`}>
                  {task.priority || 'medium'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
