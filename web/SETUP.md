# Web Application Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd web
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `web` directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key (optional)
```

**To get your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

**If you're using the same Supabase project as the mobile app:**
- Copy the values from the parent directory's `.env` file
- Change `EXPO_PUBLIC_SUPABASE_URL` → `VITE_SUPABASE_URL`
- Change `EXPO_PUBLIC_SUPABASE_ANON_KEY` → `VITE_SUPABASE_ANON_KEY`

### 3. Run the Development Server
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Troubleshooting

### Blank Page / Configuration Error
- Make sure you've created the `.env` file in the `web` directory
- Verify the environment variable names start with `VITE_` (not `EXPO_PUBLIC_`)
- Restart the development server after creating/updating `.env`

### Build for Production
```bash
npm run build
```

The built files will be in the `dist` directory.

