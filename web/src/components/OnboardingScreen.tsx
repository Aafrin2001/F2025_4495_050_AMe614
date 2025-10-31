import React, { useState } from 'react';
import { Icon } from '../utils/icons';
import './OnboardingScreen.css';

interface OnboardingScreenProps {
  onFinish: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'Health Monitoring',
      description: 'Track your vital signs, medications, and health metrics with easy-to-use tools designed for seniors.',
      image: 'heart-outline',
    },
    {
      id: 2,
      title: 'AI-Powered Care',
      description: 'Get personalized health insights, reminders, and support from our intelligent AI companion.',
      image: 'heart-outline',
    },
  ];

  const scrollToNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onFinish();
    }
  };

  const scrollToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-slide">
        <div className="onboarding-icon-container">
          <Icon name={slides[currentIndex].image} size={60} />
        </div>
        <div className="onboarding-title">{slides[currentIndex].title}</div>
        <div className="onboarding-description">{slides[currentIndex].description}</div>
      </div>

      <div className="onboarding-pagination">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`onboarding-dot ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="onboarding-buttons">
        {currentIndex > 0 && (
          <button onClick={scrollToPrevious} className="onboarding-button onboarding-button-secondary">
            Previous
          </button>
        )}
        <button onClick={scrollToNext} className="onboarding-button onboarding-button-primary">
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;

