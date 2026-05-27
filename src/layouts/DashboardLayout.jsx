/**
 * DashboardLayout — ATLS Design System
 *
 * Redesigned sidebar with:
 *   - HR accordion sub-menu (auto-expands on HR routes)
 *   - Sidebar collapse state persisted in localStorage
 *   - Tooltips for all nav items when collapsed
 *   - RTL-aware active indicator and animations
 *   - Online status indicator in footer
 *   - Smooth transitions throughout
 *
 * All functionality preserved:
 *   - hasAccess permission checks
 *   - Feature toggle guards (config.features.*)
 *   - Dynamic brand CMS (logoText, logoUrl)
 *   - Mobile overlay + close on route change
 *   - DashboardTopbar + BottomNav integration
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useFeatures } from '../contexts/FeatureToggleContext';
import { hasAccess } from '../utils/accessControl';
import DashboardTopbar from './DashboardTopbar';
import BottomNav from '../components/BottomNav';
import { cn } from '../lib/utils';
import api from '../services/api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import {
  LayoutDashboard,
  Tractor,
  Package,
  Wrench,
  FileText,
  TrendingUp,
  Wallet,
  ShieldCheck,
  X,
  LogOut,
  Users,
  CheckSquare,
  Images,
  ChevronDown,
  UserCircle2,
  Handshake,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const SIDEBAR_STORAGE_KEY = 'atls_sidebar_collapsed';
const HR_ROUTES = ['/hr', '/hr/payroll', '/hr/contractors'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getStoredCollapse = () => {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const setStoredCollapse = (value) => {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
  } catch { /* storage unavailable */ }
};

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * SectionLabel — sidebar category divider
 * Collapses to a thin rule when sidebar is collapsed.
 */
const SectionLabel = ({ label, collapsed }) => {
  if (collapsed) {
    return <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3 my-2" />;
  }
  return (
    <p className="px-4 pt-5 pb-1.5 text-[10px] font-bold tracking-widest uppercase
                  text-slate-400 dark:text-slate-600 select-none">
      {label}
    </p>
  );
};

/**
 * NavItem — single sidebar link.
 * When collapsed: icon-only with tooltip.
 * When expanded: icon + label with active indicator bar.
 */
