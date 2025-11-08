-- Fix RLS Policy for Caregiver Relationship Rejection
-- Run this SQL in your Supabase SQL Editor to fix the issue with rejecting caregiver requests
-- 
-- The issue: The WITH CHECK clause was only allowing status = 'pending', 
-- but when rejecting, the status changes to 'rejected', causing the policy to fail.
-- Also, the get_user_email() function might not be working correctly.

-- First, let's ensure the get_user_email() function exists and works
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  RETURN COALESCE(user_email, '');
END;
$$;

-- Drop the existing policy
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- Recreate the policy with a more robust WITH CHECK clause
-- USING checks the OLD row (before update), WITH CHECK checks the NEW row (after update)
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE USING (
    -- Allow update if senior_id matches (already approved relationships)
    senior_id = auth.uid()
    OR
    -- Or if email matches and current status is pending (checking OLD row)
    (status = 'pending' AND LOWER(COALESCE(get_user_email(), '')) = LOWER(senior_email))
  )
  WITH CHECK (
    -- Allow if senior_id matches (already approved relationships)
    senior_id = auth.uid()
    OR
    -- Or if email matches and new status is approved or rejected (checking NEW row)
    -- This allows the status to change from 'pending' to 'approved' or 'rejected'
    (LOWER(COALESCE(get_user_email(), '')) = LOWER(senior_email) AND status IN ('approved', 'rejected'))
    OR
    -- Also allow if email matches and status is still pending (in case of other field updates)
    (LOWER(COALESCE(get_user_email(), '')) = LOWER(senior_email) AND status = 'pending')
  );

