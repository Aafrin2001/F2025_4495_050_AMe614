-- Enable Realtime for caregiver_relationships table
-- This allows real-time notifications when relationships are updated
-- Run this in your Supabase SQL Editor

-- Enable Realtime for the caregiver_relationships table
ALTER PUBLICATION supabase_realtime ADD TABLE caregiver_relationships;

-- Verify Realtime is enabled
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'caregiver_relationships';

-- If the above query returns a row, Realtime is enabled successfully!

