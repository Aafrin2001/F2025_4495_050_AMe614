import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './NumberSequenceScreen.css';

const NumberSequenceScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="number-container">
      <div className="number-header">
        <button onClick={() => navigate('/activities')} className="number-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="number-header-title">Number Sequence</div>
        <div className="number-header-spacer"></div>
      </div>
      <div className="number-content">
        <div className="number-placeholder">Number Sequence game coming soon</div>
      </div>
    </div>
  );
};

export default NumberSequenceScreen;

