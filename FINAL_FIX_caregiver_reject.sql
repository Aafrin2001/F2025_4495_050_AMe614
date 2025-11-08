-- FINAL FIX: Simplified RLS Policy for Caregiver Relationship Rejection
-- This is the most reliable solution - run this in Supabase SQL Editor

-- Step 1: Ensure the helper function exists and works
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email() TO anon;

-- Step 2: Drop the existing policy
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- Step 3: Create a new, simplified policy
-- The key insight: WITH CHECK should allow the NEW status values, not just 'pending'
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE 
  USING (
    -- Allow if senior_id matches (for already approved relationships)
    senior_id = auth.uid()
    OR
    -- Allow if email matches and status is currently pending
    (
      status = 'pending' 
      AND LOWER(TRIM(get_user_email())) = LOWER(TRIM(senior_email))
    )
  )
  WITH CHECK (
    -- Allow if senior_id matches (for already approved relationships)
    senior_id = auth.uid()
    OR
    -- Allow if email matches - status can be pending, approved, or rejected
    -- This is the key fix: we allow the status to change to 'rejected' or 'approved'
    LOWER(TRIM(get_user_email())) = LOWER(TRIM(senior_email))
  );

-- Step 4: Verify the policy
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND policyname = 'Seniors can update relationships for them';

-- If you see the policy listed above, it's been created successfully!
-- Try rejecting a caregiver request again - it should work now.

