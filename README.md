# EnabledTalent - React Native App

A React Native app built with Expo for iOS and Android platforms.

## Features

- **Splash Screen**: Beautiful animated splash screen with the EnabledTalent branding
- **Onboarding**: Multi-step onboarding flow to introduce users to the app
- **Main Screen**: Welcome screen with feature highlights

## Getting Started

### Prerequisites

- Node.js (v20.3.1 or higher recommended)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Navigate to the project directory:
   ```bash
   cd EnabledTalent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

#### Development Server
```bash
npm start
```

#### Android
```bash
npm run android
```

#### iOS (macOS only)
```bash
npm run ios
```

#### Web
```bash
npm run web
```

## Project Structure

```
EnabledTalent/
├── screens/
│   ├── SplashScreen.tsx      # Animated splash screen
│   ├── OnboardingScreen.tsx  # Multi-step onboarding flow
│   └── MainScreen.tsx        # Main app screen
├── assets/                   # Images and icons
├── App.tsx                   # Main app component
└── package.json             # Dependencies and scripts
```

## Dependencies

- **expo**: ~54.0.9 - Expo SDK
- **react**: 19.1.0 - React library
- **react-native**: 0.81.4 - React Native framework
- **expo-splash-screen**: Splash screen management
- **@react-navigation/native**: Navigation library
- **react-native-screens**: Native screen components
- **react-native-safe-area-context**: Safe area handling

## App Flow

1. **Splash Screen**: Shows for 3 seconds with animated logo and branding
2. **Onboarding**: 3-step introduction to app features
3. **Main Screen**: Welcome screen with feature cards

## Android Studio Setup

To run the app in Android Studio:

1. Open Android Studio
2. Open the `android` folder from the project directory
3. Sync the project with Gradle files
4. Run the app on an emulator or connected device

## Notes

- All dependencies are compatible with Expo SDK 54
- The app uses TypeScript for better type safety
- Responsive design works on both iOS and Android
- Modern UI with smooth animations and transitions

