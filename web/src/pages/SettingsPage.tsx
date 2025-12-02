import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackOutline } from 'react-icons/io5';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="settings-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <IoArrowBackOutline className="back-icon" /> Back
        </button>
        <h1>Settings</h1>
      </div>
      <div className="page-content">
        <div className="empty-state">
          <p>Settings features coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

