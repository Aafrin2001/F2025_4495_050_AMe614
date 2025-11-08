-- EXACT MATCH FIX: Use the EXACT same format as the working SELECT policy
-- The SELECT policy works, so let's match it exactly for UPDATE
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Ensure get_user_email() function exists (same as schema)
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
  RETURN user_email;
END;
$$;

-- ============================================
-- STEP 2: Drop existing UPDATE policy
-- ============================================
DROP POLICY IF EXISTS "Seniors can update relationships for them" ON caregiver_relationships;

-- ============================================
-- STEP 3: Create UPDATE policy using EXACT same format as SELECT policy
-- ============================================
-- SELECT policy uses: 
--   senior_id = auth.uid() OR (status = 'pending' AND LOWER(get_user_email()) = LOWER(senior_email))
--
-- We'll use the SAME for USING, and for WITH CHECK we allow status changes

CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE
  USING (
    -- EXACT same as SELECT policy
    senior_id = auth.uid()
    OR
    (status = 'pending' AND LOWER(get_user_email()) = LOWER(senior_email))
  )
  WITH CHECK (
    -- Authorization: same check (but don't restrict status)
    senior_id = auth.uid()
    OR
    -- Email matches (allows status to be pending, approved, or rejected)
    LOWER(get_user_email()) = LOWER(senior_email)
  );

-- ============================================
-- STEP 4: Verify it matches SELECT policy format
-- ============================================
SELECT 
  'SELECT Policy (works):' as policy_type,
  qual as clause
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND cmd = 'SELECT'
  AND policyname LIKE '%Seniors%view%'
UNION ALL
SELECT 
  'UPDATE Policy USING:' as policy_type,
  qual::text as clause
FROM pg_policies 
WHERE tablename = 'caregiver_relationships' 
  AND cmd = 'UPDATE'
  AND policyname LIKE '%Seniors%update%';

