import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './BreathingScreen.css';

const BreathingScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="breathing-container">
      <div className="breathing-header">
        <button onClick={() => navigate('/activities')} className="breathing-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="breathing-header-title">Breathing Exercises</div>
        <div className="breathing-header-spacer"></div>
      </div>
      <div className="breathing-content">
        <div className="breathing-placeholder">Breathing Exercises feature coming soon</div>
      </div>
    </div>
  );
};

export default BreathingScreen;

