# Presentation Script to File Mapping

This document maps each section of your presentation script to the corresponding files and line numbers in the codebase.

---

## 1. INTRODUCTION (15–20 seconds)
**Script Line 1-4**: General introduction
- **No specific files** - General project overview

---

## 2. PROJECT OVERVIEW (20–30 seconds)
**Script Line 5-8**: 
- Mentions: React Native frontend, Supabase backend, Firebase migration
- **Files**: 
  - `src/lib/supabase.ts` (lines 1-95) - Supabase client configuration
  - `App.tsx` - Main app entry point with routing

---

## 3. BACKEND DEVELOPMENT (40–60 seconds)

### Script Line 9-11: "I worked on defining and refining Supabase schemas"
- **File**: `caregiver_relationships_schema.sql`
  - **Lines 1-15**: Table schema definition
  - **Lines 17-21**: Index creation
  - **Lines 23-32**: RLS policies for caregivers
  - **Lines 34-49**: `get_user_email()` helper function (SECURITY DEFINER)
  - **Lines 51-77**: RLS policies for seniors (view and update)

### Script Line 12-13: "I also implemented a security function called reject_caregiver_request()"
- **File**: `COMPLETE_DIAGNOSTIC_AND_WORKAROUND.sql`
  - **Lines 80-125**: `reject_caregiver_request()` function definition
  - **Lines 83**: `SECURITY DEFINER` keyword
  - **Lines 127-129**: Grant execute permissions

- **File**: `src/lib/caregiverService.ts`
  - **Lines 296-340**: `rejectRequest()` method that calls the RPC function
  - **Lines 304-306**: RPC call to `reject_caregiver_request`
  - **Lines 318-325**: Fallback direct update if function doesn't exist

---

## 4. FRONTEND DEVELOPMENT (1 minute)

### Script Line 14-15: "AI Conversation Screen was improved"
- **File**: `src/screens/AIChatScreen.tsx`
  - **Lines 136-186**: `handleSendMessage()` function with OpenAI API integration
  - **Lines 151-156**: Conversation history and API call

- **File**: `src/lib/chatGPTService.ts`
  - **Lines 17-72**: `sendChatMessage()` function
  - **Lines 44-57**: Fetch request to OpenAI API
  - **Lines 28-42**: Message construction with system prompt

### Script Line 16-17: "I also merged the Supabase branch into the main branch"
- **No specific file** - Git operation

### Script Line 18-19: "The Caregiver Dashboard Screen was completely redesigned"
- **File**: `src/screens/CaregiverDashboardScreen.tsx`
  - **Lines 648-694**: Professional header with welcome message, logout, settings buttons
  - **Lines 653-667**: Notification bell with badge
  - **Lines 700-797**: Clients section with tiles
  - **Lines 417-498**: `renderClientTile()` function - client card design
  - **Lines 799-895**: Notifications modal
  - **Lines 920-1428**: Styles for professional UI

---

## 5. FUNCTIONALITY AND LOGIC (1 minute)

### Script Line 20-21: "I resolved targetUserId mapping errors"
- **File**: `src/screens/CaregiverDashboardScreen.tsx`
  - **Lines 70**: `actualSeniorUserId` state
  - **Lines 126-128**: Setting `actualSeniorUserId` from approved clients
  - **Lines 191-199**: Updating `actualSeniorUserId` after rejection
  - **Lines 232-237**: Updating `actualSeniorUserId` after approval

### Script Line 22-23: "In the Blood Pressure Module, I fixed a bug where systolic values weren't being saved"
- **File**: `src/lib/healthMetrics.ts`
  - **Lines 87-112**: `saveMetric()` function
  - **Lines 95-99**: Blood pressure fix - using systolic as value field
  ```typescript
  const metricValue = input.metric_type === 'blood_pressure' 
    ? (input.systolic || 0) 
    : input.value;
  ```

### Script Line 24-25: "I added logic to stop caregivers from resending connection requests after rejection"
- **File**: `src/lib/caregiverService.ts`
  - **Lines 34-40**: Check for existing relationship
  - **Lines 51-65**: Prevent duplicate pending/approved requests
  - **Lines 67-170**: Handle rejected relationship resubmission
  - **Lines 68-82**: Update rejected relationship to pending
  - **Lines 84-99**: Fallback: Delete and recreate if update fails

- **File**: `caregiver_relationships_schema.sql`
  - **Lines 14**: UNIQUE constraint on (caregiver_id, senior_email)

---

## 6. ADDITIONAL MODULES AND FEATURES (1 minute)

### Script Line 26-28: "I developed and refined the Activity Screen"
- **File**: `src/screens/ActivityScreen.tsx`
  - **Lines 45-786**: Complete Activity Screen implementation
  - **Lines 191-214**: `loadActivities()` - loading activities from Supabase
  - **Lines 266-303**: `stopActivity()` - saving activity with timer, calories, distance
  - **Lines 305-342**: `saveSleepActivity()` - sleep activity with quality tracking

