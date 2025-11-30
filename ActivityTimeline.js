import React from 'react';
import { format } from 'date-fns';
import { FiCheckCircle, FiFile, FiUserPlus, FiUpload, FiMessageSquare } from 'react-icons/fi';
import './ActivityTimeline.css';

const ActivityTimeline = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'task-completed':
        return <FiCheckCircle className="activity-icon completed" />;
      case 'task-created':
      case 'task-updated':
        return <FiCheckCircle className="activity-icon task" />;
      case 'file-uploaded':
        return <FiUpload className="activity-icon file" />;
      case 'member-added':
        return <FiUserPlus className="activity-icon member" />;
      case 'submission-created':
      case 'feedback-added':
        return <FiMessageSquare className="activity-icon feedback" />;
      default:
        return <FiFile className="activity-icon default" />;
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="empty-state">
        <p>No activities yet</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {activities.map((activity) => (
        <div key={activity._id} className="timeline-item">
          <div className="timeline-content">
            <div className="timeline-header">
              {getActivityIcon(activity.type)}
              <div className="timeline-info">
                <div className="timeline-user">{activity.user?.name}</div>
                <div className="timeline-time">
                  {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            </div>
            <div className="timeline-description">{activity.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
