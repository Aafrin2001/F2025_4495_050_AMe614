import React, { useState } from 'react';
import { auth } from '../lib/supabase';
import { CaregiverService } from '../lib/caregiverService';
import { User } from '../types';
import './AuthPage.css';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState<'hire' | 'offer'>('hire');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [seniorEmail, setSeniorEmail] = useState('');
  const [showSeniorEmailInput, setShowSeniorEmailInput] = useState(false);

  const handleAuth = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error: authError } = await auth.signIn(email, password);
        if (authError || !data?.user) {
          setError(authError?.message || 'Login failed');
          setIsLoading(false);
          return;
        }

        const loggedInUserType = data.user.user_metadata?.userType || 'hire';
        if (loggedInUserType === 'offer') {
          setShowSeniorEmailInput(true);
          setIsLoading(false);
          return;
        }

        const user: User = {
          id: data.user.id,
          firstName: data.user.user_metadata?.firstName || '',
          lastName: data.user.user_metadata?.lastName || '',
          email: data.user.email || '',
          phoneNumber: data.user.user_metadata?.phoneNumber,
          userType: loggedInUserType,
        };
        onLogin(user);
      } else {
        const { data, error: authError } = await auth.signUp(email, password, {
          firstName,
          lastName,
          phoneNumber,
          userType,
        });

        if (authError || !data?.user) {
          setError(authError?.message || 'Registration failed');
          setIsLoading(false);
          return;
        }

        if (userType === 'offer') {
          setShowSeniorEmailInput(true);
          setIsLoading(false);
          return;
        }

        const user: User = {
          id: data.user.id,
          firstName,
          lastName,
          email,
          phoneNumber,
          userType,
        };
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeniorEmailSubmit = async () => {
    if (!seniorEmail.trim()) {
      setError('Please enter the senior\'s email address');
      return;
    }

    setIsLoading(true);
    try {
      const { user, error: userError } = await auth.getCurrentUser();
      if (userError || !user) {
        setError('Could not retrieve user information. Please try again.');
        setIsLoading(false);
        return;
      }

      const requestResult = await CaregiverService.requestAccess(
        seniorEmail.trim(),
        user.id,
        user.email || ''
      );

      if (!requestResult.success) {
        setError(requestResult.error || 'Failed to request access');
        setIsLoading(false);
        return;
      }

      const verifyResult = await CaregiverService.verifyAccess(user.id, seniorEmail.trim());
      if (verifyResult.success && verifyResult.relationship?.status === 'approved') {
        const updatedUser: User = {
          id: user.id,
          firstName: user.user_metadata?.firstName || '',
          lastName: user.user_metadata?.lastName || '',
          email: user.email || '',
          phoneNumber: user.user_metadata?.phoneNumber,
          userType: 'offer',
          seniorEmail: seniorEmail.trim(),
          seniorUserId: verifyResult.relationship.senior_id,
        };
        onLogin(updatedUser);
      } else {
        const updatedUser: User = {
          id: user.id,
          firstName: user.user_metadata?.firstName || '',
          lastName: user.user_metadata?.lastName || '',
          email: user.email || '',
          phoneNumber: user.user_metadata?.phoneNumber,
          userType: 'offer',
          seniorEmail: seniorEmail.trim(),
        };
        alert(`Access request sent! Verification code: ${requestResult.verificationCode}\n\nPlease ask the senior to approve your request.`);
        onLogin(updatedUser);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Health Companion</h1>
          <p>{isLogin ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        {showSeniorEmailInput ? (
          <div className="auth-form">
            <h2>Enter Senior's Email</h2>
            <input
              type="email"
              placeholder="Senior's email address"
              value={seniorEmail}
              onChange={(e) => setSeniorEmail(e.target.value)}
              className="auth-input"
            />
            {error && <div className="auth-error">{error}</div>}
            <button
              onClick={handleSeniorEmailSubmit}
              disabled={isLoading}
              className="auth-button"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
            <button
              onClick={() => setShowSeniorEmailInput(false)}
              className="auth-link-button"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="auth-form">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="auth-input"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="auth-input"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="auth-input"
                />
                <div className="auth-radio-group">
                  <label>
                    <input
                      type="radio"
                      name="userType"
                      value="hire"
                      checked={userType === 'hire'}
                      onChange={() => setUserType('hire')}
                    />
                    Senior/Patient
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="userType"
                      value="offer"
                      checked={userType === 'offer'}
                      onChange={() => setUserType('offer')}
                    />
                    Caregiver/Family
                  </label>
                </div>
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />

            {error && <div className="auth-error">{error}</div>}

            <button
              onClick={handleAuth}
              disabled={isLoading}
              className="auth-button"
            >
              {isLoading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
            </button>

            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="auth-link-button"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;

