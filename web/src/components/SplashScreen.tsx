import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SplashScreen.css';

interface SplashScreenProps {
  onFinish: () => void;
  isLoading?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, isLoading = false }) => {
  const [fadeIn, setFadeIn] = useState(false);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    // Animate fade and scale
    setFadeIn(true);
    setTimeout(() => setScale(1), 100);
    
    if (!isLoading) {
      const timer = setTimeout(() => {
        onFinish();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onFinish]);

  return (
    <div className="splash-container">
      <div 
        className={`splash-logo-container ${fadeIn ? 'fade-in' : ''}`}
        style={{ transform: `scale(${scale})` }}
      >
        <div className="splash-logo">
          <div className="splash-logo-text">EAi</div>
        </div>
        <div className="splash-tagline">Your Health Companion, Always Here</div>
        <div className="splash-subtitle">Personalized healthcare support for seniors</div>
      </div>
      
      <div className={`splash-loading ${fadeIn ? 'fade-in' : ''}`}>
        <div className="splash-loading-dots">
          <div className="splash-dot splash-dot1"></div>
          <div className="splash-dot splash-dot2"></div>
          <div className="splash-dot splash-dot3"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

