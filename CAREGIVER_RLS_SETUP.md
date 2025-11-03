# Caregiver RLS Policies Setup Guide

## 🚨 IMPORTANT: Required for Caregiver Access

**The reason caregivers can't see senior data is because Supabase Row Level Security (RLS) policies are blocking access.**

By default, RLS policies only allow users to access their own data (`auth.uid() = user_id`). When a caregiver tries to query data using the senior's `user_id`, Supabase blocks it because the caregiver's authenticated ID doesn't match the senior's ID.

## 📋 Solution: Add Caregiver RLS Policies

You need to run the SQL policies in `caregiver_rls_policies.sql` in your Supabase SQL Editor to allow approved caregivers to access senior data.

### Steps:

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Policies**
   - Open the file `caregiver_rls_policies.sql`
   - Copy all the SQL statements
   - Paste into the SQL Editor
   - Click **Run**

3. **Verify Policies**
   - Go to **Authentication** → **Policies**
   - Check that new policies appear for:
     - `health_metrics` table
     - `medications` table
     - `activities` table
     - `medication_usage` table

### What These Policies Do:

- **Allow caregivers with approved relationships** to SELECT (view) senior data
- **Allow caregivers with approved relationships** to INSERT/UPDATE senior medications and medication usage
- **Still protect senior data** - only approved caregivers can access it
- **Keep existing user policies** - seniors can still access their own data

### Important Notes:

- These policies check for `status = 'approved'` in the `caregiver_relationships` table
- Caregivers must have an approved relationship before they can access data
- The policies use `EXISTS` queries to check the relationship status
- If you see "permission denied" errors, it means these policies haven't been run yet

### Testing:

After running the policies:
1. Log in as a caregiver
2. Make sure the caregiver has an approved relationship (senior approved the request)
3. Navigate to Medication, Health Monitoring, or Activities screens
4. You should now see the senior's data

### Troubleshooting:

If caregivers still can't see data after running policies:
1. Check that `caregiver_relationships` table exists
2. Verify the relationship status is `'approved'`
3. Check that `senior_id` is set in the relationship (not NULL)
4. Look at browser console for error messages
5. Check Supabase logs for RLS policy violations

