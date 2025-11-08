-- Alternative Fix: Simpler RLS Policy for Caregiver Relationship Rejection
-- This version uses a different approach that's more reliable
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing policy
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- Create a simpler policy that allows seniors to update their own relationships
-- This policy checks if the user can SELECT the row (meaning they're the senior),
-- and if so, allows them to UPDATE it to approved or rejected status
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE 
  USING (
    -- Allow if senior_id matches (already approved relationships)
    senior_id = auth.uid()
    OR
    -- Or if the user can view this row (meaning they're the senior for pending requests)
    -- This reuses the SELECT policy logic
    (
      status = 'pending' 
      AND (
        senior_id = auth.uid()
        OR
        LOWER(COALESCE(get_user_email(), '')) = LOWER(senior_email)
      )
    )
  )
  WITH CHECK (
    -- Allow if senior_id matches
    senior_id = auth.uid()
    OR
    -- Or if email matches and status is one of the valid transitions
    (
      LOWER(COALESCE(get_user_email(), '')) = LOWER(senior_email) 
      AND status IN ('pending', 'approved', 'rejected')
    )
  );

