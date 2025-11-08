-- FIX FOR NULL senior_id (Pending Requests)
-- Since senior_id is NULL for pending requests, we must rely on email matching
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Ensure get_user_email() function works
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
-- STEP 2: Drop existing policy
-- ============================================
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- ============================================
-- STEP 3: Create policy that handles NULL senior_id
-- ============================================
-- Key points:
-- 1. senior_id is NULL for pending requests, so we check email
-- 2. USING checks OLD row (status = 'pending')
-- 3. WITH CHECK allows status to change to 'rejected' or 'approved'
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE
  USING (
    -- Case 1: senior_id matches (for already approved relationships)
    (senior_id IS NOT NULL AND senior_id = auth.uid())
    OR
    -- Case 2: senior_id is NULL (pending) AND email matches
    (
      senior_id IS NULL
      AND status = 'pending'
      AND LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(COALESCE(senior_email, '')))
    )
  )
  WITH CHECK (
    -- Case 1: senior_id matches (already approved)
    (senior_id IS NOT NULL AND senior_id = auth.uid())
    OR
    -- Case 2: Email matches - allow status to be pending, approved, or rejected
    -- Note: senior_id can still be NULL here (before approval sets it)
    LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(COALESCE(senior_email, '')))
  );

-- ============================================
-- STEP 4: Verify
-- ============================================
SELECT 
  'Policy created!' as status,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND cmd = 'UPDATE'
  AND policyname = 'Seniors can update relationships for them';

-- ============================================
-- STEP 5: Test the function with your email
-- ============================================
-- This should return your email if you're logged in
SELECT 
  auth.uid() as current_user_id,
  get_user_email() as current_user_email;

