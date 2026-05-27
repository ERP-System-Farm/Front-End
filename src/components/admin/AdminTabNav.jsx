/**
 * AdminTabNav — ATLS Design System
 *
 * Presentational component extracted from AdminControls.jsx.
 * Replaces the MUI Tabs/Tab components with a native scrollable
 * tab bar using Tailwind CSS.
 *
 * Props mirror exact AdminControls usage:
 *   activeTab   — string: current active tab key
 *   onChange    — (tabKey: string) => void
 *   currentUser — user object (for role-based tab visibility)
 *   pendingCount — number (for future badge use)
 *   isRTL       — boolean
 *
 * SAFE: No state, no API calls, no business logic.
 * ZERO MUI dependencies.
 */
import React from 'react';
import { cn } from '@/lib/utils';

// Icon map — all lucide-react, replaces @mui/icons-material
import {
  LayoutDashboard,
  ShieldCheck,
  Megaphone,
  MessageSquare,
  CircleUserRound,
  Trash2,
  ImagePlay,
  Settings,
  Globe,
  Database,
  Lock,
} from 'lucide-react';

const TAB_DEFS = [
  { key: 'overview',       icon: LayoutDashboard,  labelAr: 'لوحة التحكم',               labelEn: 'Overview',            roles: null },
  { key: 'security',       icon: ShieldCheck,      labelAr: 'الصلاحيات والمستخدمين',       labelEn: 'Users & Permissions', roles: null },
  { key: 'announcements',  icon: Megaphone,        labelAr: 'الإعلانات',                   labelEn: 'Announcements',       roles: null },
  { key: 'comments',       icon: MessageSquare,    labelAr: 'التعليقات',                   labelEn: 'Comments',            roles: null },
  { key: 'avatars',        icon: CircleUserRound,  labelAr: 'الأفاتار',                    labelEn: 'User Avatars',        roles: null },
  { key: 'bulk_ops',       icon: Trash2,           labelAr: 'العمليات الجماعية',           labelEn: 'Bulk Operations',     roles: null },
  { key: 'media_center',   icon: ImagePlay,        labelAr: 'إدارة مركز الوسائط',         labelEn: 'Media Control',       roles: null },
  { key: 'farm',           icon: Settings,         labelAr: 'إعدادات المزرعة',             labelEn: 'Farm Settings',       roles: null },
  { key: 'cms',            icon: Globe,            labelAr: 'إدارة الواجهة',               labelEn: 'CMS',                 roles: ['SUPER_ADMIN'] },
  { key: 'saas',           icon: Settings,         labelAr: 'إعدادات SaaS والهوية',       labelEn: 'SaaS & Branding',     roles: ['SUPER_ADMIN', 'OWNER'] },
  { key: 'data',           icon: Database,         labelAr: 'إدارة وحقن البيانات',        labelEn: 'Data Management',     roles: ['SUPER_ADMIN', 'OWNER'] },
  { key: 'password_resets',icon: Lock,             labelAr: 'طلبات استعادة كلمة المرور', labelEn: 'Password Resets',     roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER'] },
];

const AdminTabNav = ({ activeTab, onChange, currentUser, isRTL }) => {
  const role = currentUser?.role;

  const visibleTabs = TAB_DEFS.filter(tab => {
    if (!tab.roles) return true;
    return role && tab.roles.includes(role);
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-8 shadow-sm overflow-hidden">
      <div
        className="flex overflow-x-auto scrollbar-thin"
        role="tablist"
        aria-label="Admin Control Tabs"
      >
        {visibleTabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const label = isRTL ? tab.labelAr : tab.labelEn;

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              onClick={() => onChange(tab.key)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3.5 text-[13px] font-bold whitespace-nowrap',
                'transition-colors duration-150 flex-shrink-0',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500',
                // Separator between tabs (not first)
                index > 0 && 'border-s border-slate-100 dark:border-slate-800',
                isActive
                  ? 'text-green-700 dark:text-green-400 bg-green-50/70 dark:bg-green-950/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
            >
              <Icon className={cn(
                'w-[15px] h-[15px] flex-shrink-0',
                isActive ? 'text-green-600 dark:text-green-500' : 'text-slate-400 dark:text-slate-500'
              )} />
              {label}

              {/* Active bottom indicator */}
              {isActive && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-green-600 dark:bg-green-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTabNav;
