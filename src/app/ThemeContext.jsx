import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext({ mode: 'light', toggleTheme: () => {} });

export const useThemeMode = () => useContext(ThemeContext);

const cacheRtl = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] });
const cacheLtr = createCache({ key: 'muiltr' });

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [direction, setDirection] = useState(() => {
    const lang = localStorage.getItem('atlas_lang') || 'ar';
    return lang === 'ar' ? 'rtl' : 'ltr';
  });

  // Observe HTML dir attribute changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dir = document.documentElement.dir;
      if (dir) setDirection(dir === 'rtl' ? 'rtl' : 'ltr');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    return () => observer.disconnect();
  }, []);

  // Sync Tailwind dark class
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('theme', mode);
  }, [mode]);

  const toggleTheme = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));

  // A minimal MUI theme so old pages (Farm, Warehouse) don't break RTL and adapt colors
  const muiTheme = useMemo(() => createTheme({
    direction,
    palette: {
      mode,
      primary: { main: '#16a34a' },
      background: {
        default: mode === 'dark' ? '#020617' : '#f8fafc',
        paper: mode === 'dark' ? '#0f172a' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Cairo", "Outfit", "Inter", sans-serif',
    },
    customTokens: {
      radius: { sm: 8, md: 10, lg: 12, xl: 16, xxl: 24 },
      shadows: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        colored: '0 8px 16px rgba(22, 163, 74, 0.25)',
      },
      colors: {
        border: { subtle: '#e2e8f0' },
      }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: mode === 'dark' ? '1px solid #1e293b' : 'none',
          }
        }
      }
    }
  }), [mode, direction]);

  const cache = direction === 'rtl' ? cacheRtl : cacheLtr;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <CacheProvider value={cache}>
        <ThemeProvider theme={muiTheme}>
          {children}
        </ThemeProvider>
      </CacheProvider>
    </ThemeContext.Provider>
  );
}
