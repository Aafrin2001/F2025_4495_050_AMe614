-- COMPREHENSIVE DIAGNOSTIC AND FIX
-- This will check what's working and fix what's not
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================
-- STEP 1: DIAGNOSTIC - See ALL policies
-- ============================================
SELECT 
  '=== ALL POLICIES ON caregiver_relationships ===' as info;
  
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
-- STEP 2: Check if get_user_email() works
-- ============================================
SELECT 
  '=== TESTING get_user_email() FUNCTION ===' as info;

-- Test the function
SELECT 
  auth.uid() as current_user_id,
  get_user_email() as current_user_email;

-- ============================================
-- STEP 3: Check what SELECT policy looks like (this one probably works)
-- ============================================
SELECT 
  '=== SELECT POLICY (this probably works) ===' as info;
  
SELECT 
  policyname,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND cmd = 'SELECT'
  AND policyname LIKE '%Seniors%';

-- ============================================
-- STEP 4: DROP ALL UPDATE POLICIES
-- ============================================
SELECT '=== DROPPING ALL UPDATE POLICIES ===' as info;

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
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- ============================================
-- STEP 5: Ensure get_user_email() function exists
-- ============================================
SELECT '=== CREATING/UPDATING get_user_email() FUNCTION ===' as info;

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

GRANT EXECUTE ON FUNCTION get_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email() TO anon;
GRANT EXECUTE ON FUNCTION get_user_email() TO service_role;

-- ============================================
-- STEP 6: Create UPDATE policy that MIRRORS the SELECT policy
-- ============================================
-- The key insight: Use the EXACT same logic as the SELECT policy
-- If they can SELECT it, they should be able to UPDATE it

SELECT '=== CREATING UPDATE POLICY (mirrors SELECT logic) ===' as info;

CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE
  USING (
    -- Use EXACT same conditions as SELECT policy
    -- Condition 1: senior_id matches
    senior_id = auth.uid()
    OR
    -- Condition 2: email matches and status is pending (same as SELECT)
    (
      status = 'pending' 
      AND LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(COALESCE(senior_email, '')))
    )
  )
  -- For WITH CHECK, we'll use the same logic but allow status changes
  WITH CHECK (
    -- Same authorization check
    senior_id = auth.uid()
    OR
    -- Email matches - but allow status to be pending, approved, or rejected
    (
      LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(COALESCE(senior_email, '')))
      AND status IN ('pending', 'approved', 'rejected')
    )
  );

-- ============================================
-- STEP 7: Verify the new policy
-- ============================================
SELECT 
  '=== VERIFICATION ===' as info;
  
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN '✓ USING clause exists'
    ELSE '✗ No USING clause'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL THEN '✓ WITH CHECK clause exists'
    ELSE '✗ No WITH CHECK clause'
  END as check_status
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND cmd = 'UPDATE'
  AND policyname = 'Seniors can update relationships for them';

-- ============================================
-- STEP 8: Summary
-- ============================================
SELECT 
  '=== SUMMARY ===' as info,
  'If you see the policy above with both USING and WITH CHECK, it should work now!' as message;

