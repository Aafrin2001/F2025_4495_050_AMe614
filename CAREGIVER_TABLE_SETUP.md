# Caregiver Relationships Table Setup

## Problem
If you see the error: **"Could not find the public.caregiver_relationships in the schema cache"**, it means the table hasn't been created in your Supabase database yet.

## Solution

Follow these steps to create the table:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Schema SQL

1. Open the file `caregiver_relationships_schema.sql` in this project
2. Copy the **entire contents** of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 3: Verify Table Creation

1. Click on **Table Editor** in the left sidebar
2. You should now see `caregiver_relationships` in the list of tables
3. Click on it to verify the following columns exist:
   - `id` (UUID, Primary Key)
   - `caregiver_id` (UUID, References auth.users)
   - `caregiver_email` (TEXT)
   - `senior_email` (TEXT)
   - `senior_id` (UUID, References auth.users, nullable)
   - `status` (TEXT: 'pending', 'approved', 'rejected')
   - `verification_code` (TEXT, nullable)
   - `requested_at` (Timestamp)
   - `approved_at` (Timestamp, nullable)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

### Step 4: Verify Policies

1. In Supabase dashboard, go to **Authentication** → **Policies**
2. Find the `caregiver_relationships` table
3. You should see these policies:
   - "Caregivers can view own relationships"
   - "Caregivers can create own requests"
   - "Seniors can view relationships for them"
   - "Seniors can update relationships for them"

### Step 5: Test the Feature

1. Restart your app
2. Log in as a caregiver (userType: 'offer')
3. Try to add a senior's email
4. The request should now work without errors

## Troubleshooting

### Error: "permission denied for table caregiver_relationships"
- Make sure Row Level Security (RLS) policies are created
- Check that you're authenticated as a user
- Verify the policies match your user type

### Error: "relation does not exist"
- Make sure you ran the entire SQL schema file
- Check for any SQL errors in the Supabase logs
- Try running the CREATE TABLE statement again

### Error: "duplicate key value violates unique constraint"
- This means a relationship request already exists
- Check the `caregiver_relationships` table to see existing requests
- You may need to delete old requests or wait for approval/rejection

### Still having issues?
- Check the Supabase logs: **Settings** → **Logs** → **Postgres Logs**
- Verify your Supabase project URL and API keys are correct
- Make sure you're using the correct database

## Important Notes

- The table uses Row Level Security (RLS) for data protection
- Caregivers can only create requests with their own ID
- Seniors can only view/update relationships where they are the senior
- The `verification_code` is used for email verification workflows
- The `status` field tracks the approval state: pending → approved/rejected

