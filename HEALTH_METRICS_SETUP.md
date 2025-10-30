# Health Metrics Tracking Setup Guide

## 🏥 Overview

The Health Monitoring feature now tracks 6 key health metrics for each user:
- **Blood Pressure** (systolic/diastolic in mmHg)
- **Heart Rate** (beats per minute)
- **Body Temperature** (°F or °C)
- **Weight** (lbs or kg)
- **Blood Sugar** (mg/dL)
- **Oxygen Level** (percentage)

## 🗄️ Database Setup

### Step 1: Create the Health Metrics Table

Run the following SQL in your Supabase SQL Editor:

```sql
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
  unit TEXT NOT NULL, -- Unit of measurement
  notes TEXT, -- Optional notes
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own health metrics" ON health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health metrics" ON health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health metrics" ON health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health metrics" ON health_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX idx_health_metrics_type ON health_metrics(metric_type);
CREATE INDEX idx_health_metrics_recorded_at ON health_metrics(recorded_at);
CREATE INDEX idx_health_metrics_user_type ON health_metrics(user_id, metric_type);
```

### Step 2: Set Up Automatic Timestamps

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_health_metrics_updated_at 
  BEFORE UPDATE ON health_metrics 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

## 🔧 Features Implemented

### ✅ **Comprehensive Health Metrics Tracking**
- **Blood Pressure**: Separate systolic/diastolic input with validation
- **Heart Rate**: BPM tracking with normal range validation
- **Body Temperature**: Support for both °F and °C
- **Weight**: Support for both lbs and kg
- **Blood Sugar**: Glucose level tracking
- **Oxygen Level**: SpO2 percentage tracking

### ✅ **Data Validation**
- **Blood Pressure**: Systolic 70-250 mmHg, Diastolic 40-150 mmHg
- **Heart Rate**: 30-220 bpm range
- **Temperature**: 90-110°F or 32-43°C range
- **Weight**: 50-1000 lbs or 20-450 kg range
- **Blood Sugar**: 20-600 mg/dL range
- **Oxygen Level**: 70-100% range

### ✅ **Supabase Integration**
- **Real-time data storage** in `health_metrics` table
- **User-specific data** with Row Level Security
- **Automatic timestamps** for tracking
- **Data persistence** across app sessions

### ✅ **User Interface**
- **Interactive vital cards** showing latest readings
- **Tap-to-record** functionality for quick data entry
- **Special blood pressure input** with separate systolic/diastolic fields
- **Loading states** and error handling
- **Notes support** for additional context

## 📱 How to Use

### Recording Health Metrics

1. **Tap any vital sign card** to record a new reading
2. **Enter the value** (for blood pressure, enter both systolic and diastolic)
3. **Add optional notes** for context
4. **Tap Save** to store in Supabase

### Adding Custom Readings

1. **Tap "Add Reading"** in Quick Actions
2. **Select metric type** from dropdown
3. **Enter value** and notes
4. **Save** to database

## 🔒 Security Features

- **Row Level Security**: Users can only access their own data
- **Input validation**: Prevents invalid health readings
- **Type safety**: TypeScript interfaces ensure data integrity
- **Error handling**: Graceful error messages for users

## 📊 Data Structure

### HealthMetric Interface
```typescript
interface HealthMetric {
  id: string;
  user_id: string;
  metric_type: 'blood_pressure' | 'heart_rate' | 'body_temperature' | 'weight' | 'blood_sugar' | 'oxygen_level';
  systolic?: number; // For blood pressure
  diastolic?: number; // For blood pressure
  value: number;
  unit: string;
  notes?: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}
```

## 🚀 Next Steps

### Potential Enhancements
1. **Trend Analysis**: Chart historical data over time
2. **Health Alerts**: Notifications for abnormal readings
3. **Export Data**: Generate health reports
4. **Family Sharing**: Allow family members to view data
5. **Integration**: Connect with health devices/wearables

### API Endpoints Available
- `saveMetric()`: Save new health reading
- `getLatestMetrics()`: Get most recent readings
- `getMetricHistory()`: Get historical data for trends
- `deleteMetric()`: Remove incorrect readings

## 🧪 Testing

To test the health metrics functionality:

1. **Create a user account** and log in
2. **Navigate to Health Monitoring** from the main screen
3. **Tap any vital sign** to record a reading
4. **Enter valid data** and save
5. **Verify data appears** in Supabase dashboard
6. **Test validation** by entering invalid ranges

The system is now ready for comprehensive health metrics tracking! 🎉
