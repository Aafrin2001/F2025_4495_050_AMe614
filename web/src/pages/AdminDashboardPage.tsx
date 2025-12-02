import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackOutline } from 'react-icons/io5';
import './AdminDashboardPage.css';

interface AdminDashboardPageProps {
  userId?: string;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ userId }) => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <IoArrowBackOutline className="back-icon" /> Back
        </button>
        <h1>Admin Dashboard</h1>
      </div>
      <div className="page-content">
        <div className="empty-state">
          <p>Admin dashboard features coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

