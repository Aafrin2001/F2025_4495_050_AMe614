import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './ChatSelectionScreen.css';

const ChatSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="chat-selection-container">
      <div className="chat-selection-header">
        <button onClick={() => navigate('/main')} className="chat-selection-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="chat-selection-header-title">Chat Options</div>
        <div className="chat-selection-header-spacer"></div>
      </div>
      <div className="chat-selection-content">
        <button className="chat-selection-option" onClick={() => navigate('/ai-chat')}>
          <Icon name="chatbubbles-outline" size={32} />
          <div className="chat-selection-option-title">Text Chat</div>
        </button>
        <button className="chat-selection-option" onClick={() => navigate('/voice-chat')}>
          <Icon name="volume-high-outline" size={32} />
          <div className="chat-selection-option-title">Voice Chat</div>
        </button>
      </div>
    </div>
  );
};

export default ChatSelectionScreen;

