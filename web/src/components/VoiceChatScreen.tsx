import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './VoiceChatScreen.css';

const VoiceChatScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="voice-chat-container">
      <div className="voice-chat-header">
        <button onClick={() => navigate('/chat-selection')} className="voice-chat-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="voice-chat-header-title">Voice Chat</div>
        <div className="voice-chat-header-spacer"></div>
      </div>
      <div className="voice-chat-content">
        <div className="voice-chat-placeholder">Voice Chat feature coming soon</div>
      </div>
    </div>
  );
};

export default VoiceChatScreen;

