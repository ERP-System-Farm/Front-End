import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Wallet, FileText, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Determine active tab based on path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/warehouse')) return 1;
    if (path.includes('/accounting')) return 2;
    if (path.includes('/reports')) return 3;
    if (path.includes('/profile') || path.includes('/admin')) return 4;
    return 0; // Dashboard
  };

  const activeTab = getActiveTab();

  const navItems = [
    { label: t('nav.home', 'الرئيسية'), icon: Home, path: '/dashboard', index: 0 },
    { label: t('nav.warehouse', 'المخزون'), icon: Package, path: '/warehouse', index: 1 },
    { label: t('nav.accounting', 'المحاسبة'), icon: Wallet, path: '/accounting', index: 2 },
    { label: t('nav.reports', 'التقارير'), icon: FileText, path: '/reports', index: 3 },
    { label: t('nav.more', 'المزيد'), icon: MoreHorizontal, path: '/profile', index: 4 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.index;
          return (
            <button
              key={item.index}
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
