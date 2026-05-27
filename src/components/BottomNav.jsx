/**
 * BottomNav — ATLS Design System
 *
 * Mobile bottom navigation bar.
 * Improvements:
 *   - Role-aware item visibility (Accounting only for finance roles, Warehouse only for relevant roles)
 *   - Top-bar active indicator (green line at top of active item)
 *   - Proper sub-route active detection
 *   - Dynamic item list based on feature flags
 *   - Clean, enterprise-grade visual style
 *
 * All logic preserved: navigation, route matching, feature toggle checks.
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Wallet, FileText, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { useFeatures } from '../contexts/FeatureToggleContext';
import { useAuth } from '../app/AuthContext';
import { hasAccess } from '../utils/accessControl';

export default function BottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t }     = useTranslation();
  const { config } = useFeatures();
  const { user }  = useAuth();

  const canViewAccounting = hasAccess(user, 'accounting');
  const canViewWarehouse  = hasAccess(user, 'warehouse');
  const canViewReports    = hasAccess(user, 'reports');

  const navItems = [
    {
      label:   t('nav.home', 'Home'),
      icon:    Home,
      path:    '/dashboard',
      visible: true,
    },
    {
      label:   t('nav.warehouse', 'Warehouse'),
      icon:    Package,
      path:    '/warehouse',
      visible: canViewWarehouse && (config?.features?.warehouse !== false),
    },
    {
      label:   t('nav.accounting', 'Finance'),
      icon:    Wallet,
      path:    '/accounting',
      visible: canViewAccounting && (config?.features?.accounting !== false),
    },
    {
      label:   t('nav.reports', 'Reports'),
      icon:    FileText,
      path:    '/reports',
      visible: canViewReports,
    },
    {
      label:   t('nav.more', 'More'),
      icon:    MoreHorizontal,
      path:    '/profile',
      visible: true,
    },
  ].filter(item => item.visible);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50
                 bg-white dark:bg-slate-900
                 border-t border-slate-200 dark:border-slate-800"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-stretch h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-0.5 relative transition-colors',
                isActive
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active top-bar indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5
                                 bg-green-600 dark:bg-green-500 rounded-full" />
              )}

              <Icon className={cn(
                'transition-all duration-150',
                isActive ? 'w-5 h-5 scale-110' : 'w-5 h-5'
              )} />

              <span className={cn(
                'text-[9.5px] leading-none',
                isActive ? 'font-bold' : 'font-medium'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
