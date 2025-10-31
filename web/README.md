# EnabledAI Web Version

This is the web version of the EnabledAI Healthcare Companion application, fully converted from React Native to web React.

## Setup

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `web` directory:
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

The app will be available at `http://localhost:3000` (or the port Vite assigns).

## Structure

- `src/components/` - React components converted from React Native screens
  - **Fully Converted**: SplashScreen, OnboardingScreen, AuthScreen, MainScreen, HealthMonitoringScreen, MedicationScreen, SettingsScreen
  - **Placeholder Screens**: All other screens (Activities, Chat, Games, etc.) - ready for conversion
- `src/contexts/` - Context providers (FontSize, Language) using localStorage
- `src/lib/` - Services (Supabase, health metrics, medications, activity) - fully converted
- `src/types/` - TypeScript type definitions - identical to mobile
- `src/styles/` - Global styles and CSS
- `src/utils/icons.tsx` - Icon mapping utility for react-icons

## Features Implemented

✅ **Authentication** - Login and signup with Supabase
✅ **Main Screen** - Home dashboard with navigation
✅ **Health Monitoring** - Track vital signs (blood pressure, heart rate, temperature, weight, blood sugar, oxygen)
✅ **Medication Management** - Add, edit, delete medications with time scheduling
✅ **Settings** - Font size and language selection
✅ **Multi-language Support** - English, Spanish, French, German, Chinese
✅ **Font Size Customization** - Small, Medium, Large, Extra Large
✅ **Responsive Design** - Works on desktop and tablet

## Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Supabase** - Backend and authentication
- **React Router** - Navigation
- **React Icons** - Icon library (replaces Ionicons)

## Conversion Notes

- React Native components converted to standard HTML elements
- `LinearGradient` replaced with CSS gradients
- `StyleSheet` replaced with CSS files
- `TouchableOpacity` → `button` or `div` with `onClick`
- `ScrollView` → `div` with `overflow-y: auto`
- `Modal` → `div` with fixed positioning
- `Ionicons` → `react-icons/io` (mapped in `utils/icons.tsx`)
- `AsyncStorage` → `localStorage`
- Navigation uses React Router instead of manual state management

## Next Steps

The placeholder screens (Activities, Chat, Games, etc.) can be converted following the same pattern. See `CONVERSION_GUIDE.md` for detailed conversion instructions.

