import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import { User } from '../types';
import { useFontSize } from '../contexts/FontSizeContext';
import { useLanguage } from '../contexts/LanguageContext';
import './MainScreen.css';

interface MainScreenProps {
  user: User | null;
  onLogout: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { getFontSize } = useFontSize();
  const { t } = useLanguage();
  
  const showAsEmployer = true;
  const showAsProvider = true;
  const visibleCardsCount = (showAsEmployer ? 2 : 0) + (showAsProvider ? 2 : 0);
  let cardWidth: string = '48%';
  let isVerticalLayout = false;
  
  if (visibleCardsCount === 2) {
    cardWidth = '100%';
    isVerticalLayout = true;
  } else if (visibleCardsCount === 3) {
    cardWidth = '48%';
  } else {
    cardWidth = '48%';
  }
  
  const isOnlyOneViewEnabled = (showAsEmployer && !showAsProvider) || (!showAsEmployer && showAsProvider);
  if (isOnlyOneViewEnabled) {
    cardWidth = '100%';
    isVerticalLayout = true;
  }

  const fontSizeStyles = {
    logo: { fontSize: getFontSize(28) },
    logoutText: { fontSize: getFontSize(14) },
    welcomeTitle: { fontSize: getFontSize(24) },
    welcomeSubtitle: { fontSize: getFontSize(16) },
    featureTitle: { fontSize: getFontSize(16) },
    ctaTitle: { fontSize: getFontSize(20) },
    ctaDescription: { fontSize: getFontSize(14) },
    ctaButtonText: { fontSize: getFontSize(16) },
  };

  return (
    <div className="main-container">
      <div className="main-header">
        <div className="main-logo" style={fontSizeStyles.logo}>EnabledAi</div>
        <div className="main-header-buttons">
          <button onClick={() => navigate('/settings')} className="main-settings-button">
            <Icon name="settings-outline" size={20} />
          </button>
          <button onClick={onLogout} className="main-logout-button">
            <span className="main-logout-text" style={fontSizeStyles.logoutText}>{t('main.logout')}</span>
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="main-welcome-card">
          <div className="main-welcome-title" style={fontSizeStyles.welcomeTitle}>
            {t('main.welcome')}{user?.firstName ? ` ${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)}` : ''}!
          </div>
          <div className="main-welcome-subtitle" style={fontSizeStyles.welcomeSubtitle}>
            {t('main.ai_companion')}
          </div>
        </div>

        <div className={`main-feature-grid ${isVerticalLayout ? 'main-vertical-grid' : ''}`}>
          {showAsEmployer && (
            <button 
              className={`main-feature-card ${cardWidth === '100%' ? 'main-full-width-card' : 'main-half-width-card'}`}
              onClick={() => navigate('/health-monitoring')}
            >
              <Icon name="heart-outline" size={32} style={{ marginBottom: '10px' }} />
              <div className="main-feature-title" style={fontSizeStyles.featureTitle}>{t('main.monitor')}</div>
            </button>
          )}

          {showAsProvider && (
            <button 
              className={`main-feature-card ${cardWidth === '100%' ? 'main-full-width-card' : 'main-half-width-card'}`}
              onClick={() => navigate('/activities')}
            >
              <Icon name="fitness-outline" size={32} style={{ marginBottom: '10px' }} />
              <div className="main-feature-title" style={fontSizeStyles.featureTitle}>{t('main.activities')}</div>
            </button>
          )}

          {showAsEmployer && (
            <button 
              className={`main-feature-card ${cardWidth === '100%' ? 'main-full-width-card' : 'main-half-width-card'}`}
              onClick={() => navigate('/medication')}
            >
              <Icon name="medical-outline" size={32} style={{ marginBottom: '10px' }} />
              <div className="main-feature-title" style={fontSizeStyles.featureTitle}>{t('main.medication')}</div>
            </button>
          )}

          {showAsProvider && (
            <button 
              className={`main-feature-card ${cardWidth === '100%' ? 'main-full-width-card' : 'main-half-width-card'}`}
              onClick={() => navigate('/admin-dashboard')}
            >
              <Icon name="analytics-outline" size={32} style={{ marginBottom: '10px' }} />
              <div className="main-feature-title" style={fontSizeStyles.featureTitle}>{t('main.dashboard')}</div>
            </button>
          )}
        </div>

        <button 
          className="main-cta-card"
          onClick={() => navigate('/chat-selection')}
        >
          <div className="main-cta-title" style={fontSizeStyles.ctaTitle}>{t('main.chat_ai')}</div>
          <div className="main-cta-description" style={fontSizeStyles.ctaDescription}>
            {t('main.ai_easy')}
          </div>
          {(showAsEmployer || (showAsProvider && !showAsEmployer)) && (
            <div className="main-cta-button">
              <span className="main-cta-button-text" style={fontSizeStyles.ctaButtonText}>{t('main.chat_ai')}</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default MainScreen;

