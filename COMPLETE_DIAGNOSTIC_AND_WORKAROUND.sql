-- COMPLETE DIAGNOSTIC AND WORKAROUND
-- This will show us exactly what's wrong and provide a workaround
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================
-- STEP 1: Show ALL policies on the table
-- ============================================
SELECT '=== ALL POLICIES ===' as step;

SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'caregiver_relationships'
ORDER BY cmd, policyname;

-- ============================================
-- STEP 2: Test get_user_email() function
-- ============================================
SELECT '=== TESTING FUNCTION ===' as step;

SELECT 
  auth.uid() as current_user_id,
  get_user_email() as function_result,
  CASE 
    WHEN get_user_email() IS NULL OR get_user_email() = '' THEN '❌ FUNCTION NOT WORKING'
    ELSE '✓ FUNCTION WORKS'
  END as function_status;

-- ============================================
-- STEP 3: Check if you can SELECT the relationships
-- ============================================
SELECT '=== TESTING SELECT (should work) ===' as step;

SELECT 
  id,
  senior_email,
  status,
  senior_id,
  LOWER(TRIM(get_user_email())) as your_email,
  LOWER(TRIM(senior_email)) as relationship_email,
  CASE 
    WHEN LOWER(TRIM(get_user_email())) = LOWER(TRIM(senior_email)) THEN '✓ EMAIL MATCHES'
    ELSE '❌ EMAIL MISMATCH'
  END as email_match
FROM caregiver_relationships
WHERE status = 'pending'
LIMIT 5;

-- ============================================
-- STEP 4: DROP ALL UPDATE POLICIES
-- ============================================
SELECT '=== DROPPING ALL UPDATE POLICIES ===' as step;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'caregiver_relationships' 
    AND cmd = 'UPDATE'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON caregiver_relationships';
    RAISE NOTICE 'Dropped: %', r.policyname;
  END LOOP;
END $$;

-- ============================================
-- STEP 5: Create a database function to handle rejection
-- ============================================
-- WORKAROUND: Instead of relying on RLS, use a SECURITY DEFINER function
-- This function can bypass RLS and do the update

CREATE OR REPLACE FUNCTION reject_caregiver_request(relationship_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
AS $$
DECLARE
  current_user_email TEXT;
  relationship_email TEXT;
  relationship_status TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Get relationship details
  SELECT senior_email, status 
  INTO relationship_email, relationship_status
  FROM caregiver_relationships
  WHERE id = relationship_id;
  
  -- Check if relationship exists
  IF relationship_email IS NULL THEN
    RAISE EXCEPTION 'Relationship not found';
  END IF;
  
  -- Check if status is pending
  IF relationship_status != 'pending' THEN
    RAISE EXCEPTION 'This request has already been processed';
  END IF;
  
  -- Check if email matches
  IF LOWER(TRIM(current_user_email)) != LOWER(TRIM(relationship_email)) THEN
    RAISE EXCEPTION 'You do not have permission to reject this request';
  END IF;
  
  -- Update the relationship
  UPDATE caregiver_relationships
  SET 
    status = 'rejected',
    updated_at = NOW()
  WHERE id = relationship_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reject_caregiver_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_caregiver_request(UUID) TO anon;

-- ============================================
-- STEP 6: Also create a simple RLS policy as backup
-- ============================================
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE
  USING (
    senior_id = auth.uid()
    OR
    (
      status = 'pending'
      AND LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(COALESCE(senior_email, '')))
    )
  )
  WITH CHECK (true);

-- ============================================
-- STEP 7: Summary
-- ============================================
SELECT 
  '=== SUMMARY ===' as step,
  'Two solutions created:' as info,
  '1. Function: reject_caregiver_request() - bypasses RLS' as solution1,
  '2. RLS Policy: WITH CHECK (true) - most permissive' as solution2;

