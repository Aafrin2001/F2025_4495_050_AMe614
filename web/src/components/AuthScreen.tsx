import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import { auth } from '../lib/supabase';
import { User } from '../types';
import { useFontSize } from '../contexts/FontSizeContext';
import { useLanguage } from '../contexts/LanguageContext';
import './AuthScreen.css';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'hire' | 'offer'>('hire');
  const [isLoading, setIsLoading] = useState(false);
  const { getFontSize } = useFontSize();
  const { t } = useLanguage();

  const handleAuth = async () => {
    if (isLogin) {
      if (!email || !password) {
        alert('Please fill in email and password');
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await auth.signIn(email, password);
        if (error) {
          alert(`Login Failed: ${error.message || 'An error occurred during login'}`);
          return;
        }
        if (data?.user) {
          const userData: User = {
            id: data.user.id,
            firstName: data.user.user_metadata?.firstName || '',
            lastName: data.user.user_metadata?.lastName || '',
            email: data.user.email || '',
            phoneNumber: data.user.user_metadata?.phoneNumber,
            userType: data.user.user_metadata?.userType || 'hire'
          };
          alert('Login successful!');
          onLogin(userData);
        }
      } catch (error) {
        alert('An unexpected error occurred during login');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        alert('Please fill in all required fields');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await auth.signUp(email, password, {
          firstName,
          lastName,
          phoneNumber: phoneNumber || undefined,
          userType
        });
        if (error) {
          alert(`Registration Failed: ${error.message || 'An error occurred during registration'}`);
          return;
        }
        if (data?.user) {
          alert('Registration Successful! Please check your email to verify your account before signing in.');
          setIsLogin(true);
        }
      } catch (error) {
        alert('An unexpected error occurred during registration');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fontSizeStyles = {
    logo: { fontSize: getFontSize(48) },
    welcomeText: { fontSize: getFontSize(28) },
    subtitle: { fontSize: getFontSize(16) },
    input: { fontSize: getFontSize(16) },
    userTypeLabel: { fontSize: getFontSize(18) },
    radioText: { fontSize: getFontSize(16) },
    authButtonText: { fontSize: getFontSize(18) },
    switchButtonText: { fontSize: getFontSize(16) },
  };

  return (
    <div className="auth-container">
      {!isLogin && (
        <div className="auth-back-button-container">
          <button onClick={() => setIsLogin(true)} className="auth-back-button">
            <Icon name="arrow-back" size={24} />
          </button>
        </div>
      )}
      <div className="auth-scroll-container">
        <div className="auth-header">
          <div className="auth-logo" style={fontSizeStyles.logo}>EnabledAi</div>
          <div className="auth-welcome-text" style={fontSizeStyles.welcomeText}>
            {isLogin ? t('auth.welcome_back') : t('auth.create_account')}
          </div>
          <div className="auth-subtitle" style={fontSizeStyles.subtitle}>
            {isLogin ? t('auth.sign_in_continue') : t('auth.create_get_started')}
          </div>
        </div>

        <div className="auth-form">
          {!isLogin && (
            <>
              <div className="auth-name-row">
                <div className="auth-input-container auth-half-width">
                  <input
                    className="auth-input"
                    style={fontSizeStyles.input}
                    placeholder={t('auth.first_name')}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="auth-input-container auth-half-width">
                  <input
                    className="auth-input"
                    style={fontSizeStyles.input}
                    placeholder={t('auth.last_name')}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-container">
                <div className="auth-input-with-icon">
                  <Icon name="mail-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <input
                    className="auth-input-with-icon-text"
                    style={fontSizeStyles.input}
                    type="email"
                    placeholder={t('auth.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-container">
                <input
                  className="auth-input"
                  style={fontSizeStyles.input}
                  type="tel"
                  placeholder={t('auth.phone')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="auth-input-container">
                <input
                  className="auth-input"
                  style={fontSizeStyles.input}
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="auth-input-container">
                <input
                  className="auth-input"
                  style={fontSizeStyles.input}
                  type="password"
                  placeholder={t('auth.confirm_password')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="auth-user-type-container">
                <div className="auth-user-type-label" style={fontSizeStyles.userTypeLabel}>{t('auth.i_am')}</div>
                <div className="auth-radio-group">
                  <button
                    className="auth-radio-option"
                    onClick={() => setUserType('hire')}
                  >
                    <div className="auth-radio-button">
                      {userType === 'hire' && <div className="auth-radio-selected" />}
                    </div>
                    <span className="auth-radio-text" style={fontSizeStyles.radioText}>{t('auth.senior_looking')}</span>
                  </button>

                  <button
                    className="auth-radio-option"
                    onClick={() => setUserType('offer')}
                  >
                    <div className="auth-radio-button">
                      {userType === 'offer' && <div className="auth-radio-selected" />}
                    </div>
                    <span className="auth-radio-text" style={fontSizeStyles.radioText}>{t('auth.caregiver')}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {isLogin && (
            <>
              <div className="auth-input-container">
                <div className="auth-input-with-icon">
                  <Icon name="mail-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <input
                    className="auth-input-with-icon-text"
                    style={fontSizeStyles.input}
                    type="email"
                    placeholder={t('auth.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-container">
                <input
                  className="auth-input"
                  style={fontSizeStyles.input}
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <button
            className={`auth-button ${isLoading ? 'auth-button-disabled' : ''}`}
            onClick={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="auth-spinner"></div>
            ) : (
              <span className="auth-button-text" style={fontSizeStyles.authButtonText}>
                {isLogin ? t('auth.sign_in') : t('auth.create_account_btn')}
              </span>
            )}
          </button>

          <button
            className="auth-switch-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            <span className="auth-switch-button-text" style={fontSizeStyles.switchButtonText}>
              {isLogin ? t('auth.sign_up') : t('auth.sign_in_prompt')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;

