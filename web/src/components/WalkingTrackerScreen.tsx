import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './WalkingTrackerScreen.css';

const WalkingTrackerScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="walking-container">
      <div className="walking-header">
        <button onClick={() => navigate('/activities')} className="walking-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="walking-header-title">Walking Tracker</div>
        <div className="walking-header-spacer"></div>
      </div>
      <div className="walking-content">
        <div className="walking-placeholder">Walking Tracker feature coming soon</div>
      </div>
    </div>
  );
};

export default WalkingTrackerScreen;

