-- FIXED: No Direct auth.users Access
-- The error "permission denied for table users" means we can't query auth.users directly
-- This fix uses the helper function instead
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Ensure the helper function exists and has proper permissions
-- ============================================
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to access auth.users
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email() TO anon;

-- ============================================
-- STEP 2: Drop the existing policy
-- ============================================
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- ============================================
-- STEP 3: Create the fixed policy using the helper function
-- ============================================
-- This policy uses get_user_email() instead of querying auth.users directly
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE
  USING (
    -- Condition 1: User is the senior (by senior_id)
    senior_id = auth.uid()
    OR
    -- Condition 2: User's email matches and request is pending
    -- Uses get_user_email() function which has SECURITY DEFINER
    (
      status = 'pending'
      AND LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(COALESCE(senior_email, '')))
    )
  )
  WITH CHECK (true); -- Allow any update if USING condition is met

-- ============================================
-- STEP 4: Verify the policy
-- ============================================
SELECT 
  'Policy created!' as status,
  policyname,
  cmd,
  CASE 
    WHEN with_check = 'true' THEN '✓ WITH CHECK is permissive'
    ELSE '✗ WITH CHECK: ' || with_check
  END as check_status
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND cmd = 'UPDATE'
  AND policyname = 'Seniors can update relationships for them';

-- ============================================
-- STEP 5: Test the function
-- ============================================
-- This should return your email (if you're logged in)
SELECT 
  auth.uid() as user_id,
  get_user_email() as user_email;

