# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization and enter project details:
   - Name: `enabledai-mobile` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Choose the closest region to your users

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 3. Configure Your App

### Option 1: Using Environment Variables (Recommended for Production)

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the placeholder values with your actual Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. Update `app.config.js` to load environment variables:
   ```javascript
   export default {
     expo: {
       // ... other config
       extra: {
         supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
         supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
       }
     }
   };
   ```

### Option 2: Direct Configuration (Current Setup)

The app is currently configured with fallback values in `src/lib/supabase.ts`. This works immediately but is less secure for production.

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

## 4. Set Up Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following:
   - **Site URL**: `exp://localhost:8081` (for development) or your production URL
   - **Redirect URLs**: Add your app's redirect URLs
   - **Email Templates**: Customize if needed

## 5. Enable Email Authentication

1. In **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email settings:
   - **Enable email confirmations**: Recommended for production
   - **Enable email change confirmations**: Recommended

## 6. Database Schema (Optional)

If you want to store additional user data, you can create a `profiles` table:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  user_type TEXT CHECK (user_type IN ('hire', 'offer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 7. Test Your Setup

1. Run your app: `npm start`
2. Try to register a new account
3. Check your email for the confirmation link
4. Try logging in with the verified account

## Security Notes

- Never commit your Supabase keys to version control
- Use environment variables in production
- Consider implementing additional security measures like rate limiting
- Regularly review your authentication policies

## Troubleshooting

- **"Invalid API key"**: Check that you've copied the correct anon key
- **"Invalid redirect URL"**: Make sure your redirect URLs are configured in Supabase
- **Email not sending**: Check your email provider settings in Supabase
- **User not found**: Ensure email confirmation is completed before login
