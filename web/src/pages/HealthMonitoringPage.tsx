import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { IoArrowBackOutline } from 'react-icons/io5';
import './HealthMonitoringPage.css';

interface HealthMonitoringPageProps {
  user: User;
  userId?: string;
}

const HealthMonitoringPage: React.FC<HealthMonitoringPageProps> = ({ user, userId }) => {
  const navigate = useNavigate();
  const backPath = user.userType === 'offer' ? '/caregiver-dashboard' : '/dashboard';

  return (
    <div className="health-monitoring-page">
      <div className="page-header">
        <button onClick={() => navigate(backPath)} className="back-button">
          <IoArrowBackOutline className="back-icon" /> Back
        </button>
        <h1>Health Monitoring</h1>
      </div>
      <div className="page-content">
        <div className="empty-state">
          <p>Health monitoring features coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default HealthMonitoringPage;

