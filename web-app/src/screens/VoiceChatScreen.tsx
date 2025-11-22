import React, { useState, useRef, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import './VoiceChatScreen.css'
import { sendChatMessage, ChatMessage as OpenAIChatMessage } from '../lib/chatGPTService'
import { ChatHistoryService } from '../lib/chatHistoryService'
import { User } from '../types'

interface VoiceChatScreenProps {
  onBack: () => void
  user: User | null
}

interface VoiceMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const VoiceChatScreen: React.FC<VoiceChatScreenProps> = ({ onBack, user }) => {
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [transcript, setTranscript] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const pulseAnimationRef = useRef<number | null>(null)

  // Check if Web Speech APIs are available
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Load chat history on mount
  useEffect(() => {
    if (user?.id) {
      loadChatHistory()
    } else {
      // If no user, show welcome message
      setMessages([
        {
          id: '1',
          text: "Hello! I'm your AI health companion. I'm here to help you with health monitoring, medication reminders, and answer any health-related questions you might have. How can I assist you today?",
          isUser: false,
          timestamp: new Date(),
        },
      ])
      setIsLoading(false)
    }
  }, [user?.id])

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (isSpeechRecognitionSupported && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          handleVoiceInput(transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          setError(`Speech recognition error: ${event.error}. Please try again.`)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      stopListening()
      stopSpeaking()
    }
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isProcessing, isSpeaking])

  // Pulse animation for listening state
  useEffect(() => {
    if (isListening) {
      const pulseElement = document.querySelector('.voice-button.listening')
      if (pulseElement) {
        let scale = 1
        const pulse = () => {
          scale = scale === 1 ? 1.1 : 1
          ;(pulseElement as HTMLElement).style.transform = `scale(${scale})`
          pulseAnimationRef.current = requestAnimationFrame(pulse)
        }
        pulseAnimationRef.current = requestAnimationFrame(pulse)
      }
    } else {
      if (pulseAnimationRef.current) {
        cancelAnimationFrame(pulseAnimationRef.current)
        pulseAnimationRef.current = null
      }
      const pulseElement = document.querySelector('.voice-button.listening')
      if (pulseElement) {
        ;(pulseElement as HTMLElement).style.transform = 'scale(1)'
      }
    }
  }, [isListening])

  const loadChatHistory = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)
    try {
      const targetUserId = user.userType === 'offer' && user.seniorUserId ? user.seniorUserId : user.id
      const result = await ChatHistoryService.getChatHistory(100, targetUserId)

      if (!result.success) {
        setError(result.error || 'Failed to load chat history')
        // Still show welcome message
        setMessages([
          {
            id: '1',
            text: "Hello! I'm your AI health companion. I'm here to help you with health monitoring, medication reminders, and answer any health-related questions you might have. How can I assist you today?",
            isUser: false,
            timestamp: new Date(),
          },
        ])
        setIsLoading(false)
        return
      }

      if (result.data && result.data.length > 0) {
        const loadedMessages: VoiceMessage[] = result.data.map(msg => ({
          id: msg.id,
          text: msg.message,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at),
        }))
        setMessages(loadedMessages)
      } else {
        // No history, show welcome message
        setMessages([
          {
            id: '1',
            text: "Hello! I'm your AI health companion. I'm here to help you with health monitoring, medication reminders, and answer any health-related questions you might have. How can I assist you today?",
            isUser: false,
            timestamp: new Date(),
          },
        ])
      }
      setLastSyncTime(new Date())
    } catch (err: any) {
      console.error('Error loading chat history:', err)
      setError(err.message || 'An unexpected error occurred')
      // Show welcome message on error
      setMessages([
        {
          id: '1',
          text: "Hello! I'm your AI health companion. I'm here to help you with health monitoring, medication reminders, and answer any health-related questions you might have. How can I assist you today?",
          isUser: false,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadChatHistory()
    setIsRefreshing(false)
  }

  // Convert messages to OpenAI format (excluding welcome message)
  const getConversationHistory = (): OpenAIChatMessage[] => {
    return messages
      .filter(msg => {
        // Exclude the initial greeting
        return msg.id !== '1' && !msg.text.includes("Hello! I'm your AI health companion")
      })
      .map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text,
      }))
  }

  const saveMessageToBackend = async (message: VoiceMessage) => {
    if (!user?.id) return

    try {
      const targetUserId = user.userType === 'offer' && user.seniorUserId ? user.seniorUserId : user.id
      const result = await ChatHistoryService.saveMessage(
        {
          message: message.text,
          is_user: message.isUser,
        },
        targetUserId
      )
      
      if (!result.success) {
        console.warn('Failed to save message to backend:', result.error)
      }
    } catch (err: any) {
      console.error('Error saving message to backend:', err)
    }
  }

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isSpeechSynthesisSupported) {
        reject(new Error('Speech synthesis is not supported in this browser'))
        return
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }

      utterance.onerror = (event) => {
        setIsSpeaking(false)
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      synthesisRef.current = utterance
      window.speechSynthesis.speak(utterance)
    })
  }

  const stopSpeaking = () => {
    if (isSpeechSynthesisSupported) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  const handleVoiceInput = async (transcriptText: string) => {
    if (!transcriptText.trim() || !user?.id) return

    // Check if OpenAI API key is configured
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      setError('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.')
      return
    }

    setIsListening(false)
    setIsProcessing(true)
    setTranscript('')
    setError(null)

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      text: transcriptText.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    // Save user message to backend (don't await, do it in background)
    saveMessageToBackend(userMessage).catch(err => {
      console.error('Failed to save user message:', err)
    })

    try {
      // Get conversation history
      const conversationHistory = getConversationHistory()

      // Send to ChatGPT
      const aiResponseText = await sendChatMessage(transcriptText.trim(), conversationHistory)

      const aiResponse: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiResponse])
      setIsProcessing(false)
      setIsSpeaking(true)

      // Save AI response to backend
      await saveMessageToBackend(aiResponse)

      // Convert AI response to speech
      await speakText(aiResponseText)
      setIsSpeaking(false)
      setLastSyncTime(new Date())
    } catch (error: any) {
      console.error('Error processing voice input:', error)
      setIsProcessing(false)
      setIsSpeaking(false)
      setError(error.message || 'Failed to process voice input. Please check your OpenAI API key configuration.')

      const errorMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: error.message || 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleStartListening = () => {
    if (isProcessing || isSpeaking) return

    if (!isSpeechRecognitionSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (!recognitionRef.current) {
      setError('Speech recognition is not available. Please refresh the page.')
      return
    }

    try {
      setIsListening(true)
      setError(null)
      recognitionRef.current.start()
    } catch (error: any) {
      console.error('Error starting speech recognition:', error)
      setIsListening(false)
      setError('Failed to start speech recognition. Please try again.')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
    }
    setIsListening(false)
  }

  const handleStopListening = () => {
    stopListening()
  }

  const handleQuickAction = async (action: string) => {
    if (isProcessing || isSpeaking) return

    await handleVoiceInput(action)
  }

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a')
  }

  const quickActions = [
    { id: '1', text: 'Check my vitals', icon: '❤️' },
    { id: '2', text: 'Medication reminder', icon: '💊' },
    { id: '3', text: 'Schedule appointment', icon: '📅' },
    { id: '4', text: 'Emergency help', icon: '🚨' },
    { id: '5', text: 'Health tips', icon: '💡' },
    { id: '6', text: 'Contact family', icon: '👨‍👩‍👧' },
  ]

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
          <p className="voice-subtitle">Speak naturally</p>
        </div>
        <div className="header-actions">
          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh chat history"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isRefreshing ? 'spinning' : ''}
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {lastSyncTime && (
        <div className="sync-timestamp">
          Last synced: {format(lastSyncTime, 'PPp')} ({formatDistanceToNow(lastSyncTime, { addSuffix: true })})
        </div>
      )}

      <div className="voice-container">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading conversation...</p>
          </div>
        ) : (
          <>
            <div className="messages-container">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
                >
                  <div className={`message-bubble ${message.isUser ? 'user-bubble' : 'ai-bubble'}`}>
                    <p className="message-text">{message.text}</p>
                    <div className="message-footer">
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                      {!message.isUser && (
                        <button
                          className="play-button"
                          onClick={() => speakText(message.text)}
                          disabled={isSpeaking}
                          title="Replay message"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Status Indicator */}
            {(isListening || isProcessing || isSpeaking) && (
              <div className="status-container">
                {isListening && (
                  <div className="status-indicator listening">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    <span>Listening...</span>
                  </div>
                )}
                {isProcessing && (
                  <div className="status-indicator processing">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>Processing...</span>
                  </div>
                )}
                {isSpeaking && (
                  <div className="status-indicator speaking">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                    <span>AI is speaking...</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <p className="quick-actions-label">Quick Actions:</p>
              <div className="quick-actions-scroll">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action.text)}
                    disabled={isProcessing || isSpeaking || isListening}
                  >
                    <span className="quick-action-icon">{action.icon}</span>
                    <span>{action.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Controls */}
            <div className="voice-controls">
              <button
                className={`voice-button ${isListening ? 'listening' : ''} ${isProcessing || isSpeaking ? 'disabled' : ''}`}
                onClick={isListening ? handleStopListening : handleStartListening}
                disabled={isProcessing || isSpeaking || !isSpeechRecognitionSupported}
                title={isListening ? 'Tap to stop' : 'Tap to speak'}
              >
                {isListening ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                )}
              </button>
              <p className="voice-button-label">
                {isListening ? 'Tap to stop' : isProcessing ? 'Processing...' : isSpeaking ? 'AI is speaking...' : 'Tap to speak'}
              </p>
              {!isSpeechRecognitionSupported && (
                <p className="voice-warning">
                  Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default VoiceChatScreen
