import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
    // Load from localStorage
    const storedScale = localStorage.getItem('fontSizeScale');
    if (storedScale && ['small', 'medium', 'large', 'extraLarge'].includes(storedScale)) {
      setFontSizeScale(storedScale as FontSizeScale);
    }
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('fontSizeScale', fontSizeScale);
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

