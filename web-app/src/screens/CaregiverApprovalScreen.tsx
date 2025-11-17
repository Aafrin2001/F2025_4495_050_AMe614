import React, { useState } from 'react'
import './CaregiverApprovalScreen.css'

interface CaregiverApprovalScreenProps {
  onBack: () => void
  onApprovalComplete?: () => void
}

interface CaregiverRequest {
  id: string
  caregiverEmail: string
  caregiverName: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

const CaregiverApprovalScreen: React.FC<CaregiverApprovalScreenProps> = ({ onBack, onApprovalComplete }) => {
  const [requests] = useState<CaregiverRequest[]>([
    {
      id: '1',
      caregiverEmail: 'caregiver@example.com',
      caregiverName: 'John Doe',
      requestedAt: '2 days ago',
      status: 'pending',
    },
  ])

  const handleApprove = (id: string) => {
    alert('Caregiver access approved!')
    onApprovalComplete?.()
  }

  const handleReject = (id: string) => {
    if (confirm('Are you sure you want to reject this caregiver request?')) {
      alert('Caregiver request rejected.')
    }
  }

  return (
    <div className="caregiver-approval-screen">
      <div className="approval-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 className="approval-title">Caregiver Requests</h1>
      </div>

      <div className="approval-content">
        {requests.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p>No pending caregiver requests</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-info">
                  <div className="request-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="request-details">
                    <h3 className="request-name">{request.caregiverName}</h3>
                    <p className="request-email">{request.caregiverEmail}</p>
                    <p className="request-time">Requested {request.requestedAt}</p>
                  </div>
                </div>
                <div className="request-actions">
                  <button className="btn-approve" onClick={() => handleApprove(request.id)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Approve
                  </button>
                  <button className="btn-reject" onClick={() => handleReject(request.id)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CaregiverApprovalScreen

