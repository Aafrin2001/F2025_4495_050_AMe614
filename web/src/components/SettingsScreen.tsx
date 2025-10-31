import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import { useFontSize, FontSizeScale } from '../contexts/FontSizeContext';
import { useLanguage, Language } from '../contexts/LanguageContext';
import './SettingsScreen.css';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { fontSizeScale, setFontSizeScale, getFontSize } = useFontSize();
  const { language, setLanguage, t } = useLanguage();
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const fontSizeStyles = {
    headerTitle: { fontSize: getFontSize(24) },
    sectionTitle: { fontSize: getFontSize(20) },
    settingTitle: { fontSize: getFontSize(16) },
    settingDescription: { fontSize: getFontSize(14) },
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button onClick={() => navigate('/main')} className="settings-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="settings-header-title" style={fontSizeStyles.headerTitle}>{t('settings.title')}</div>
        <div className="settings-header-spacer"></div>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <div className="settings-section-title" style={fontSizeStyles.sectionTitle}>{t('settings.accessibility')}</div>
          
          <button className="settings-item" onClick={() => setShowFontSizeModal(true)}>
            <div className="settings-item-info">
              <div className="settings-item-title" style={fontSizeStyles.settingTitle}>{t('settings.font_size')}</div>
              <div className="settings-item-description" style={fontSizeStyles.settingDescription}>
                {fontSizeScale === 'small' ? 'Small (85%)' : fontSizeScale === 'medium' ? 'Medium (100%)' : fontSizeScale === 'large' ? 'Large (125%)' : 'Extra Large (150%)'}
              </div>
            </div>
            <Icon name="arrow-forward" size={20} />
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-section-title" style={fontSizeStyles.sectionTitle}>{t('settings.app_preferences')}</div>
          
          <button className="settings-item" onClick={() => setShowLanguageModal(true)}>
            <div className="settings-item-info">
              <div className="settings-item-title" style={fontSizeStyles.settingTitle}>{t('settings.language')}</div>
              <div className="settings-item-description" style={fontSizeStyles.settingDescription}>{language}</div>
            </div>
            <Icon name="arrow-forward" size={20} />
          </button>
        </div>
      </div>

      {/* Font Size Modal */}
      {showFontSizeModal && (
        <div className="settings-modal-overlay" onClick={() => setShowFontSizeModal(false)}>
          <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <div className="settings-modal-title">{t('font_size.title')}</div>
              <button onClick={() => setShowFontSizeModal(false)} className="settings-modal-close">
                <Icon name="close" size={24} />
              </button>
            </div>
            {(['small', 'medium', 'large', 'extraLarge'] as FontSizeScale[]).map((scale) => (
              <button
                key={scale}
                className={`settings-modal-option ${fontSizeScale === scale ? 'active' : ''}`}
                onClick={() => {
                  setFontSizeScale(scale);
                  setShowFontSizeModal(false);
                }}
              >
                <div>
                  <div className="settings-modal-option-title">
                    {scale === 'small' ? t('font_size.small') : scale === 'medium' ? t('font_size.medium') : scale === 'large' ? t('font_size.large') : t('font_size.extra_large')}
                  </div>
                  <div className="settings-modal-option-desc">
                    {scale === 'small' ? t('font_size.small_desc') : scale === 'medium' ? t('font_size.medium_desc') : scale === 'large' ? t('font_size.large_desc') : t('font_size.extra_large_desc')}
                  </div>
                </div>
                {fontSizeScale === scale && <Icon name="checkmark" size={20} color="#667eea" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="settings-modal-overlay" onClick={() => setShowLanguageModal(false)}>
          <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <div className="settings-modal-title">{t('settings.language')}</div>
              <button onClick={() => setShowLanguageModal(false)} className="settings-modal-close">
                <Icon name="close" size={24} />
              </button>
            </div>
            {(['English', 'Spanish', 'French', 'German', 'Chinese'] as Language[]).map((lang) => (
              <button
                key={lang}
                className={`settings-modal-option ${language === lang ? 'active' : ''}`}
                onClick={() => {
                  setLanguage(lang);
                  setShowLanguageModal(false);
                }}
              >
                <div className="settings-modal-option-title">{lang}</div>
                {language === lang && <Icon name="checkmark" size={20} color="#667eea" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsScreen;

