-- Health Metrics Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create health_metrics table
CREATE TABLE health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'blood_pressure', 
    'heart_rate', 
    'body_temperature', 
    'weight', 
    'blood_sugar', 
    'oxygen_level'
  )),
  systolic INTEGER, -- For blood pressure (mmHg)
  diastolic INTEGER, -- For blood pressure (mmHg)
  value DECIMAL(10,2) NOT NULL, -- The main metric value
  unit TEXT NOT NULL, -- Unit of measurement (mmHg, bpm, °F, °C, lbs, kg, mg/dL, %)
  notes TEXT, -- Optional notes
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for health_metrics
CREATE POLICY "Users can view own health metrics" ON health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health metrics" ON health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health metrics" ON health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health metrics" ON health_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX idx_health_metrics_type ON health_metrics(metric_type);
CREATE INDEX idx_health_metrics_recorded_at ON health_metrics(recorded_at);
CREATE INDEX idx_health_metrics_user_type ON health_metrics(user_id, metric_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_health_metrics_updated_at 
  BEFORE UPDATE ON health_metrics 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional - remove in production)
-- INSERT INTO health_metrics (user_id, metric_type, systolic, diastolic, value, unit, notes) VALUES
-- ('your-user-id-here', 'blood_pressure', 120, 80, 120, 'mmHg', 'Normal reading'),
-- ('your-user-id-here', 'heart_rate', NULL, NULL, 72, 'bpm', 'Resting heart rate'),
-- ('your-user-id-here', 'body_temperature', NULL, NULL, 98.6, '°F', 'Normal body temperature'),
-- ('your-user-id-here', 'weight', NULL, NULL, 165, 'lbs', 'Morning weight'),
-- ('your-user-id-here', 'blood_sugar', NULL, NULL, 95, 'mg/dL', 'Fasting glucose'),
-- ('your-user-id-here', 'oxygen_level', NULL, NULL, 98, '%', 'Room air');
