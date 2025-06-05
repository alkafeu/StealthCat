import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [accentColor, setAccentColor] = useState('blue');

  // Расширенная палитра акцентных цветов
  const accentColors = {
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9'
    },
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    },
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c'
    },
    yellow: {
      50: '#fefce8',
      100: '#fef3c7',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207'
    },
    pink: {
      50: '#fdf2f8',
      100: '#fce7f3',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d'
    },
    indigo: {
      50: '#eef2ff',
      100: '#e0e7ff',
      500: '#6366f1',
      600: '#5b21b6',
      700: '#4c1d95'
    },
    teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e'
    },
    orange: {
      50: '#fff7ed',
      100: '#ffedd5',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c'
    }
  };

  useEffect(() => {
    // Загружаем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedAccent = localStorage.getItem('accentColor') || 'blue';
    setTheme(savedTheme);
    setAccentColor(savedAccent);
    
    // Применяем тему к документу
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    
    // Применяем акцентный цвет через CSS переменные
    applyAccentColor(savedAccent);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const changeAccentColor = (color) => {
    setAccentColor(color);
    localStorage.setItem('accentColor', color);
    applyAccentColor(color);
  };

  const applyAccentColor = (color) => {
    const colorPalette = accentColors[color];
    if (colorPalette) {
      const root = document.documentElement;
      root.style.setProperty('--accent-50', colorPalette[50]);
      root.style.setProperty('--accent-100', colorPalette[100]);
      root.style.setProperty('--accent-500', colorPalette[500]);
      root.style.setProperty('--accent-600', colorPalette[600]);
      root.style.setProperty('--accent-700', colorPalette[700]);
    }
  };

  const getAccentColorClass = (shade = 500) => {
    return `${accentColor}-${shade}`;
  };

  const value = {
    theme,
    accentColor,
    accentColors,
    toggleTheme,
    changeAccentColor,
    getAccentColorClass,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};