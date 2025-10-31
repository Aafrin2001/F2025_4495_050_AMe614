import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './MemoryMatchScreen.css';

const MemoryMatchScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="memory-container">
      <div className="memory-header">
        <button onClick={() => navigate('/activities')} className="memory-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="memory-header-title">Memory Match</div>
        <div className="memory-header-spacer"></div>
      </div>
      <div className="memory-content">
        <div className="memory-placeholder">Memory Match game coming soon</div>
      </div>
    </div>
  );
};

export default MemoryMatchScreen;

