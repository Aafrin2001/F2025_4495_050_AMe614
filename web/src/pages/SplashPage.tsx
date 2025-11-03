import React from 'react';
import './SplashPage.css';

const SplashPage: React.FC = () => {
  return (
    <div className="splash-page">
      <div className="splash-content">
        <h1 className="splash-title">Health Companion</h1>
        <p className="splash-subtitle">Your Personal Health Assistant</p>
        <div className="splash-loader">
          <div className="spinner"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashPage;

