import React, { useState, useRef, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import './AIChatScreen.css'
import { sendChatMessageStreaming, sendChatMessage, ChatMessage as OpenAIChatMessage } from '../lib/chatGPTService'
import { ChatHistoryService } from '../lib/chatHistoryService'
import { User } from '../types'

interface AIChatScreenProps {
  onBack: () => void
  user: User | null
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const AIChatScreen: React.FC<AIChatScreenProps> = ({ onBack, user }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Error boundary - catch any unhandled errors
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('Unhandled error in AIChatScreen:', event.error)
      setError('An unexpected error occurred. Please refresh the page.')
    }

    const unhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection in AIChatScreen:', event.reason)
      setError('An unexpected error occurred. Please try again.')
    }

    window.addEventListener('error', errorHandler)
    window.addEventListener('unhandledrejection', unhandledRejection)
    return () => {
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', unhandledRejection)
    }
  }, [])

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

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
        const loadedMessages: Message[] = result.data.map(msg => ({
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

  const saveMessageToBackend = async (message: Message) => {
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
        // Don't show error to user for save failures, just log
      }
    } catch (err: any) {
      console.error('Error saving message to backend:', err)
      // Don't show error to user for save failures, just log
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping || !user?.id) return

    // Check if OpenAI API key is configured
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      setError('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.')
      return
    }

    const messageText = inputText.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)
    setError(null)

    // Save user message to backend (don't await, do it in background)
    saveMessageToBackend(userMessage).catch(err => {
      console.error('Failed to save user message:', err)
    })

    try {
      // Get conversation history
      const conversationHistory = getConversationHistory()

      // Create AI message placeholder for streaming
      const aiMessageId = (Date.now() + 1).toString()
      const aiMessage: Message = {
        id: aiMessageId,
        text: '',
        isUser: false,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
      setStreamingMessageId(aiMessageId)

      // Try streaming first
      try {
        let fullResponse = ''
        await sendChatMessageStreaming(
          messageText,
          conversationHistory,
          (chunk: string) => {
            try {
              if (chunk) {
                fullResponse += chunk
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, text: fullResponse }
                      : msg
                  )
                )
              }
            } catch (chunkError: any) {
              console.error('Error updating message with chunk:', chunkError)
            }
          }
        )

        // Validate we got a response
        if (!fullResponse || fullResponse.trim() === '') {
          throw new Error('No response received from OpenAI. Please check your API key and try again.')
        }

        // Update final message
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, text: fullResponse, timestamp: new Date() }
              : msg
          )
        )

        // Save AI response to backend
        await saveMessageToBackend({
          id: aiMessageId,
          text: fullResponse,
          isUser: false,
          timestamp: new Date(),
        })
      } catch (streamError: any) {
        // Fallback to non-streaming if streaming fails
        console.warn('Streaming failed, falling back to non-streaming:', streamError)
        const aiResponseText = await sendChatMessage(messageText, conversationHistory)

        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, text: aiResponseText, timestamp: new Date() }
              : msg
          )
        )

        // Save AI response to backend
        await saveMessageToBackend({
          id: aiMessageId,
          text: aiResponseText,
          isUser: false,
          timestamp: new Date(),
        })
      }

      setStreamingMessageId(null)
      setIsTyping(false)
      setLastSyncTime(new Date())
    } catch (error: any) {
      console.error('Error sending message:', error)
      setIsTyping(false)
      setStreamingMessageId(null)
      
      const errorMsg = error?.message || 'Failed to send message. Please check your OpenAI API key configuration.'
      setError(errorMsg)

      // Remove the empty AI message if it exists
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== aiMessageId)
        // Only add error message if we don't already have one
        const hasError = filtered.some(msg => msg.text.includes('error') || msg.text.includes('Error'))
        if (!hasError) {
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: `Sorry, I encountered an error: ${errorMsg}`,
            isUser: false,
            timestamp: new Date(),
          }
          return [...filtered, errorMessage]
        }
        return filtered
      })
    }
  }

  const handleQuickAction = async (action: string) => {
    setInputText(action)
    // Small delay to ensure input is set
    setTimeout(() => {
      handleSendMessage()
    }, 100)
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
    <div className="ai-chat-screen">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="chat-header-info">
          <h1 className="chat-title">AI Health Companion</h1>
          <p className="chat-subtitle">Always here to help</p>
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

      <div className="chat-container">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading conversation...</p>
          </div>
        ) : (
          <>
            <div className="messages-container" ref={messagesContainerRef}>
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
                >
                  <div className={`message-bubble ${message.isUser ? 'user-bubble' : 'ai-bubble'}`}>
                    <p className="message-text">{message.text}</p>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message ai-message">
                  <div className="message-bubble ai-bubble">
                    <div className="typing-indicator">
                      <span>AI is typing</span>
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
              <div className="quick-actions">
                <p className="quick-actions-label">Quick Actions:</p>
                <div className="quick-actions-scroll">
                  {quickActions.map(action => (
                    <button
                      key={action.id}
                      className="quick-action-btn"
                      onClick={() => handleQuickAction(action.text)}
                      disabled={isTyping}
                    >
                      <span className="quick-action-icon">{action.icon}</span>
                      <span>{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="chat-input-container">
              <div className="chat-input-wrapper">
                <textarea
                  className="chat-input"
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isTyping}
                  rows={1}
                  maxLength={500}
                />
                <button
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                  title="Send message"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AIChatScreen
