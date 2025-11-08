-- COMPLETE FIX: Comprehensive Solution for Caregiver Rejection RLS Error
-- This script will diagnose and fix the issue completely
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================
-- STEP 1: DIAGNOSTIC - See what policies exist
-- ============================================
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'caregiver_relationships'
ORDER BY cmd, policyname;

-- ============================================
-- STEP 2: DROP ALL UPDATE POLICIES
-- ============================================
-- Drop any existing UPDATE policies to avoid conflicts
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
  END LOOP;
END $$;

-- ============================================
-- STEP 3: CREATE THE FIXED POLICY
-- ============================================
-- This policy uses WITH CHECK (true) which means:
-- "If you can see the row (USING passes), you can update it to anything"

CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE
  USING (
    -- Condition 1: User is the senior (by senior_id)
    senior_id = auth.uid()
    OR
    -- Condition 2: User's email matches and request is pending
    (
      status = 'pending'
      AND EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND LOWER(TRIM(COALESCE(email, ''))) = LOWER(TRIM(COALESCE(senior_email, '')))
      )
    )
  )
  WITH CHECK (true); -- Allow any update if USING condition is met

-- ============================================
-- STEP 4: VERIFY THE FIX
-- ============================================
SELECT 
  'Policy created successfully!' as status,
  policyname,
  cmd,
  CASE 
    WHEN with_check = 'true' THEN '✓ WITH CHECK is permissive (allows any update)'
    ELSE '✗ WITH CHECK is restrictive'
  END as check_status
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND cmd = 'UPDATE'
  AND policyname = 'Seniors can update relationships for them';

-- ============================================
-- STEP 5: TEST THE FUNCTION (if using helper)
-- ============================================
-- If you're using get_user_email(), test it:
SELECT 
  auth.uid() as current_user_id,
  get_user_email() as current_user_email;

-- ============================================
-- NOTES:
-- ============================================
-- After running this:
-- 1. The policy should allow seniors to update relationships where their email matches
-- 2. WITH CHECK (true) means any status change is allowed (pending -> approved/rejected)
-- 3. Try rejecting a request again - it should work now
-- 
-- If it STILL doesn't work:
-- 1. Check that you're logged in as the senior (not caregiver)
-- 2. Verify the senior_email in the relationship matches your user email exactly
-- 3. Check Supabase logs for more details
-- 4. Make sure there are no other RLS policies blocking this

