-- Allow Caregivers to Resubmit Rejected Requests
-- This policy allows caregivers to update their own rejected relationships back to pending
-- Run this in Supabase SQL Editor

-- Add UPDATE policy for caregivers to update their own rejected relationships
CREATE POLICY "Caregivers can resubmit rejected requests" ON caregiver_relationships
  FOR UPDATE
  USING (
    -- Caregiver can only update their own relationships
    auth.uid() = caregiver_id
    AND
    -- Only allow updating if current status is 'rejected'
    status = 'rejected'
  )
  WITH CHECK (
    -- After update, must be their own relationship
    auth.uid() = caregiver_id
    AND
    -- Can only change status from 'rejected' to 'pending'
    status = 'pending'
  );

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND policyname = 'Caregivers can resubmit rejected requests';

