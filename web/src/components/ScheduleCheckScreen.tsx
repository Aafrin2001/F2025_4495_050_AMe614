import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './ScheduleCheckScreen.css';

const ScheduleCheckScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <button onClick={() => navigate('/health-monitoring')} className="schedule-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="schedule-header-title">Schedule Check</div>
        <div className="schedule-header-spacer"></div>
      </div>
      <div className="schedule-content">
        <div className="schedule-placeholder">
          <Icon name="calendar-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
          <div>Schedule Check feature coming soon</div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCheckScreen;

