-- View All Caregiver-Senior Relationships
-- Run this in Supabase SQL Editor to see all relationships

-- ============================================
-- View all relationships with details
-- ============================================
SELECT 
  cr.id as relationship_id,
  cr.caregiver_id,
  cr.caregiver_email,
  cr.senior_email,
  cr.senior_id,
  cr.status,
  cr.verification_code,
  cr.requested_at,
  cr.approved_at,
  cr.created_at,
  cr.updated_at,
  -- Get caregiver name if available
  (SELECT email FROM auth.users WHERE id = cr.caregiver_id) as caregiver_auth_email,
  -- Get senior name if available
  (SELECT email FROM auth.users WHERE id = cr.senior_id) as senior_auth_email
FROM caregiver_relationships cr
ORDER BY 
  cr.status,
  cr.requested_at DESC;

-- ============================================
-- Summary by status
-- ============================================
SELECT 
  status,
  COUNT(*) as count,
  MIN(requested_at) as earliest_request,
  MAX(requested_at) as latest_request
FROM caregiver_relationships
GROUP BY status
ORDER BY status;

-- ============================================
-- Approved relationships only
-- ============================================
SELECT 
  cr.caregiver_email,
  cr.senior_email,
  cr.approved_at,
  cr.senior_id,
  cr.caregiver_id
FROM caregiver_relationships cr
WHERE cr.status = 'approved'
ORDER BY cr.approved_at DESC;

-- ============================================
-- Pending requests
-- ============================================
SELECT 
  cr.id,
  cr.caregiver_email,
  cr.senior_email,
  cr.verification_code,
  cr.requested_at
FROM caregiver_relationships cr
WHERE cr.status = 'pending'
ORDER BY cr.requested_at DESC;

-- ============================================
-- Rejected requests
-- ============================================
SELECT 
  cr.caregiver_email,
  cr.senior_email,
  cr.requested_at,
  cr.updated_at as rejected_at
FROM caregiver_relationships cr
WHERE cr.status = 'rejected'
ORDER BY cr.updated_at DESC;

