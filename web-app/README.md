# EAi Web App

A sophisticated React web version of the EAi Healthcare Companion App.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase Authentication

The web app uses the same Supabase integration as the mobile app. You need to set up environment variables:

1. Create a `.env` file in the `web-app` directory:
```bash
cd web-app
touch .env
```

2. Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Get these values from your Supabase project dashboard:
   - Go to **Settings** → **API**
   - Copy the **Project URL** and **anon public** key

**Note**: The `.env` file is already in `.gitignore` and won't be committed to version control.

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Features

- **Modern React Architecture**: Built with Vite for fast development
- **Supabase Authentication**: Integrated with the same Supabase backend as the mobile app
- **Session Management**: Automatically checks for existing sessions and maintains auth state
- **Caregiver Support**: Full support for caregiver-senior relationships with approval workflow
- **Sophisticated Design**: Matches the classy aesthetic of the marketing website
- **Responsive**: Works beautifully on all screen sizes
- **TypeScript**: Full type safety
- **Same Color Scheme**: Uses the purple gradient (#667eea to #764ba2) from the mobile app

## Current Screens

- **MainScreen**: The main dashboard with feature cards and navigation

## Next Steps

Additional screens can be added following the same design patterns and structure.

