import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiPlus, FiFolder, FiUsers, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import Modal from '../components/Modal';
import './Projects.css';

const Projects = () => {
  const { isFaculty, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/projects`);
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      await axios.post(`${apiUrl}/projects`, formData);
      setShowModal(false);
      setFormData({ title: '', description: '', deadline: '' });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
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
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage and track your group projects</p>
        </div>
        {(isFaculty || isAdmin) && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus /> Create Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <FiFolder className="empty-state-icon" />
          <p className="empty-state-text">No projects found</p>
          <p className="empty-state-subtext">
            {(isFaculty || isAdmin) ? 'Create your first project to get started' : 'No projects assigned yet'}
          </p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`} className="project-card">
              <div className="project-card-header">
                <h3>{project.title}</h3>
                <span className={`badge badge-${project.status === 'completed' ? 'success' : project.status === 'archived' ? 'info' : 'warning'}`}>
                  {project.status}
                </span>
              </div>
              <p className="project-description">{project.description}</p>
              <div className="project-meta">
                <div className="project-meta-item">
                  <FiUsers />
                  <span>{project.members?.length || 0} members</span>
                </div>
                {project.deadline && (
                  <div className="project-meta-item">
                    <FiCalendar />
                    <span>{new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="project-progress-section">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
                <span className="progress-text">{project.progress || 0}% Complete</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Create New Project">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Project Title</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input
                type="date"
                className="form-input"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Project
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Projects;
