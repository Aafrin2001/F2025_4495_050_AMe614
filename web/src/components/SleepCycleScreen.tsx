import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './SleepCycleScreen.css';

const SleepCycleScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="sleep-container">
      <div className="sleep-header">
        <button onClick={() => navigate('/activities')} className="sleep-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="sleep-header-title">Sleep Cycle</div>
        <div className="sleep-header-spacer"></div>
      </div>
      <div className="sleep-content">
        <div className="sleep-placeholder">Sleep Cycle feature coming soon</div>
      </div>
    </div>
  );
};

export default SleepCycleScreen;

