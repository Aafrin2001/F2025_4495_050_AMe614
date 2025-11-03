# Health Companion Web Application

Web version of the Health Companion mobile app, built with React, TypeScript, and Vite.

## Features

- Same functionality as mobile app
- Responsive design for desktop and mobile browsers
- Connected to the same Supabase database
- All features: Medications, Health Monitoring, Activities, Dashboard, Caregiver functionality

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd web
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_OPENAI_API_KEY=your_openai_key (optional, for AI chat)
     ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:3000`

4. **Build for Production**
   ```bash
   npm run build
   ```

## Database Setup

Make sure you have run all the SQL migrations from the root directory:
- `database_schema.sql`
- `medications_schema.sql`
- `activities_schema.sql`
- `caregiver_relationships_schema.sql`
- `caregiver_rls_policies.sql`

## Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Page components (screens)
- `src/lib/` - Services and utilities (shared with mobile app logic)
- `src/contexts/` - React contexts for state management
- `src/types/` - TypeScript type definitions
- `src/routes/` - React Router configuration

## Notes

- Uses the same Supabase database as the mobile app
- Shared service logic can be reused from mobile app
- Responsive design adapts to different screen sizes
- Same authentication flow as mobile app

