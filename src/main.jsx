import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { prefixer } from 'stylis'
import rtlPlugin from 'stylis-plugin-rtl'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme/theme'
import './index.css'
import './i18n/index.js' 
import App from './App.jsx'

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
})

// Create LTR cache (default)
const cacheLtr = createCache({
  key: 'muiltr',
})

const Root = () => {
  // We determine direction from localStorage initially
  const savedLang = localStorage.getItem('atlas_lang') || 'ar'
  const isRTL = savedLang === 'ar'

  return (
    <CacheProvider value={isRTL ? cacheRtl : cacheLtr}>
      <ThemeProvider theme={{ ...theme, direction: isRTL ? 'rtl' : 'ltr' }}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </CacheProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
