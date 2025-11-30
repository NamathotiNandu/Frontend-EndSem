import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiFolder, FiCheckSquare, FiUpload, FiUsers, FiTrendingUp } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isStudent, isFaculty, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    submissions: 0,
    users: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      // Fetch projects
      const projectsRes = await axios.get(`${apiUrl}/projects`);
      const projects = projectsRes.data.projects || [];
      setRecentProjects(projects.slice(0, 5));

      // Fetch tasks
      const tasksRes = await axios.get(`${apiUrl}/tasks`);
      const tasks = tasksRes.data.tasks || [];
      setRecentTasks(tasks.slice(0, 5));

      // Calculate stats
      setStats({
        projects: projects.length,
        tasks: tasks.length,
        submissions: 0, // Will be fetched separately if needed
        users: 0 // Will be fetched separately if admin
      });

      if (isAdmin) {
        const usersRes = await axios.get(`${apiUrl}/users`);
        setStats(prev => ({ ...prev, users: usersRes.data.count || 0 }));
      }

      const submissionsRes = await axios.get(`${apiUrl}/submissions`);
      setStats(prev => ({ ...prev, submissions: submissionsRes.data.count || 0 }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="page-title">Welcome back, {user?.name}!</h1>
        <p className="page-subtitle">
          {isStudent && "Manage your group projects and track your progress"}
          {isFaculty && "Review student projects and provide feedback"}
          {isAdmin && "Monitor the entire system and manage users"}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#4f46e5' }}>
            <FiFolder />
          </div>
          <div className="stat-value">{stats.projects}</div>
          <div className="stat-label">Projects</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>
            <FiCheckSquare />
          </div>
          <div className="stat-value">{stats.tasks}</div>
          <div className="stat-label">Tasks</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f59e0b' }}>
            <FiUpload />
          </div>
          <div className="stat-value">{stats.submissions}</div>
          <div className="stat-label">Submissions</div>
        </div>

        {isAdmin && (
          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#ef4444' }}>
              <FiUsers />
            </div>
            <div className="stat-value">{stats.users}</div>
            <div className="stat-label">Users</div>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Recent Projects</h2>
            <Link to="/projects" className="view-all-link">
              View All
            </Link>
          </div>
          {recentProjects.length > 0 ? (
            <div className="project-list">
              {recentProjects.map((project) => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="project-item"
                >
                  <div className="project-info">
                    <h3>{project.title}</h3>
                    <p>{project.description?.substring(0, 60)}...</p>
                  </div>
                  <div className="project-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                    <span className="progress-text">{project.progress || 0}%</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No projects yet</p>
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Recent Tasks</h2>
            <Link to="/tasks" className="view-all-link">
              View All
            </Link>
          </div>
          {recentTasks.length > 0 ? (
            <div className="task-list">
              {recentTasks.map((task) => (
                <div key={task._id} className="task-item">
                  <div className="task-info">
                    <h3>{task.title}</h3>
                    <p>{task.project?.title}</p>
                  </div>
                  <span className={`badge badge-${task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'warning' : 'info'}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No tasks yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
