import React, { useState, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import './CaregiverApprovalScreen.css'
import { CaregiverService, CaregiverRelationship } from '../lib/caregiverService'
import { auth, supabase } from '../lib/supabase'

interface CaregiverApprovalScreenProps {
  onBack: () => void
  onApprovalComplete?: () => void
}

const CaregiverApprovalScreen: React.FC<CaregiverApprovalScreenProps> = ({
  onBack,
  onApprovalComplete,
}) => {
  const [pendingRequests, setPendingRequests] = useState<CaregiverRelationship[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<CaregiverRelationship | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const loadPendingRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const { user, error: userError } = await auth.getCurrentUser()
      if (userError || !user) {
        setError('Not authenticated. Please log in again.')
        setLoading(false)
        return
      }

      // Get pending requests for this senior's email
      const { data, error: queryError } = await supabase
        .from('caregiver_relationships')
        .select('*')
        .eq('senior_email', user.email?.toLowerCase() || '')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })

      if (queryError) {
        console.error('Error loading requests:', queryError)
        setError('Failed to load requests')
        return
      }

      setPendingRequests(data || [])
    } catch (err: any) {
      console.error('Error:', err)
      setError('An error occurred while loading requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (relationshipId: string, code?: string) => {
    setProcessing(relationshipId)
    setError(null)
    try {
      const { user, error: userError } = await auth.getCurrentUser()
      if (userError || !user) {
        setError('Not authenticated. Please log in again.')
        setProcessing(null)
        return
      }

      const result = await CaregiverService.approveRequest(relationshipId, user.id, code)
      
      if (result.success) {
        alert('Success! Caregiver access approved!')
        await loadPendingRequests()
        if (onApprovalComplete) {
          onApprovalComplete()
        }
      } else {
        setError(result.error || 'Failed to approve request')
      }
    } catch (err: any) {
      setError('An error occurred while approving the request')
    } finally {
      setProcessing(null)
      setSelectedRequest(null)
      setVerificationCode('')
      setShowVerificationModal(false)
    }
  }

  const handleReject = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to reject this caregiver request?')) {
      return
    }

    setProcessing(relationshipId)
    setError(null)
    try {
      const result = await CaregiverService.rejectRequest(relationshipId)
      if (result.success) {
        alert('Request Rejected. The caregiver has been notified.')
        await loadPendingRequests()
        if (onApprovalComplete) {
          onApprovalComplete()
        }
      } else {
        setError(result.error || 'Failed to reject request')
      }
    } catch (err: any) {
      setError('An error occurred while rejecting the request')
    } finally {
      setProcessing(null)
    }
  }

  const handleApproveClick = (request: CaregiverRelationship) => {
    if (request.verification_code) {
      setSelectedRequest(request)
      setShowVerificationModal(true)
    } else {
      handleApprove(request.id)
    }
  }

  const handleVerificationSubmit = () => {
    if (!selectedRequest) return

    if (verificationCode === selectedRequest.verification_code) {
      handleApprove(selectedRequest.id, verificationCode)
    } else {
      setError('Invalid verification code')
    }
  }

  if (loading) {
    return (
      <div className="caregiver-approval-screen">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      </div>
    )
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
        <div className="header-spacer"></div>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      <div className="approval-content">
        {pendingRequests.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3>No Pending Requests</h3>
            <p>All caregiver requests have been processed</p>
          </div>
        ) : (
          <>
            <div className="section-header">
              <h2 className="section-title">
                {pendingRequests.length} Pending Request{pendingRequests.length !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="requests-list">
              {pendingRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <div className="request-info">
                      <h3 className="request-email">{request.caregiver_email}</h3>
                      <p className="request-date">
                        Requested {format(new Date(request.requested_at), 'MMM d, yyyy')} ({formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })})
                      </p>
                    </div>
                  </div>

                  {request.verification_code && (
                    <div className="verification-section">
                      <label className="verification-label">Verification Code:</label>
                      <div className="verification-code">{request.verification_code}</div>
                    </div>
                  )}

                  <div className="request-actions">
                    <button
                      className="btn-reject"
                      onClick={() => handleReject(request.id)}
                      disabled={processing === request.id}
                    >
                      {processing === request.id ? (
                        <div className="spinner-small"></div>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                          Reject
                        </>
                      )}
                    </button>

                    <button
                      className="btn-approve"
                      onClick={() => handleApproveClick(request)}
                      disabled={processing === request.id}
                    >
                      {processing === request.id ? (
                        <div className="spinner-small"></div>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Approve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Verification Code Modal */}
      {showVerificationModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowVerificationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Approve Request</h2>
              <button className="modal-close" onClick={() => setShowVerificationModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Enter verification code to approve:
              </p>
              <div className="verification-display">
                <label>Verification Code:</label>
                <div className="verification-code-large">{selectedRequest.verification_code}</div>
              </div>
              <div className="form-group">
                <label>Enter Code:</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  maxLength={6}
                  onKeyPress={e => e.key === 'Enter' && handleVerificationSubmit()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowVerificationModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleVerificationSubmit}
                disabled={!verificationCode || verificationCode !== selectedRequest.verification_code}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CaregiverApprovalScreen
