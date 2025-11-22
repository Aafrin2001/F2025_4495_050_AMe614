import React, { useState } from 'react'
import './LoginScreen.css'
import { User } from '../types'
import { auth } from '../lib/supabase'
import { CaregiverService } from '../lib/caregiverService'

interface LoginScreenProps {
  onLogin: (user: User) => void
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userType, setUserType] = useState<'hire' | 'offer'>('hire')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seniorEmail, setSeniorEmail] = useState('')
  const [showSeniorEmailInput, setShowSeniorEmailInput] = useState(false)

  const handleAuth = async () => {
    setError(null)
    
    if (isLogin) {
      if (!email || !password) {
        setError('Please fill in email and password')
        return
      }
      
      setIsLoading(true)
      try {
        const { data, error } = await auth.signIn(email, password)
        
        if (error) {
          setError(error.message || 'An error occurred during login')
          setIsLoading(false)
          return
        }
        
        if (data?.user) {
          const loggedInUserType = data.user.user_metadata?.userType || 'hire'
          
          // Convert Supabase user to our User type
          const userData: User = {
            id: data.user.id,
            firstName: data.user.user_metadata?.firstName || '',
            lastName: data.user.user_metadata?.lastName || '',
            email: data.user.email || '',
            phoneNumber: data.user.user_metadata?.phoneNumber,
            userType: loggedInUserType
          }
          
          // If caregiver, try to load existing relationship
          if (loggedInUserType === 'offer') {
            try {
              const relationship = await CaregiverService.getSeniorUserId(userData.id)
              if (relationship.success && relationship.seniorUserId) {
                userData.seniorUserId = relationship.seniorUserId
                userData.seniorEmail = relationship.seniorEmail
              }
            } catch (relError) {
              console.error('Error loading caregiver relationship:', relError)
              // Continue without relationship data - caregiver can add patients from dashboard
            }
          }
          
          onLogin(userData)
        }
      } catch (error: any) {
        // Handle network errors
        if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch') || error?.message?.includes('Network error')) {
          setError('Network error: Could not connect to the server. Please check your internet connection and ensure Supabase is configured correctly.')
        } else if (error?.message?.includes('not configured')) {
          setError('Supabase is not configured. Please set up your environment variables.')
        } else {
          setError(error?.message || 'An unexpected error occurred during login')
        }
      } finally {
        setIsLoading(false)
      }
    } else {
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        setError('Please fill in all required fields')
        return
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      
      setIsLoading(true)
      try {
        const { data, error } = await auth.signUp(email, password, {
          firstName,
          lastName,
          phoneNumber: phoneNumber || undefined,
          userType
        })
        
        if (error) {
          setError(error.message || 'An error occurred during registration')
          setIsLoading(false)
          return
        }
        
        if (data?.user) {
          setError(null)
          alert('Registration successful! Please check your email to verify your account before signing in.')
          setIsLogin(true)
          // Clear form
          setFirstName('')
          setLastName('')
          setEmail('')
          setPhoneNumber('')
          setPassword('')
          setConfirmPassword('')
        }
      } catch (error: any) {
        // Handle network errors
        if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch') || error?.message?.includes('Network error')) {
          setError('Network error: Could not connect to the server. Please check your internet connection and ensure Supabase is configured correctly.')
        } else if (error?.message?.includes('not configured')) {
          setError('Supabase is not configured. Please set up your environment variables.')
        } else {
          setError(error?.message || 'An unexpected error occurred during registration')
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSeniorEmailSubmit = async () => {
    if (!seniorEmail || !email || !password) {
      setError('Please enter the senior\'s email address')
      return
    }

    setIsLoading(true)
    try {
      // Find senior user by email
      const seniorResult = await CaregiverService.findSeniorByEmail(seniorEmail.trim())
      
      if (!seniorResult.success || !seniorResult.userId) {
        setError(seniorResult.error || 'Could not find a user with that email. Please ensure the senior has an account.')
        setIsLoading(false)
        return
      }

      // Get current user (we already logged in)
      const { user: currentUser, error: userError } = await auth.getCurrentUser()
      
      if (userError || !currentUser) {
        setError('Could not retrieve user information')
        setIsLoading(false)
        return
      }

      // Request caregiver access (creates pending relationship)
      const requestResult = await CaregiverService.requestAccess(
        seniorEmail.trim(),
        currentUser.id,
        currentUser.email || ''
      )

      if (!requestResult.success) {
        setError(requestResult.error || 'Could not create access request. The senior may need to approve your request first.')
        setIsLoading(false)
        return
      }

      // Verify access (check if already approved)
      const verifyResult = await CaregiverService.verifyAccess(
        currentUser.id,
        seniorEmail.trim()
      )

      if (verifyResult.success && verifyResult.relationship) {
        // Already approved - proceed with login
        const user: User = {
          id: currentUser.id,
          firstName: currentUser.user_metadata?.firstName || '',
          lastName: currentUser.user_metadata?.lastName || '',
          email: currentUser.email || '',
          phoneNumber: currentUser.user_metadata?.phoneNumber,
          userType: currentUser.user_metadata?.userType || 'offer',
          seniorEmail: verifyResult.relationship.senior_email,
          seniorUserId: verifyResult.relationship.senior_id || undefined
        }
        
        setShowSeniorEmailInput(false)
        setSeniorEmail('')
        onLogin(user)
      } else {
        // Pending approval - show message but still log them in
        alert(
          `Access request sent! A request has been sent to ${seniorEmail.trim()}. ` +
          `The senior will need to approve your access before you can view their information.\n\n` +
          `Verification Code: ${requestResult.verificationCode}\n\n` +
          `Please ask the senior to approve your request or provide this code for verification.`
        )
        
        const user: User = {
          id: currentUser.id,
          firstName: currentUser.user_metadata?.firstName || '',
          lastName: currentUser.user_metadata?.lastName || '',
          email: currentUser.email || '',
          phoneNumber: currentUser.user_metadata?.phoneNumber,
          userType: currentUser.user_metadata?.userType || 'offer',
          seniorEmail: seniorEmail.trim(),
        }
        
        setShowSeniorEmailInput(false)
        setSeniorEmail('')
        onLogin(user)
      }
    } catch (error: any) {
      // Handle network errors
      if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch') || error?.message?.includes('Network error')) {
        setError('Network error: Could not connect to the server. Please check your internet connection and ensure Supabase is configured correctly.')
      } else if (error?.message?.includes('not configured')) {
        setError('Supabase is not configured. Please set up your environment variables.')
      } else {
        setError(error?.message || 'An unexpected error occurred while connecting to senior account')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-card">
          {/* Logo and Header */}
          <div className="login-header">
            <div className="login-logo">EAi</div>
            <h1 className="login-title">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="login-subtitle">
              {isLogin 
                ? 'Sign in to continue to your health companion' 
                : 'Join EAi and take control of your health'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Senior Email Input (for caregivers) */}
          {showSeniorEmailInput && (
            <div className="senior-email-section">
              <h3 className="senior-email-title">Enter Senior's Email</h3>
              <p className="senior-email-subtitle">
                Please enter the email address of the senior you're caring for
              </p>
              <div className="form-group">
                <label className="form-label">Senior's Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="senior@example.com"
                  value={seniorEmail}
                  onChange={(e) => setSeniorEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowSeniorEmailInput(false)}
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSeniorEmailSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connecting...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Main Form */}
          {!showSeniorEmailInput && (
            <>
              {/* User Type Selection (Signup only) */}
              {!isLogin && (
                <div className="user-type-selection">
                  <label className="form-label">I am a:</label>
                  <div className="user-type-buttons">
                    <button
                      className={`user-type-btn ${userType === 'hire' ? 'active' : ''}`}
                      onClick={() => setUserType('hire')}
                      type="button"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span>Senior</span>
                    </button>
                    <button
                      className={`user-type-btn ${userType === 'offer' ? 'active' : ''}`}
                      onClick={() => setUserType('offer')}
                      type="button"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span>Caregiver</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="form-fields">
                {!isLogin && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    {!isLogin && (
                      <div className="form-group">
                        <label className="form-label">Phone Number (Optional)</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="+1 (555) 123-4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                className="btn-primary btn-submit"
                onClick={handleAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"></path>
                    </svg>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>

              {/* Toggle Login/Signup */}
              <div className="login-toggle">
                <span>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                </span>
                <button
                  className="toggle-link"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError(null)
                  }}
                  disabled={isLoading}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginScreen

