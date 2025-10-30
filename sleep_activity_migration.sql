-- Migration to add sleep_quality column to activities table
-- This migration adds support for sleep activity tracking with quality ratings

-- Add sleep_quality column to activities table
DO $$ 
BEGIN
    -- Add sleep_quality column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'sleep_quality'
    ) THEN
        ALTER TABLE activities 
        ADD COLUMN sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent'));
        
        -- Add comment to the column
        COMMENT ON COLUMN activities.sleep_quality IS 'Sleep quality rating for sleep activities (poor, fair, good, excellent)';
    END IF;
END $$;

-- Update the activities table to support sleep activity type
DO $$ 
BEGIN
    -- Update the type constraint to include 'sleep' if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'activities_type_check'
        AND check_clause LIKE '%sleep%'
    ) THEN
        -- Drop existing constraint if it exists
        ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
        
        -- Add new constraint with sleep type
        ALTER TABLE activities 
        ADD CONSTRAINT activities_type_check 
        CHECK (type IN ('walk', 'exercise', 'stairs_climbing', 'sleep'));
    END IF;
END $$;

-- Create index on sleep_quality for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_sleep_quality 
ON activities(sleep_quality) 
WHERE sleep_quality IS NOT NULL;

-- Create index on type for better query performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_activities_type 
ON activities(type);

-- Update RLS policies to include sleep_quality column
-- Note: The existing policies should already cover the sleep_quality column since they use SELECT * and INSERT/UPDATE operations

-- Add comment to the table
COMMENT ON TABLE activities IS 'User activities including walking, exercise, stairs climbing, and sleep tracking with quality ratings';
