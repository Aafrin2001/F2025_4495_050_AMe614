import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './PuzzlePiecesScreen.css';

const PuzzlePiecesScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="puzzle-container">
      <div className="puzzle-header">
        <button onClick={() => navigate('/activities')} className="puzzle-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="puzzle-header-title">Puzzle Pieces</div>
        <div className="puzzle-header-spacer"></div>
      </div>
      <div className="puzzle-content">
        <div className="puzzle-placeholder">Puzzle Pieces game coming soon</div>
      </div>
    </div>
  );
};

export default PuzzlePiecesScreen;

