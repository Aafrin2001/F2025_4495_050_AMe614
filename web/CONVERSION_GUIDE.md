# Web Version Conversion Guide

This document outlines the conversion pattern used to convert React Native screens to web React components.

## Key Conversions

### Components
- `View` → `div`
- `Text` → `div`, `span`, or `p`
- `TouchableOpacity` → `button` or `div` with `onClick`
- `ScrollView` → `div` with `overflow-y: auto` or `overflow: auto`
- `TextInput` → `input` or `textarea`
- `Modal` → `div` with fixed positioning and z-index
- `LinearGradient` → CSS `background: linear-gradient(...)`
- `StatusBar` → Removed (web doesn't need this)
- `ActivityIndicator` → CSS spinner or loading animation
- `Ionicons` → `react-icons/io` (Icons mapped in `utils/icons.tsx`)

### Styling
- `StyleSheet.create()` → CSS modules or CSS files
- React Native style props → CSS classes
- `flex: 1` → `flex: 1` in CSS
- `padding`, `margin` → Same in CSS
- Colors and fonts → Same

### Navigation
- Manual screen state → React Router
- `navigate()` from React Router replaces manual state changes

### Platform-specific
- `Platform.OS` checks → Browser detection if needed
- `Dimensions.get('window')` → `window.innerWidth/innerHeight` or CSS viewport units

### State Management
- Same React hooks (`useState`, `useEffect`, etc.)
- Same context providers
- localStorage instead of AsyncStorage

## Pattern Example

### React Native
```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MyScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
      <TouchableOpacity onPress={handlePress}>
        <Text>Click me</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, color: '#000' },
});
```

### Web React
```tsx
import './MyScreen.css';

const MyScreen = () => {
  return (
    <div className="container">
      <div className="title">Hello</div>
      <button onClick={handlePress}>Click me</button>
    </div>
  );
};
```

```css
.container {
  flex: 1;
  padding: 20px;
}

.title {
  font-size: 24px;
  color: #000;
}
```

