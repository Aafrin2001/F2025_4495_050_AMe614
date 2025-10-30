-- Create medications table for tracking user medications
CREATE TABLE IF NOT EXISTS medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('pill', 'liquid', 'injection', 'cream', 'inhaler')),
  frequency TEXT NOT NULL, -- e.g., "twice daily", "every 8 hours", "as needed"
  time JSONB NOT NULL, -- Array of times in HH:MM format, e.g., ["08:00", "20:00"]
  instruction TEXT,
  doctor TEXT,
  pharmacy TEXT,
  refill_date DATE,
  side_effects TEXT,
  is_active BOOLEAN DEFAULT true,
  is_daily BOOLEAN DEFAULT true, -- true for daily medications, false for as-needed (PRN)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medication_usage table for tracking as-needed medication usage
CREATE TABLE IF NOT EXISTS medication_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for medications table
CREATE POLICY "Users can view their own medications" ON medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications" ON medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications" ON medications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications" ON medications
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for medication_usage table
CREATE POLICY "Users can view their own medication usage" ON medication_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medication usage" ON medication_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication usage" ON medication_usage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication usage" ON medication_usage
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_type ON medications(type);
CREATE INDEX IF NOT EXISTS idx_medications_is_active ON medications(is_active);
CREATE INDEX IF NOT EXISTS idx_medications_is_daily ON medications(is_daily);
CREATE INDEX IF NOT EXISTS idx_medications_refill_date ON medications(refill_date);
CREATE INDEX IF NOT EXISTS idx_medications_created_at ON medications(created_at);

CREATE INDEX IF NOT EXISTS idx_medication_usage_user_id ON medication_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_usage_medication_id ON medication_usage(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_usage_taken_at ON medication_usage(taken_at);
CREATE INDEX IF NOT EXISTS idx_medication_usage_created_at ON medication_usage(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_medications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_medications_updated_at();

-- Add comments for documentation
COMMENT ON TABLE medications IS 'Stores user medication tracking data including prescriptions, schedules, and reminders';
COMMENT ON COLUMN medications.type IS 'Type of medication: pill, liquid, injection, cream, or inhaler';
COMMENT ON COLUMN medications.frequency IS 'How often to take the medication (e.g., twice daily, every 8 hours, as needed)';
COMMENT ON COLUMN medications.time IS 'JSON array of times when medication should be taken (e.g., ["08:00", "20:00"])';
COMMENT ON COLUMN medications.is_active IS 'Whether the medication is currently active/prescribed';
COMMENT ON COLUMN medications.is_daily IS 'Whether the medication is taken daily (true) or as-needed/PRN (false)';
COMMENT ON COLUMN medications.refill_date IS 'Date when medication needs to be refilled';
COMMENT ON TABLE medication_usage IS 'Tracks usage of as-needed medications with timestamps and notes';
COMMENT ON COLUMN medication_usage.taken_at IS 'When the as-needed medication was taken';
COMMENT ON COLUMN medication_usage.notes IS 'Optional notes about the medication usage';
