import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons';
import './AdminDashboardScreen.css';

const AdminDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="admin-container">
      <div className="admin-header">
        <button onClick={() => navigate('/main')} className="admin-back-button">
          <Icon name="arrow-back" size={24} />
        </button>
        <div className="admin-header-title">Admin Dashboard</div>
        <div className="admin-header-spacer"></div>
      </div>
      <div className="admin-content">
        <div className="admin-placeholder">Admin Dashboard feature coming soon</div>
      </div>
    </div>
  );
};

export default AdminDashboardScreen;

