import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSizeScale = 'small' | 'medium' | 'large' | 'extraLarge';

interface FontSizeContextType {
  fontSizeScale: FontSizeScale;
  setFontSizeScale: (scale: FontSizeScale) => void;
  getFontSize: (baseSize: number) => number;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

interface FontSizeProviderProps {
  children: ReactNode;
}

export const FontSizeProvider: React.FC<FontSizeProviderProps> = ({ children }) => {
  const [fontSizeScale, setFontSizeScale] = useState<FontSizeScale>('medium');

  useEffect(() => {
    const loadFontSize = async () => {
      try {
        const storedScale = await AsyncStorage.getItem('fontSizeScale');
        if (storedScale) {
          setFontSizeScale(storedScale as FontSizeScale);
        }
      } catch (error) {
        console.error('Failed to load font size from AsyncStorage', error);
      }
    };
    loadFontSize();
  }, []);

  useEffect(() => {
    const saveFontSize = async () => {
      try {
        await AsyncStorage.setItem('fontSizeScale', fontSizeScale);
      } catch (error) {
        console.error('Failed to save font size to AsyncStorage', error);
      }
    };
    saveFontSize();
  }, [fontSizeScale]);

  const getFontSize = (baseSize: number): number => {
    switch (fontSizeScale) {
      case 'small':
        return baseSize * 0.85;
      case 'medium':
        return baseSize;
      case 'large':
        return baseSize * 1.25;
      case 'extraLarge':
        return baseSize * 1.5;
      default:
        return baseSize;
    }
  };

  return (
    <FontSizeContext.Provider value={{ fontSizeScale, setFontSizeScale, getFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};

