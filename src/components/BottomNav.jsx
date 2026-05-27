import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Wallet, FileText, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { useFeatures } from '../contexts/FeatureToggleContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { config } = useFeatures();

  const navItems = [
    { label: t('nav.home', 'الرئيسية'), icon: Home, path: '/dashboard', visible: true },
    { label: t('nav.warehouse', 'المخزون'), icon: Package, path: '/warehouse', visible: !config || config.features?.warehouse },
    { label: t('nav.accounting', 'المحاسبة'), icon: Wallet, path: '/accounting', visible: !config || config.features?.accounting },
    { label: t('nav.reports', 'التقارير'), icon: FileText, path: '/reports', visible: true },
    { label: t('nav.more', 'المزيد'), icon: MoreHorizontal, path: '/profile', visible: true },
  ].filter(item => item.visible);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-current opacity-20 stroke-2")} />
              <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