const NavItem = ({
  to,
  icon: Icon,
  label,
  isChild = false,
  collapsed,
  isRTL,
  onMobileClose,
}) => {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== '/dashboard' && location.pathname.startsWith(to + '/'));

  const linkContent = (
    <Link
      to={to}
      onClick={onMobileClose}
      className={cn(
        'flex items-center gap-3 px-3 rounded-lg transition-colors duration-150 group relative',
        isChild ? 'py-1.5' : 'py-2',
        collapsed ? 'justify-center' : 'justify-start',
        isActive
          ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
      )}
    >
      {/* Active bar indicator */}
      {isActive && !collapsed && (
        <span className={cn(
          'absolute inset-y-2 w-[3px] rounded-full bg-green-600 dark:bg-green-500',
          isRTL ? 'end-0' : 'start-0'
        )} />
      )}

      <Icon className={cn(
        'flex-shrink-0 transition-colors',
        isChild ? 'w-[15px] h-[15px]' : 'w-[17px] h-[17px]',
        isActive
          ? 'text-green-600 dark:text-green-500'
          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
      )} />

      {!collapsed && (
        <span className={cn(
          'truncate',
          isChild ? 'text-[12.5px]' : 'text-[13.5px]',
          isActive ? 'font-semibold' : 'font-medium'
        )}>
          {label}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <div className="px-2 mb-0.5">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side={isRTL ? 'left' : 'right'} sideOffset={10}>
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return <div className="px-2 mb-0.5">{linkContent}</div>;
};

/**
 * NavGroup — collapsible accordion group for related nav items.
 * Used for HR section. Auto-expands when user is on a grouped route.
 *
 * When sidebar is collapsed: shows group icon (tooltip) + child icons directly.
 * When sidebar is expanded: shows toggle header + animated children list.
 */
const NavGroup = ({
  icon: Icon,
  label,
  children,
  groupRoutes,
  collapsed,
  isRTL,
  expanded,
  onToggle,
}) => {
  const location = useLocation();
  const isGroupActive = groupRoutes.some(r => location.pathname.startsWith(r));

  // Collapsed mode: show children directly (no group header needed)
  if (collapsed) {
    return (
      <div className="mb-0.5">
        {/* Group icon as a non-interactive visual separator */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="px-2 mb-0.5">
                <div className={cn(
                  'flex items-center justify-center p-2 rounded-lg',
                  isGroupActive
                    ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400'
                    : 'text-slate-400 dark:text-slate-500'
                )}>
                  <Icon className="w-[17px] h-[17px]" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side={isRTL ? 'left' : 'right'} sideOffset={10}>
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {/* Children in collapsed mode */}
        {children}
      </div>
    );
  }

  return (
    <div className="px-2 mb-0.5">
      {/* Accordion toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group',
          isGroupActive && !expanded
            ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
        )}
      >
        <Icon className={cn(
          'w-[17px] h-[17px] flex-shrink-0 transition-colors',
          isGroupActive
            ? 'text-green-600 dark:text-green-500'
            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
        )} />

        <span className={cn(
          'flex-1 text-start text-[13.5px] truncate',
          isGroupActive && !expanded ? 'font-semibold' : 'font-medium'
        )}>
          {label}
        </span>

        <ChevronDown className={cn(
          'w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0',
          expanded && 'rotate-180'
        )} />
      </button>

      {/* Animated children list */}
      <div
        style={{
          maxHeight: expanded ? '160px' : '0px',
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease',
        }}
      >
        <div className={cn(
          'mt-1 py-0.5 border-s-2 border-slate-200 dark:border-slate-700',
          isRTL ? 'me-1 pe-1' : 'ms-3 ps-1'
        )}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ── Main Layout ───────────────────────────────────────────────────────────────
const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { config } = useFeatures();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';

  // Mobile sidebar open/close
  const [mobileOpen, setMobileOpen] = useState(false);

  // Desktop collapse — initialized from localStorage (no flicker)
  const [collapsed, setCollapsed] = useState(getStoredCollapse);

  // Brand CMS
  const [logoText, setLogoText] = useState(isRTL ? 'أطلس سيوة' : 'Atlas Farm');
  const [logoUrl, setLogoUrl] = useState('');

  // HR accordion — auto-expand when on any HR route
  const isOnHRRoute = HR_ROUTES.some(r => location.pathname.startsWith(r));
  const [hrExpanded, setHrExpanded] = useState(isOnHRRoute);

  // ── Effects ────────────────────────────────────────────────────────────────
  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Auto-expand HR accordion when navigating to HR routes
  useEffect(() => {
    if (isOnHRRoute) setHrExpanded(true);
  }, [location.pathname]);

  // Fetch dynamic brand config
  useEffect(() => {
    api.get('auth/public/landing')
      .then(res => {
        const data = res.data;
        const lang = i18n.language === 'ar' ? 'ar' : 'en';
        const trans = data?.[lang]?.translation;
        if (trans?.logo_text) setLogoText(trans.logo_text);
        if (trans?.logo_url) setLogoUrl(trans.logo_url);
      })
      .catch(() => { });
  }, [i18n.language]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDrawerToggle = () => setMobileOpen(prev => !prev);
  const handleCollapseToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    setStoredCollapse(next);
  };
  const handleMobileClose = () => setMobileOpen(false);

  const hasAccessCheck = (module) => hasAccess(user, module);

  // ── Shared nav item props ──────────────────────────────────────────────────
  const navProps = { collapsed, isRTL, onMobileClose: handleMobileClose };

  // ── Sidebar content ────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950
                    border-e border-slate-200 dark:border-slate-800
                    transition-colors duration-200">

      {/* ── Logo header ───────────────────────────────────────────── */}
      <div className={cn(
        'flex items-center h-16 border-b border-slate-200 dark:border-slate-800 flex-shrink-0',
        collapsed ? 'justify-center px-4' : 'px-4 gap-3'
      )}>
        <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
          {/* Logo mark */}
          {logoUrl ? (
            <img
              src={logoUrl}
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              alt="Logo"
            />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0
                            bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-sm">
              <Tractor className="w-[17px] h-[17px]" />
            </div>
          )}

          {/* Brand name + tagline */}
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {logoText}
              </span>
              <span className="text-[10px] font-semibold text-green-600 dark:text-green-500 leading-tight truncate">
                {isRTL ? 'منصة الإدارة الذكية' : 'Smart ERP Platform'}
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {!collapsed && (
          <button
            onClick={handleMobileClose}
            className="md:hidden p-1.5 rounded-md text-slate-400 flex-shrink-0
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">

        {/* Operations */}
        <SectionLabel label={t('sidebar.operations', 'Operations')} collapsed={collapsed} />

        <NavItem
          to="/dashboard"
          icon={LayoutDashboard}
          label={t('sidebar.dashboard', 'Dashboard')}
          {...navProps}
        />

        {hasAccessCheck('farm') && (
          <NavItem
            to="/farm"
            icon={Tractor}
            label={t('sidebar.farm', 'Farm Structure')}
            {...navProps}
          />
        )}

        {hasAccessCheck('warehouse') && config?.features?.warehouse && (
          <NavItem
            to="/warehouse"
            icon={Package}
            label={t('sidebar.warehouse', 'Warehouse')}
            {...navProps}
          />
        )}

        {hasAccessCheck('equipment') && config?.features?.fleet && (
          <NavItem
            to="/equipment"
            icon={Wrench}
            label={t('sidebar.equipment', 'Fleet & Equipment')}
            {...navProps}
          />
        )}

        {/* Business */}
        <SectionLabel label={t('sidebar.business', 'Business')} collapsed={collapsed} />

        {hasAccessCheck('reports') && (
          <NavItem
            to="/reports"
            icon={FileText}
            label={t('sidebar.reports', 'Reports')}
            {...navProps}
          />
        )}

        {hasAccessCheck('production') && (
          <NavItem
            to="/production"
            icon={TrendingUp}
            label={t('sidebar.production', 'Production')}
            {...navProps}
          />
        )}

        {hasAccessCheck('accounting') && config?.features?.accounting && (
          <NavItem
            to="/accounting"
            icon={Wallet}
            label={t('sidebar.accounting', 'Accounting')}
            {...navProps}
          />
        )}

        {/* Human Resources — Accordion group */}
        {hasAccessCheck('hr') && config?.features?.hr && (
          <>
            <SectionLabel
              label={t('sidebar.hr_section', 'Human Resources')}
              collapsed={collapsed}
            />
            <NavGroup
              icon={Users}
              label={t('sidebar.hr_group', 'HR')}
              groupRoutes={HR_ROUTES}
              collapsed={collapsed}
              isRTL={isRTL}
              expanded={hrExpanded}
              onToggle={() => setHrExpanded(prev => !prev)}
            >
              <NavItem
                to="/hr"
                icon={UserCircle2}
                label={t('sidebar.hr', 'HR Dashboard')}
                isChild
                {...navProps}
              />
              <NavItem
                to="/hr/payroll"
                icon={CheckSquare}
                label={t('sidebar.payroll', 'Payroll Approval')}
                isChild
                {...navProps}
              />
              <NavItem
                to="/hr/contractors"
                icon={Handshake}
                label={t('sidebar.contractors', 'Contractor Payments')}
                isChild
                {...navProps}
              />
            </NavGroup>
          </>
        )}

        {/* Administration */}
        {user?.role && ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user.role) && (
          <>
            <SectionLabel
              label={t('sidebar.security', 'Administration')}
              collapsed={collapsed}
            />
            <NavItem
              to="/admin"
              icon={ShieldCheck}
              label={t('sidebar.admin', 'Admin Controls')}
              {...navProps}
            />
            {/* <NavItem
              to="/dashboard/media"
              icon={Images}
              label={t('sidebar.mediaControl', 'Media Control')}
              {...navProps}
            /> */}
          </>
        )}
      </div>

      {/* ── Footer — user profile ────────────────────────────────── */}
      <div className={cn(
        'p-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0',
        collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2.5'
      )}>
        {/* Avatar with online indicator */}
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden
                          bg-green-100 dark:bg-green-900/40 flex items-center justify-center
                          ring-2 ring-green-200 dark:ring-green-800">
            <span className="text-sm font-bold text-green-700 dark:text-green-400">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          {/* Online dot */}
          <span className="absolute bottom-0 end-0 w-2.5 h-2.5 rounded-full bg-green-500
                           ring-2 ring-white dark:ring-slate-950" />
        </div>

        {/* Name + role */}
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {user?.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight capitalize">
              {user?.role?.replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={logout}
          title={t('sidebar.logout', 'Sign Out')}
          className="p-2 rounded-lg text-slate-400 flex-shrink-0
                     hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                     transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[240px]';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950
                    font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={handleDrawerToggle}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 z-40 flex flex-col transition-all duration-300 ease-in-out',
        'md:relative md:translate-x-0',
        isRTL ? 'right-0' : 'left-0',
        mobileOpen
          ? 'translate-x-0'
          : (isRTL ? 'translate-x-full' : '-translate-x-full'),
        sidebarWidth
      )}>
        {sidebarContent}
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        <DashboardTopbar
          onDrawerToggle={handleDrawerToggle}
          onCollapseToggle={handleCollapseToggle}
          isCollapsed={collapsed}
        />

        {/* Spacer for fixed topbar */}
        <div className="h-16 flex-shrink-0" />

        {/* Page content with entry animation */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto atls-page-enter pb-20 md:pb-8">
          {children}
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
      </main>
    </div>
  );
};

export default DashboardLayout;
