import React from 'react'
import './ChatSelectionScreen.css'

interface ChatSelectionScreenProps {
  onBack: () => void
  onTextChat: () => void
  onVoiceChat: () => void
}

const ChatSelectionScreen: React.FC<ChatSelectionScreenProps> = ({ onBack, onTextChat, onVoiceChat }) => {
  return (
    <div className="chat-selection-screen">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 className="chat-title">Choose Chat Type</h1>
      </div>

      <div className="chat-content">
        <div className="welcome-card">
          <h2>How would you like to chat?</h2>
          <p>Select your preferred communication method with your AI health companion</p>
        </div>

        <div className="chat-options">
          <div className="chat-option-card" onClick={onTextChat}>
            <div className="option-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3 className="option-title">Text Chat</h3>
            <p className="option-description">Type your questions and get instant AI responses</p>
            <div className="option-features">
              <span className="feature-tag">Quick</span>
              <span className="feature-tag">Detailed</span>
            </div>
          </div>

          <div className="chat-option-card" onClick={onVoiceChat}>
            <div className="option-icon" style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </div>
            <h3 className="option-title">Voice Chat</h3>
            <p className="option-description">Speak naturally and listen to AI responses</p>
            <div className="option-features">
              <span className="feature-tag">Hands-free</span>
              <span className="feature-tag">Natural</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatSelectionScreen

