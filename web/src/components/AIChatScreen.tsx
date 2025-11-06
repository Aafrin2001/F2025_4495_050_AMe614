import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './AIChatScreen.css';

const AIChatScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <button onClick={() => navigate('/chat-selection')} className="ai-chat-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="ai-chat-header-title">AI Chat</div>
        <div className="ai-chat-header-spacer"></div>
      </div>
      <div className="ai-chat-content">
        <div className="ai-chat-placeholder">AI Chat feature coming soon</div>
      </div>
    </div>
  );
};

export default AIChatScreen;

