-- ULTRA SIMPLE FIX - This should definitely work
-- The key: Use the SAME authorization check for both USING and WITH CHECK
-- Run this in Supabase SQL Editor

-- Drop existing policy
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- Ensure function exists
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  RETURN COALESCE(user_email, '');
EXCEPTION WHEN OTHERS THEN RETURN '';
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_email() TO authenticated, anon, service_role;

-- Create the simplest possible policy
-- The trick: Use the SAME authorization logic for both USING and WITH CHECK
-- This way, if you're authorized to see it, you can update it to anything
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
  WITH CHECK (
    -- Use the SAME authorization check (not checking status in WITH CHECK)
    senior_id = auth.uid()
    OR
    LOWER(TRIM(COALESCE(get_user_email(), ''))) = LOWER(TRIM(COALESCE(senior_email, '')))
  );

