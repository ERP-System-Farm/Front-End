import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/index.js'
import App from './App.jsx'
import { AppThemeProvider } from './app/ThemeContext.jsx'

/**
 * main.jsx — Zero MUI ThemeProvider.
 * Dark mode is handled entirely by AppThemeProvider which toggles
 * `html.dark` class. MUI pages fall back to global CSS overrides
 * in index.css until they are migrated to Shadcn/UI.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  </StrictMode>,
)