- **File**: `src/lib/activityService.ts`
  - **Lines 24-27**: `calculateCalories()` - calorie calculation
  - **Lines 32-35**: `calculateDistance()` - distance calculation
  - **Lines 37-295**: Activity CRUD operations with Supabase

- **File**: `src/contexts/ActivityTrackingContext.tsx`
  - **Lines 48-106**: Timer effect for real-time activity tracking
  - **Lines 61-80**: Activity-specific calculations (walk, exercise, stairs, sleep)

### Script Line 29-30: "In the Medication Screen, I added detailed fields"
- **File**: `src/screens/MedicationScreen.tsx`
  - **Lines 37-50**: Form data state with all medication fields
  - **Lines 40**: `dosage` field
  - **Lines 41**: `frequency` field
  - **Lines 46**: `refill_date` field
  - **Lines 30-1236**: Complete medication screen with responsive layout

- **File**: `medications_schema.sql`
  - **Lines 2-19**: Medications table schema
  - **Lines 7**: `type` field (pill, liquid, injection, cream, inhaler)
  - **Lines 8**: `frequency` field
  - **Lines 13**: `refill_date` field

### Script Line 31-32: "I also added the Sleep Activity feature"
- **File**: `src/screens/SleepCycleScreen.tsx`
  - **Lines 35-350**: Sleep cycle screen
  - **Lines 72-88**: `calculateSleepHours()` function
  - **Lines 90-144**: `handleLogSleep()` - saving sleep data
  - **Lines 108-114**: Sleep data structure with quality

- **File**: `src/screens/ActivityScreen.tsx`
  - **Lines 305-342**: `saveSleepActivity()` - saving sleep to Supabase
  - **Lines 318**: `sleep_quality` parameter

- **File**: `src/contexts/ActivityTrackingContext.tsx`
  - **Lines 75-79**: Sleep activity handling in timer

---

## 7. TESTING AND VALIDATION (30–40 seconds)
**Script Line 33-35**: General testing
- **No specific test files** - Testing was done manually through the app

---

## 8. CONCLUSION & DEMO WRAP-UP (20 seconds)
**Script Line 36-38**: General conclusion
- **No specific files** - Summary of project

---

## Additional Key Files Referenced:

### Real-time Notifications:
- **File**: `src/screens/CaregiverDashboardScreen.tsx`
  - **Lines 130-272**: Realtime subscription setup
  - **Lines 147-258**: Realtime event handler for status changes
  - **Lines 261-272**: Subscription status monitoring

- **File**: `src/components/RejectionNotification.tsx`
  - **Lines 21-150**: Notification component with animations
  - **Lines 31-91**: useEffect for showing/hiding notifications

### Notification System:
- **File**: `src/screens/CaregiverDashboardScreen.tsx`
  - **Lines 47-53**: `NotificationItem` interface
  - **Lines 77**: `notifications` state array
  - **Lines 196-203**: Adding rejection notification to list
  - **Lines 268-274**: Adding approval notification to list
  - **Lines 799-895**: Notifications modal UI

### Supabase Configuration:
- **File**: `src/lib/supabase.ts`
  - **Lines 1-95**: Supabase client setup and auth helpers

---

## Summary by File:

1. **caregiver_relationships_schema.sql** (96 lines)
   - Script Section 3: Backend schema and RLS policies

2. **src/lib/caregiverService.ts** (592 lines)
   - Script Section 3: `reject_caregiver_request()` RPC call (lines 296-340)
   - Script Section 5: Request resubmission logic (lines 23-170)

3. **src/lib/healthMetrics.ts** (212 lines)
   - Script Section 5: Blood pressure fix (lines 95-99)

4. **src/screens/CaregiverDashboardScreen.tsx** (1440 lines)
   - Script Section 4: Complete redesign (lines 648-1428)
   - Script Section 5: targetUserId mapping (lines 70, 126-128, 191-199, 232-237)
   - Script Section 6: Real-time notifications (lines 130-272)
   - Script Section 6: Notifications modal (lines 799-895)

5. **src/lib/chatGPTService.ts** (92 lines)
   - Script Section 4: OpenAI API integration (lines 17-72)

6. **src/screens/AIChatScreen.tsx** (371 lines)
   - Script Section 4: AI Conversation Screen (lines 136-186)

7. **src/screens/ActivityScreen.tsx** (786 lines)
   - Script Section 6: Activity tracking (lines 45-786)

8. **src/lib/activityService.ts** (296 lines)
   - Script Section 6: Activity calculations and database operations

9. **src/screens/MedicationScreen.tsx** (1236 lines)
   - Script Section 6: Medication management (lines 30-1236)

10. **src/screens/SleepCycleScreen.tsx** (350 lines)
    - Script Section 6: Sleep activity (lines 35-350)

11. **src/components/RejectionNotification.tsx** (192 lines)
    - Script Section 6: Real-time notification component


