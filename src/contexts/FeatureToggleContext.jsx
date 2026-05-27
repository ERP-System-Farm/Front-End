import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { useAuth } from '@/app/AuthContext';

const FeatureToggleContext = createContext(null);

export function FeatureToggleProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastLoadedUserIdRef = useRef(null);

  const fallbackConfig = {
    branding: { 
      farm_name: "مزرعة أطلس النموذجية", 
      primary_color: "#1E3A1E", 
      accent_color: "#D4AF37", 
      font: "Cairo", 
      currency: "جنيه مصري" 
    },
    features: { 
      accounting: true, 
      hr: true, 
      fleet: true, 
      warehouse: true 
    }
  };

  useEffect(() => {
    // If Auth is still loading, wait
    if (authLoading) return;

    const fetchConfig = async () => {
      if (!user) {
        // User not logged in, use fallback config and stop loading
        setConfig(fallbackConfig);
        setIsLoading(false);
        lastLoadedUserIdRef.current = null;
        return;
      }

      // Show full-screen spinner only on initial load or if user ID changes
      const userChanged = lastLoadedUserIdRef.current !== user.id;
      if (!config || userChanged) {
        setIsLoading(true);
      }

      try {
        const response = await api.get('/admin/config/');
        const data = response.data;
        
        const mappedConfig = {
          branding: {
            farm_name: data.farm_name,
            primary_color: data.primary_color,
            accent_color: data.accent_color,
            font: data.active_font,
            currency: data.currency
          },
          features: {
            accounting: data.feature_accounting,
            hr: data.feature_hr,
            fleet: data.feature_fleet,
            warehouse: data.feature_warehouse
          }
        };
        setConfig(mappedConfig);
        lastLoadedUserIdRef.current = user.id;
      } catch (error) {
        console.error("Failed to load system config, using fallbacks.", error);
        if (!config || userChanged) {
          setConfig(fallbackConfig);
          lastLoadedUserIdRef.current = user.id;
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [user, authLoading]);

  // Inject Custom Tailwind Themes on runtime configuration synchronization
  useEffect(() => {
    if (config) {
      const root = document.documentElement;
      root.style.setProperty('--primary-farm', config.branding.primary_color);
      root.style.setProperty('--accent-farm', config.branding.accent_color);
      root.style.fontFamily = `'${config.branding.font}', sans-serif`;
    }
  }, [config]);

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-slate-50 gap-4" dir="rtl">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-emerald-800" />
          <div className="absolute animate-pulse h-6 w-6 rounded-full bg-amber-500/80" />
        </div>
        <div className="text-xs sm:text-sm font-black text-emerald-950 animate-pulse tracking-wide">
          جاري تحميل إعدادات النظام وتخصيص المزرعة...
        </div>
      </div>
    );
  }

  return (
    <FeatureToggleContext.Provider value={{ config, setConfig }}>
      {children}
    </FeatureToggleContext.Provider>
  );
}

export const useFeatures = () => useContext(FeatureToggleContext);
