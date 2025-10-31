import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './StretchingScreen.css';

const StretchingScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="stretching-container">
      <div className="stretching-header">
        <button onClick={() => navigate('/activities')} className="stretching-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="stretching-header-title">Stretching</div>
        <div className="stretching-header-spacer"></div>
      </div>
      <div className="stretching-content">
        <div className="stretching-placeholder">Stretching feature coming soon</div>
      </div>
    </div>
  );
};

export default StretchingScreen;

