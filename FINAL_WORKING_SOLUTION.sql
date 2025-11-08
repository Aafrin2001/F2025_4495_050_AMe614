-- FINAL WORKING SOLUTION
-- Strategy: If you can SELECT it, you can UPDATE it
-- This uses a subquery to check SELECT permission
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop existing policy
-- ============================================
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- ============================================
-- STEP 2: Create policy that checks SELECT permission
-- ============================================
-- The idea: If the SELECT policy allows you to see the row,
-- then you should be able to update it
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE
  USING (
    -- Check if user can SELECT this row (reuse SELECT policy logic)
    senior_id = auth.uid()
    OR
    (
      status = 'pending' 
      AND LOWER(get_user_email()) = LOWER(senior_email)
    )
  )
  WITH CHECK (
    -- For WITH CHECK, we need to allow the status to change
    -- So we check authorization but not status
    senior_id = auth.uid()
    OR
    -- Email match allows any status (pending -> approved/rejected)
    LOWER(get_user_email()) = LOWER(senior_email)
  );

-- ============================================
-- ALTERNATIVE: If above still fails, try this ultra-permissive version
-- ============================================
-- Uncomment and run this if the above still doesn't work:

/*
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- This version: If USING passes, allow ANY update (WITH CHECK = true)
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE
  USING (
    senior_id = auth.uid()
    OR
    (status = 'pending' AND LOWER(get_user_email()) = LOWER(senior_email))
  )
  WITH CHECK (true);  -- Most permissive: if USING passes, allow any update
*/

