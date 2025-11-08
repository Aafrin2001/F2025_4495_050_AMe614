-- Comprehensive Diagnostic and Fix for Caregiver Relationship RLS Policy
-- Run this entire script in your Supabase SQL Editor

-- ============================================
-- STEP 1: Check if the function exists and works
-- ============================================
-- Test the get_user_email() function
SELECT get_user_email() as current_user_email;

-- ============================================
-- STEP 2: Check existing policies
-- ============================================
-- List all policies on caregiver_relationships table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'caregiver_relationships';

-- ============================================
-- STEP 3: Ensure the helper function is correct
-- ============================================
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
EXCEPTION
  WHEN OTHERS THEN
    RETURN '';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_email() TO authenticated;

-- ============================================
-- STEP 4: Drop and recreate the UPDATE policy
-- ============================================
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- Create a new, more permissive policy
-- This allows seniors to update relationships where:
-- 1. They are the senior (by senior_id or email match)
-- 2. The status can change from 'pending' to 'approved' or 'rejected'
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE 
  USING (
    -- Case 1: Already approved relationship where senior_id matches
    senior_id = auth.uid()
    OR
    -- Case 2: Pending request where email matches
    (
      status = 'pending' 
      AND LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(senior_email))
    )
  )
  WITH CHECK (
    -- Case 1: Already approved relationship
    senior_id = auth.uid()
    OR
    -- Case 2: Email matches and status is valid (pending, approved, or rejected)
    (
      LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(senior_email))
      AND status IN ('pending', 'approved', 'rejected')
    )
  );

-- ============================================
-- STEP 5: Verify the policy was created
-- ============================================
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND policyname = 'Seniors can update relationships for them';

-- ============================================
-- NOTES:
-- ============================================
-- If you're still getting errors after running this:
-- 1. Make sure you're logged in as the senior user (not the caregiver)
-- 2. Check that the senior_email in the relationship matches your user email exactly
-- 3. Verify the relationship status is 'pending' before trying to reject
-- 4. Check Supabase logs for more detailed error messages

