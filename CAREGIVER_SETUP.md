# Caregiver Relationships Setup

This guide will help you set up the caregiver relationships table in Supabase.

## Step 1: Create the Table

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the entire contents of `caregiver_relationships_schema.sql`
5. Click **Run** (or press Ctrl+Enter)

The SQL will create:
- The `caregiver_relationships` table
- Necessary indexes for performance
- Row Level Security (RLS) policies
- A trigger for notifications

## Step 2: Verify Table Creation

1. Go to **Table Editor** (left sidebar)
2. You should see `caregiver_relationships` in the list
3. Click on it to verify the columns exist:
   - id
   - caregiver_id
   - caregiver_email
   - senior_email
   - senior_id
   - status
   - verification_code
   - requested_at
   - approved_at
   - created_at
   - updated_at

## Step 3: Test the Setup

1. Sign up as a caregiver (userType: 'offer')
2. Sign up as a senior (userType: 'hire')
3. As caregiver, try to add senior's email
4. Check the `caregiver_relationships` table to see the pending request

## Troubleshooting

If you get permission errors:
- Make sure RLS policies are created correctly
- Check that the user is authenticated
- Verify the table was created successfully

If the table still doesn't exist:
- Re-run the SQL schema
- Check for any SQL errors in the Supabase logs

