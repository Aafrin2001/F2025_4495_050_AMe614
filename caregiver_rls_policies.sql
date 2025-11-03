-- RLS Policies for Caregiver Access to Senior Data
-- Run this SQL in your Supabase SQL Editor to allow approved caregivers to view senior data

-- ============================================
-- HEALTH_METRICS TABLE POLICIES
-- ============================================
-- Allow caregivers to view health metrics of seniors they're approved to monitor
CREATE POLICY "Caregivers can view senior health metrics" ON health_metrics
  FOR SELECT USING (
    -- User owns the data OR
    auth.uid() = user_id
    OR
    -- Caregiver has approved relationship with the senior
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE caregiver_id = auth.uid()
        AND senior_id = health_metrics.user_id
        AND status = 'approved'
    )
  );

-- ============================================
-- MEDICATIONS TABLE POLICIES
-- ============================================
-- Allow caregivers to view medications of seniors they're approved to monitor
CREATE POLICY "Caregivers can view senior medications" ON medications
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE caregiver_id = auth.uid()
        AND senior_id = medications.user_id
        AND status = 'approved'
    )
  );

-- Allow caregivers to update medications of seniors they're approved to monitor
CREATE POLICY "Caregivers can update senior medications" ON medications
  FOR UPDATE USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE caregiver_id = auth.uid()
        AND senior_id = medications.user_id
        AND status = 'approved'
    )
  );

-- Allow caregivers to insert medications for seniors they're approved to monitor
CREATE POLICY "Caregivers can insert senior medications" ON medications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE caregiver_id = auth.uid()
        AND senior_id = medications.user_id
        AND status = 'approved'
    )
  );

-- ============================================
-- ACTIVITIES TABLE POLICIES
-- ============================================
-- Allow caregivers to view activities of seniors they're approved to monitor
CREATE POLICY "Caregivers can view senior activities" ON activities
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE caregiver_id = auth.uid()
        AND senior_id = activities.user_id
        AND status = 'approved'
    )
  );

-- ============================================
-- MEDICATION_USAGE TABLE POLICIES
-- ============================================
-- Allow caregivers to view medication usage of seniors they're approved to monitor
CREATE POLICY "Caregivers can view senior medication usage" ON medication_usage
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE caregiver_id = auth.uid()
        AND senior_id = medication_usage.user_id
        AND status = 'approved'
    )
  );

-- Allow caregivers to insert medication usage for seniors they're approved to monitor
CREATE POLICY "Caregivers can insert senior medication usage" ON medication_usage
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE caregiver_id = auth.uid()
        AND senior_id = medication_usage.user_id
        AND status = 'approved'
    )
  );

-- ============================================
-- NOTES
-- ============================================
-- After running these policies:
-- 1. Existing policies that check "auth.uid() = user_id" will still allow users to access their own data
-- 2. New policies allow caregivers with approved relationships to also access senior data
-- 3. Caregivers can view and update senior data, but NOT delete (to prevent accidental data loss)
-- 4. If you want caregivers to also delete, add DELETE policies following the same pattern

