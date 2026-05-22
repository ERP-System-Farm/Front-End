import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { hasAccess } from '../utils/accessControl';
import DashboardTopbar from './DashboardTopbar';
import BottomNav from '../components/BottomNav';
import { cn } from '../lib/utils';
import api from '../services/api';
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
  Images
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoText, setLogoText] = useState(isRTL ? 'أطلس سيوة' : 'Atlas Farm');
  const [logoUrl, setLogoUrl] = useState('');

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleCollapseToggle = () => setCollapsed(!collapsed);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Fetch dynamic brand custom CMS config
  useEffect(() => {
    api.get('auth/public/landing')
      .then(res => {
        const data = res.data;
        const lang = i18n.language === 'ar' ? 'ar' : 'en';
        if (data && data[lang] && data[lang].translation) {
          const trans = data[lang].translation;
          if (trans.logo_text) setLogoText(trans.logo_text);
          if (trans.logo_url) setLogoUrl(trans.logo_url);
        }
      })
      .catch(() => {});
  }, [i18n.language]);

  const hasAccessCheck = (module) => hasAccess(user, module);

  const SectionLabel = ({ label }) => {
    if (collapsed) return <div className="h-4 my-2" />;
    return (
      <p className="px-4 mt-6 mb-2 text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
        {label}
      </p>
    );
  };

  const NavItem = ({ to, icon: Icon, labelKey, defaultLabel, activeColorClass }) => {
    const isActive = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(`${to}/`));
    
    return (
      <div className="px-2 mb-1 relative">
        <Link
          to={to}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
            collapsed ? "justify-center" : "justify-start",
            isActive 
              ? "bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-400 font-bold" 
              : "text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
          )}
        >
          {isActive && !collapsed && (
            <div className={cn("absolute top-1/4 bottom-1/4 w-1 bg-green-600 dark:bg-green-500 rounded-full", isRTL ? "right-0" : "left-0")} />
          )}
          <Icon 
            className={cn(
              "w-5 h-5 flex-shrink-0 transition-colors", 
              isActive ? "text-green-600 dark:text-green-500" : activeColorClass || "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
            )} 
          />
          {!collapsed && (
            <span className="text-sm truncate">
              {t(labelKey, defaultLabel)}
            </span>
          )}
        </Link>
      </div>
    );
  };

  const sidebarWidth = collapsed ? "w-20" : "w-64";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 border-e border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className={cn("flex items-center h-16 border-b border-slate-200 dark:border-slate-800", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <div className="flex items-center gap-3 overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="Logo" />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-green-800 text-white flex-shrink-0">
              <Tractor className="w-5 h-5" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-sm font-bold leading-tight truncate max-w-[120px]">{logoText}</span>
              <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                {isRTL ? 'منصة الإدارة الذكية' : 'Smart ERP Platform'}
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={handleDrawerToggle} className="md:hidden p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <SectionLabel label={t('sidebar.operations', 'العمليات')} />
        <NavItem to="/dashboard" icon={LayoutDashboard} labelKey="sidebar.dashboard" />
        
        {hasAccessCheck('farm') && (
          <NavItem to="/farm" icon={Tractor} labelKey="sidebar.farm" activeColorClass="text-green-600 dark:text-green-500" />
        )}
        
        {hasAccessCheck('warehouse') && (
          <NavItem to="/warehouse" icon={Package} labelKey="sidebar.warehouse" activeColorClass="text-amber-500 dark:text-amber-400" />
        )}
        
        {hasAccessCheck('equipment') && (
          <NavItem to="/equipment" icon={Wrench} labelKey="sidebar.equipment" activeColorClass="text-blue-500 dark:text-blue-400" />
        )}

        <SectionLabel label={t('sidebar.business', 'الأعمال')} />
        
        {hasAccessCheck('reports') && (
          <NavItem to="/reports" icon={FileText} labelKey="sidebar.reports" activeColorClass="text-indigo-500 dark:text-indigo-400" />
        )}
        
        {hasAccessCheck('production') && (
          <NavItem to="/production" icon={TrendingUp} labelKey="sidebar.production" activeColorClass="text-purple-500 dark:text-purple-400" />
        )}
        
        {hasAccessCheck('accounting') && (
          <NavItem to="/accounting" icon={Wallet} labelKey="sidebar.accounting" defaultLabel="الحسابات العامة" activeColorClass="text-yellow-600 dark:text-yellow-500" />
        )}

        <NavItem to="/hr" icon={Users} labelKey="sidebar.hr" defaultLabel="إدارة الموارد البشرية" activeColorClass="text-emerald-500 dark:text-emerald-400" />
        <NavItem to="/hr/payroll" icon={CheckSquare} labelKey="sidebar.payroll" defaultLabel="شاشة اعتماد الرواتب" activeColorClass="text-amber-600 dark:text-amber-500" />
        <NavItem to="/hr/contractors" icon={TrendingUp} labelKey="sidebar.contractors" defaultLabel="مستحقات المقاولين" activeColorClass="text-indigo-500 dark:text-indigo-400" />

        {user?.role && ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user.role) && (
          <>
            <SectionLabel label={t('sidebar.security', 'الأمان')} />
            <NavItem to="/admin" icon={ShieldCheck} labelKey="sidebar.admin" activeColorClass="text-teal-500 dark:text-teal-400" />
            <NavItem to="/dashboard/media" icon={Images} labelKey="sidebar.mediaControl" defaultLabel="إدارة مركز الوسائط" activeColorClass="text-purple-500 dark:text-purple-400" />
          </>
        )}
      </div>

      {/* Footer Profile */}
      <div className={cn("p-4 border-t border-slate-200 dark:border-slate-800 flex items-center", collapsed ? "flex-col gap-3 justify-center" : "gap-3")}>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-bold text-sm flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        )}
        <button 
          onClick={logout}
          title={t('sidebar.logout', 'تسجيل الخروج')}
          className={cn("p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors", collapsed && "mt-1")}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={handleDrawerToggle}
        />
      )}

      {/* Sidebar Container — z-40, below topbar which is z-50 */}
      <aside 
        className={cn(
          "fixed inset-y-0 z-40 flex flex-col transition-all duration-300 ease-in-out md:relative md:translate-x-0",
          isRTL ? "right-0" : "left-0",
          mobileOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full"),
          sidebarWidth
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 pb-16 md:pb-0">
        <DashboardTopbar 
          onDrawerToggle={handleDrawerToggle}
          onCollapseToggle={handleCollapseToggle}
          isCollapsed={collapsed}
        />
        
        {/* Spacer for fixed topbar */}
        <div className="h-16 flex-shrink-0" />
        
        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </main>
    </div>
  );
};

export default DashboardLayout;
