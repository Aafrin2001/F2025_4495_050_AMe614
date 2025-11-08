-- SIMPLE FIX: Most Reliable Solution
-- This uses WITH CHECK (true) which means "if you can see it, you can update it"
-- Run this in Supabase SQL Editor

-- Drop the existing policy
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- Create the simplest possible policy
-- USING: Check if user is authorized (can see the row)
-- WITH CHECK: true = allow any update if USING passes
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE
  USING (
    -- User is the senior (by ID)
    senior_id = auth.uid()
    OR
    -- User's email matches senior_email and status is pending
    (
      status = 'pending'
      AND EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND LOWER(TRIM(email)) = LOWER(TRIM(senior_email))
      )
    )
  )
  WITH CHECK (true); -- If you passed USING, you can update to any value

-- Verify
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND cmd = 'UPDATE';

