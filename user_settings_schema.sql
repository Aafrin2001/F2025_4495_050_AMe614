-- Create user_settings table for storing user preferences and settings
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings table
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_settings_timestamp
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Note: The settings JSONB column will store settings in the following structure:
-- {
--   "highContrast": boolean,
--   "fontSize": "small" | "medium" | "large" | "extraLarge",
--   "medicationReminders": boolean,
--   "healthCheckReminders": boolean,
--   "activityReminders": boolean,
--   "emergencyAlerts": boolean,
--   "quietHours": boolean,
--   "quietStartTime": string (HH:MM format),
--   "quietEndTime": string (HH:MM format),
--   "shareWithFamily": boolean,
--   "shareWithDoctor": boolean,
--   "locationTracking": boolean,
--   "dataBackup": boolean,
--   "darkMode": boolean,
--   "autoLock": boolean,
--   "autoLockTime": number (minutes),
--   "language": string,
--   "timeFormat": "12h" | "24h",
--   "theme": "light" | "dark" | "auto"
-- }

