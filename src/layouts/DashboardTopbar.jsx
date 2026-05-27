/**
 * DashboardTopbar — ATLS Design System
 *
 * Fully rewritten to eliminate Material UI dependency.
 * Uses: Tailwind CSS + Shadcn DropdownMenu + Lucide icons.
 *
 * All logic preserved:
 *   - toggleTheme (light/dark)
 *   - toggleLanguage (ar/en) with localStorage + dir/lang update
 *   - navigate to profile, settings, public site
 *   - logout
 *   - page title resolution from current route (extended to cover all sub-routes)
 *   - sidebar collapse/expand toggle
 *   - mobile drawer toggle
 */
import React from 'react';
import { useAuth } from '../app/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useThemeMode } from '../app/ThemeContext';
import { getAbsoluteFileUrl, cn } from '../lib/utils';
import NotificationBell from '../components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

// ── Route → Page Title Map ────────────────────────────────────────────────────
// Extended to cover ALL routes including sub-routes and dynamic paths.
// Priority: longer/more specific paths are matched first.
const ROUTE_LABELS = [
  // Sub-routes first (more specific)
  ['/dashboard/media',              { key: 'sidebar.mediaControl',    fb: 'Media Control Center' }],
  ['/dashboard/announcements',      { key: 'sidebar.announcements',   fb: 'Announcements' }],
  ['/farm/enclosure',               { key: 'sidebar.enclosure',       fb: 'Enclosure Profile' }],
  ['/warehouse/alerts',             { key: 'sidebar.warehouse_alerts',fb: 'Stock Alerts' }],
  ['/production/harvest/new',       { key: 'sidebar.harvest_new',     fb: 'New Harvest Report' }],
  ['/production/harvest/edit',      { key: 'sidebar.harvest_edit',    fb: 'Edit Harvest Report' }],
  ['/hr/payroll',                   { key: 'sidebar.payroll',         fb: 'Payroll Approval' }],
  ['/hr/contractors',               { key: 'sidebar.contractors',     fb: 'Contractor Payments' }],
  // Top-level routes
  ['/dashboard',                    { key: 'sidebar.dashboard',       fb: 'Dashboard' }],
  ['/farm',                         { key: 'sidebar.farm',            fb: 'Farm Structure' }],
  ['/warehouse',                    { key: 'sidebar.warehouse',       fb: 'Warehouse & Inventory' }],
  ['/equipment',                    { key: 'sidebar.equipment',       fb: 'Fleet & Equipment' }],
  ['/reports',                      { key: 'sidebar.reports',         fb: 'Daily Reports' }],
  ['/production',                   { key: 'sidebar.production',      fb: 'Production & Harvest' }],
  ['/accounting',                   { key: 'sidebar.accounting',      fb: 'Finance & Accounting' }],
  ['/hr',                           { key: 'sidebar.hr',              fb: 'HR Dashboard' }],
  ['/admin',                        { key: 'sidebar.admin',           fb: 'Admin Controls' }],
  ['/profile',                      { key: 'nav.profile',             fb: 'My Profile' }],
];

const getPageTitle = (pathname, t) => {
  for (const [route, label] of ROUTE_LABELS) {
    if (pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route)) {
      return t(label.key, label.fb);
    }
  }
  return 'Atlas Farm ERP';
};

// ── Role → Badge Style Map ────────────────────────────────────────────────────
const ROLE_BADGE = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  OWNER:       'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  MANAGER:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ENGINEER:    'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  ACCOUNTANT:  'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  WAREHOUSE:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  HR:          'bg-pink-100   text-pink-700   dark:bg-pink-900/30   dark:text-pink-400',
};

// ── Component ─────────────────────────────────────────────────────────────────
const DashboardTopbar = ({ onDrawerToggle, onCollapseToggle, isCollapsed }) => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isRTL = i18n.language === 'ar';
  const pageTitle = getPageTitle(location.pathname, t);
  const roleBadgeClass = ROLE_BADGE[user?.role] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  const roleLabel = user?.role?.replace(/_/g, ' ') ?? '';
  const avatarUrl = user?.avatar_url ? getAbsoluteFileUrl(user.avatar_url) : null;

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('atlas_lang', next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  const todayLabel = new Date().toLocaleDateString(
    i18n.language === 'ar' ? 'ar-DZ' : 'en-GB',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Collapse toggle icon respects RTL
  const CollapseIcon = isRTL
    ? (isCollapsed ? ChevronLeft  : ChevronRight)
    : (isCollapsed ? ChevronRight : ChevronLeft);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 h-16 flex items-center
                 bg-white/80 dark:bg-slate-950/80
                 backdrop-blur-xl
                 border-b border-slate-200 dark:border-slate-800
                 transition-colors duration-200"
    >
      <div className="flex items-center justify-between w-full px-3 md:px-5 gap-2">

        {/* ── Left: menu toggle + page title ───────────────────────── */}
        <div className="flex items-center gap-1.5 min-w-0">

          {/* Mobile hamburger */}
          <button
            onClick={onDrawerToggle}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop sidebar collapse toggle */}
          <button
            onClick={onCollapseToggle}
            className="hidden md:flex p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <CollapseIcon className="w-4 h-4" />
          </button>

          {/* Page title + subtitle */}
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {pageTitle}
            </h2>
            <p className="hidden sm:block text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-tight truncate">
              Atlas Farm ERP &bull; {todayLabel}
            </p>
          </div>
        </div>

        {/* ── Right: actions ───────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 flex-shrink-0">

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={mode === 'dark' ? t('topbar.light_mode', 'Light Mode') : t('topbar.dark_mode', 'Dark Mode')}
          >
            {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Public site link */}
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={i18n.language === 'ar' ? 'الموقع العام' : 'Public Site'}
          >
            <Globe className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* ── User menu ─────────────────────────────────────────── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 px-1.5 py-1.5 ms-1 rounded-xl
                           hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label="User menu"
              >
                {/* Name + role badge — hidden on mobile */}
                <div className={cn(
                  'hidden sm:flex flex-col gap-0.5',
                  isRTL ? 'items-start' : 'items-end'
                )}>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                    {user?.name}
                  </span>
                  <span className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none',
                    roleBadgeClass
                  )}>
                    {roleLabel}
                  </span>
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0
                                bg-green-100 dark:bg-green-900/40 flex items-center justify-center
                                ring-2 ring-green-200 dark:ring-green-800">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align={isRTL ? 'start' : 'end'}
              sideOffset={8}
              className="w-56"
            >
              {/* Mini profile header */}
              <div className="px-3 py-2.5 border-b border-border mb-1">
                <p className="text-[13px] font-bold text-foreground truncate leading-snug">
                  {user?.name}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  {roleLabel}
                </p>
              </div>

              <DropdownMenuItem
                onClick={() => navigate('/profile')}
                className="gap-2.5 cursor-pointer text-[13px]"
              >
                <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span>{t('nav.dashboard', 'My Profile')}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="gap-2.5 cursor-pointer text-[13px]"
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span>{t('nav.account_settings', 'Account Settings')}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={toggleLanguage}
                className="gap-2.5 cursor-pointer text-[13px]"
              >
                <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span>{i18n.language === 'ar' ? 'English' : 'عربي'}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={logout}
                className="gap-2.5 cursor-pointer text-[13px]
                           text-red-600 dark:text-red-400
                           focus:text-red-600 dark:focus:text-red-400
                           focus:bg-red-50 dark:focus:bg-red-950/30"
              >
                <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t('sidebar.logout', 'Sign Out')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardTopbar;
