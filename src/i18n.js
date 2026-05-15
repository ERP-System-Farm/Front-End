import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Fallback resources in case API hasn't loaded yet
const resources = {
  en: {
    translation: {
      // Landing CMS keys (overridden dynamically from backend)
      hero_title: "Precision Agriculture, Redefined.",
      hero_text: "Seamlessly manage Palm and Olive field structures.",
      palm_text: "Track Every Mother Tree & Offshoot.",
      olive_text: "Synchronized Harvest Operations.",
      // Dashboard navigation
      nav_dashboard: "Dashboard",
      nav_farm: "Farm Structure",
      nav_palm: "Palm Fields",
      nav_olive: "Olive Fields",
      nav_warehouse: "Ledger Matrix",
      nav_equipment: "Fleet Networks",
      nav_reports: "Operation Feeds",
      nav_production: "Yield Metrics",
      nav_accounting: "Financial Backbone",
      nav_admin: "Admin Controls",
      nav_logout: "Logout",
      // Misc UI
      welcome_back: "Welcome back",
      lang_toggle: "العربية",
    }
  },
  ar: {
    translation: {
      // Landing CMS keys (overridden dynamically from backend)
      hero_title: "الزراعة الدقيقة، أعيد تعريفها.",
      hero_text: "إدارة مجالات النخيل والزيتون بسلاسة تامة.",
      palm_text: "تتبع كل شجرة أم و فسيلة.",
      olive_text: "عمليات حصاد متزامنة.",
      // Dashboard navigation
      nav_dashboard: "لوحة التحكم",
      nav_farm: "هيكل المزرعة",
      nav_palm: "حقول النخيل",
      nav_olive: "حقول الزيتون",
      nav_warehouse: "مستودع",
      nav_equipment: "الأسطول",
      nav_reports: "السجلات اليومية",
      nav_production: "الإنتاج",
      nav_accounting: "المحاسبة",
      nav_admin: "لوحة الإدارة",
      nav_logout: "تسجيل خروج",
      // Misc UI
      welcome_back: "مرحباً",
      lang_toggle: "English",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;

