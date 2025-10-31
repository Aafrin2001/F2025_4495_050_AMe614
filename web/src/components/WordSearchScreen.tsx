import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './WordSearchScreen.css';

const WordSearchScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="wordsearch-container">
      <div className="wordsearch-header">
        <button onClick={() => navigate('/activities')} className="wordsearch-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="wordsearch-header-title">Word Search</div>
        <div className="wordsearch-header-spacer"></div>
      </div>
      <div className="wordsearch-content">
        <div className="wordsearch-placeholder">Word Search game coming soon</div>
      </div>
    </div>
  );
};

export default WordSearchScreen;

