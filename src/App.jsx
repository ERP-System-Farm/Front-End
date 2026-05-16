import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './app/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import i18n from './i18n/index.js';
import { Toaster } from 'sonner';

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  useEffect(() => {
    // Global bootstrap: apply stored language + direction on every mount
    const savedLang = localStorage.getItem('atlas_lang') || 'ar';
    const isRTL = savedLang === 'ar';

    document.documentElement.lang = savedLang;
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';

    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  return (
    <AuthProvider>
      <SnackbarProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </SnackbarProvider>
    </AuthProvider>
  );
}

export default App;
