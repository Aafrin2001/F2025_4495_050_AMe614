import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackOutline } from 'react-icons/io5';
import './CaregiverApprovalPage.css';

const CaregiverApprovalPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="caregiver-approval-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <IoArrowBackOutline className="back-icon" /> Back
        </button>
        <h1>Caregiver Approval</h1>
      </div>
      <div className="page-content">
        <div className="empty-state">
          <p>Caregiver approval features coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default CaregiverApprovalPage;

