-- WORKING FIX: Match the SELECT Policy Logic Exactly
-- Since seniors can SELECT pending requests, they should be able to UPDATE them
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: First, let's see what SELECT policy exists (this one works)
-- ============================================
SELECT 
  '=== CURRENT SELECT POLICY (this works) ===' as info;
  
SELECT 
  policyname,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND cmd = 'SELECT'
  AND (policyname LIKE '%Senior%' OR policyname LIKE '%senior%');

-- ============================================
-- STEP 2: Ensure get_user_email() function exists
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

GRANT EXECUTE ON FUNCTION get_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email() TO anon;
GRANT EXECUTE ON FUNCTION get_user_email() TO service_role;

-- ============================================
-- STEP 3: Drop existing UPDATE policy
-- ============================================
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- ============================================
-- STEP 4: Create UPDATE policy that EXACTLY matches SELECT policy logic
-- ============================================
-- The SELECT policy allows viewing if:
--   - senior_id = auth.uid() OR
--   - (status = 'pending' AND email matches)
--
-- For UPDATE, we use the SAME logic for authorization
-- But WITH CHECK allows the status to change

CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE
  USING (
    -- EXACT same logic as SELECT policy
    senior_id = auth.uid()
    OR
    (
      status = 'pending' 
      AND LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(COALESCE(senior_email, '')))
    )
  )
  WITH CHECK (
    -- Authorization: same as USING (user is the senior)
    -- BUT: don't restrict status - allow it to change to approved/rejected
    senior_id = auth.uid()
    OR
    -- If email matches, allow any status (pending, approved, rejected)
    LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(COALESCE(senior_email, '')))
  );

-- ============================================
-- STEP 5: Verify
-- ============================================
SELECT 
  '=== VERIFICATION ===' as info;
  
SELECT 
  policyname,
  cmd,
  LEFT(qual::text, 100) as using_preview,
  LEFT(with_check::text, 100) as check_preview
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND cmd = 'UPDATE'
  AND policyname = 'Seniors can update relationships for them';

