-- Create caregiver_relationships table
CREATE TABLE IF NOT EXISTS caregiver_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_email TEXT NOT NULL,
  senior_email TEXT NOT NULL,
  senior_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  verification_code TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(caregiver_id, senior_email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_caregiver_relationships_caregiver_id ON caregiver_relationships(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_relationships_senior_email ON caregiver_relationships(senior_email);
CREATE INDEX IF NOT EXISTS idx_caregiver_relationships_senior_id ON caregiver_relationships(senior_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_relationships_status ON caregiver_relationships(status);

-- Enable Row Level Security
ALTER TABLE caregiver_relationships ENABLE ROW LEVEL SECURITY;

-- Policy: Caregivers can view their own relationships
CREATE POLICY "Caregivers can view own relationships" ON caregiver_relationships
  FOR SELECT USING (auth.uid() = caregiver_id);

-- Policy: Caregivers can create their own relationship requests
CREATE POLICY "Caregivers can create own requests" ON caregiver_relationships
  FOR INSERT WITH CHECK (auth.uid() = caregiver_id);

-- Helper function to get user email (requires SECURITY DEFINER to access auth.users)
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

-- Policy: Seniors can view relationships where they are the senior
-- Uses helper function to check email match for pending requests
CREATE POLICY "Seniors can view relationships for them" ON caregiver_relationships
  FOR SELECT USING (
    -- Match if senior_id is set and matches current user (after approval)
    senior_id = auth.uid()
    OR
    -- Or if email matches and request is pending (using helper function)
    (status = 'pending' AND LOWER(get_user_email()) = LOWER(senior_email))
  );

-- Policy: Seniors can approve/reject relationships for them
CREATE POLICY "Seniors can update relationships for them" ON caregiver_relationships
  FOR UPDATE USING (
    -- Allow update if senior_id matches (already approved)
    senior_id = auth.uid()
    OR
    -- Or if email matches and status is pending
    (status = 'pending' AND LOWER(get_user_email()) = LOWER(senior_email))
  )
  WITH CHECK (
    -- Same condition
    senior_id = auth.uid()
    OR
    (status = 'pending' AND LOWER(get_user_email()) = LOWER(senior_email))
  );

-- Create a function to notify seniors of new caregiver requests
-- (This would typically be handled by a webhook or edge function)
CREATE OR REPLACE FUNCTION notify_caregiver_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger notification (implement via Supabase Edge Function or webhook)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to notify on new requests
CREATE TRIGGER caregiver_request_notification
  AFTER INSERT ON caregiver_relationships
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_caregiver_request();

