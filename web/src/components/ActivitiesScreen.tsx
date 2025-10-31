import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import { User } from '../types';
import './ActivitiesScreen.css';

interface ActivitiesScreenProps {
  user: User | null;
}

const ActivitiesScreen: React.FC<ActivitiesScreenProps> = ({ user }) => {
  const navigate = useNavigate();
  
  return (
    <div className="activities-container">
      <div className="activities-header">
        <button onClick={() => navigate('/main')} className="activities-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="activities-header-title">Activities</div>
        <div className="activities-header-spacer"></div>
      </div>
      <div className="activities-content">
        <div className="activities-placeholder">Activities feature coming soon</div>
      </div>
    </div>
  );
};

export default ActivitiesScreen;

