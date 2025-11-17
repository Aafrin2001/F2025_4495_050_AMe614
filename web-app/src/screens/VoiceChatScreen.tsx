import React, { useState } from 'react'
import './VoiceChatScreen.css'

interface VoiceChatScreenProps {
  onBack: () => void
}

const VoiceChatScreen: React.FC<VoiceChatScreenProps> = ({ onBack }) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')

  const handleStartListening = () => {
    setIsListening(true)
    // In a real app, this would start voice recognition
    setTimeout(() => {
      setTranscript('Hello, I need help with my medication schedule')
      setIsListening(false)
    }, 2000)
  }

  const handleStopListening = () => {
    setIsListening(false)
  }

  return (
    <div className="voice-chat-screen">
      <div className="voice-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="voice-header-info">
          <h1 className="voice-title">Voice Chat</h1>
          <p className="voice-subtitle">Speak naturally with your AI companion</p>
        </div>
      </div>

      <div className="voice-container">
        <div className="voice-visualizer">
          <div className={`voice-circle ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
            <div className="voice-icon">
              {isListening ? (
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              ) : isSpeaking ? (
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              ) : (
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              )}
            </div>
          </div>
          <p className="voice-status">
            {isListening ? 'Listening...' : isSpeaking ? 'AI is speaking...' : 'Tap to speak'}
          </p>
        </div>

        {transcript && (
          <div className="transcript-section">
            <h3 className="transcript-title">Your Message</h3>
            <p className="transcript-text">{transcript}</p>
          </div>
        )}

        <div className="voice-controls">
          {!isListening && !isSpeaking && (
            <button className="voice-button start" onClick={handleStartListening}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              Start Speaking
            </button>
          )}

          {isListening && (
            <button className="voice-button stop" onClick={handleStopListening}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
              </svg>
              Stop Listening
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default VoiceChatScreen

