import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: localStorage.getItem('atlas_lang') || 'ar', // Default: Arabic
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

/**
 * Injects CMS content from the Django API into the i18n engine at runtime.
 * Call this once after fetching GET /api/auth/public/landing.
 * @param {{ en: object, ar: object }} cmsData
 */
export const injectCMSTranslations = (cmsData) => {
  if (cmsData?.en?.translation) {
    i18n.addResourceBundle('en', 'translation', { landing: cmsData.en.translation }, true, true);
  }
  if (cmsData?.ar?.translation) {
    i18n.addResourceBundle('ar', 'translation', { landing: cmsData.ar.translation }, true, true);
  }
};

export default i18n;
