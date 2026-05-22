import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFinancialSummary } from '../../features/accounting/services';
import { getEquipmentList } from '../../features/equipment/services';
import { getItems } from '../../features/warehouse/services';
import { useAuth } from '../../app/AuthContext';
import { reportsApi } from '../../services/reportsApi';
import { cn } from '../../lib/utils';
import WeatherWidget from '../../components/dashboard/WeatherWidget';
import MediaSlider from '../../components/dashboard/MediaSlider';
import AnnouncementsBoard from '../../components/dashboard/AnnouncementsBoard';
import {
  DollarSign,
  Tractor,
  Package,
  Leaf,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Activity,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";

const ModuleCard = ({ title, description, icon: Icon, colorClass, bgColorClass, path, count, isRTL }) => {
  const navigate = useNavigate();
  const ActionIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Card
      onClick={() => navigate(path)}
      className="cursor-pointer group hover:shadow-2xl hover:shadow-green-500/5 hover:-translate-y-1.5 transition-all duration-500 h-full flex flex-col bg-card/45 backdrop-blur-xl border border-border/60 hover:border-green-500/40 relative overflow-hidden rounded-3xl"
    >
      {/* Dynamic Glow and Mesh backgrounds */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-all duration-700 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <CardContent className="p-7 flex flex-col h-full z-10">
        {/* Icon container with double border and elegant soft shadow */}
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 border border-white/20 dark:border-zinc-800/80 shadow-md group-hover:scale-110 group-hover:rotate-3",
          bgColorClass, 
          colorClass
        )}>
          <Icon className="w-6 h-6 stroke-[2]" />
        </div>

        <h3 className="text-xl font-extrabold text-foreground mb-2.5 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground/90 mb-6 flex-grow leading-relaxed font-medium">
          {description}
        </p>

        <div className="flex justify-between items-center mt-auto pt-4 border-t border-border/40">
          <Badge variant="secondary" className={cn("font-bold rounded-xl px-3 py-1.5 text-xs shadow-sm", bgColorClass, colorClass)}>
            {count}
          </Badge>
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-muted/40 border border-border/40 group-hover:bg-green-500/10 group-hover:border-green-500/20 transition-all duration-300", colorClass)}>
            <ActionIcon
              className={cn("w-4 h-4 transition-transform duration-300", isRTL ? "group-hover:-translate-x-1" : "group-hover:translate-x-1")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatCard = ({ title, value, unit, icon: Icon, colorClass, bgColorClass, trend, trendUp }) => {
  return (
    <Card className="h-full flex flex-col hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-green-500/5 transition-all duration-500 bg-gradient-to-b from-card to-card/50 backdrop-blur-xl border border-border/50 hover:border-green-500/30 relative overflow-hidden rounded-3xl group">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-7 flex flex-col h-full">
        <div className="flex justify-between items-start mb-5">
          <p className="text-sm font-bold text-muted-foreground tracking-tight">
            {title}
          </p>
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20 dark:border-zinc-800/80 shadow-sm transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105", 
            bgColorClass, 
            colorClass
          )}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-3 flex-grow">
          <h2 className="text-4xl font-black text-foreground tracking-tight leading-none">
            {value}
          </h2>
          {unit && (
            <span className="text-xs text-muted-foreground/80 font-bold">{unit}</span>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 mt-3 bg-muted/40 dark:bg-zinc-900/40 border border-border/30 px-3 py-1 rounded-full w-fit shadow-inner">
            {trendUp === true && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
            {trendUp === false && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
            <span
              className={cn(
                "text-xs font-bold tracking-tight",
                trendUp === true ? "text-green-600 dark:text-green-400" : trendUp === false ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
              )}
            >
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const InsightStatCard = ({ title, value, detail, icon: Icon, gradientClass, iconColorClass, themeType }) => {
  const isNa = value === 'غير متوفر' || value === 'N/A';
  
  const borderStyle = 
    themeType === 'success' ? 'border-l-[5px] border-l-emerald-500 dark:border-l-emerald-600' :
    themeType === 'warning' ? 'border-l-[5px] border-l-amber-500 dark:border-l-amber-600' :
    'border-l-[5px] border-l-rose-500 dark:border-l-rose-600';

  const textGradient =
    themeType === 'success' ? 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400' :
    themeType === 'warning' ? 'group-hover:text-amber-600 dark:group-hover:text-amber-400' :
    'group-hover:text-rose-600 dark:group-hover:text-rose-400';

  return (
    <Card className={cn(
      "h-full overflow-hidden relative group hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 border border-border/50 hover:border-border/80 rounded-3xl bg-card/65 backdrop-blur-md",
      borderStyle
    )}>
      {/* Decorative colored glow on hover */}
      <div className={cn("absolute inset-0 opacity-[0.02] dark:opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-500", gradientClass)} />
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none" />
      
      <CardContent className="p-6 flex flex-col h-full relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "p-2.5 rounded-xl bg-muted/40 border border-border/30 transition-transform duration-500 group-hover:scale-105", 
            iconColorClass
          )}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
          <h4 className="text-xs font-extrabold text-muted-foreground/80 uppercase tracking-widest leading-none">{title}</h4>
        </div>
        <div className="flex-grow">
          {isNa ? (
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 mb-2 border-dashed text-muted-foreground border-border/80 bg-muted/10 rounded-lg">
              بيانات الأداء غير كافية حالياً
            </Badge>
          ) : (
            <div className={cn("text-lg font-black text-foreground mb-1 transition-colors line-clamp-1 tracking-tight", textGradient)}>
              {value}
            </div>
          )}
          <p className="text-xs text-muted-foreground/90 font-medium leading-relaxed">
            {detail}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [finance, setFinance] = useState(null);
  const [equipCount, setEquipCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [weatherSummary, setWeatherSummary] = useState(null);

  const isRTL = i18n.language === 'ar';
  const canViewFinance = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'].includes(user?.role);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const promises = [getEquipmentList(), getItems(), reportsApi.getSectors()];
      if (canViewFinance) promises.push(getFinancialSummary());
      promises.push(reportsApi.getDashboardAnalytics(), reportsApi.getSmartInsights());
      
      const results = await Promise.all(promises);
      
      setEquipCount(results[0]?.length ?? 0);
      setItemCount(results[1]?.length ?? 0);
      setSectors(results[2]?.data || []);
      
      const financeIndex = canViewFinance ? 3 : -1;
      const analyticsIndex = canViewFinance ? 4 : 3;
      const insightsIndex = canViewFinance ? 5 : 4;
      
      if (canViewFinance && results[financeIndex]) {
        setFinance(results[financeIndex]);
      }
      
      setAnalytics({
        ...(results[analyticsIndex]?.data || {}),
        insights: results[insightsIndex]?.data || { alerts: [], suggestions: [] },
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [canViewFinance]);

  if (loading) {
    return (
      <div className="w-full space-y-8 animate-pulse">
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-64 mx-auto rounded-lg" />
          <Skeleton className="h-6 w-48 mx-auto rounded-md" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={`stat-${i}`} className="h-32 w-full rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={`insight-${i}`} className="h-28 w-full rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={`mod-${i}`} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString(
    i18n.language === 'ar' ? 'ar-EG' : 'en-GB', 
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Parse insights metrics
  const bestProdName = analytics?.insights?.best_productivity?.operation__name || t('dashboard.na', 'غير متوفر');
  const bestProdVal = Number(analytics?.insights?.best_productivity?.productivity || 0).toFixed(1);

  const worstProdName = analytics?.insights?.worst_productivity?.operation__name || t('dashboard.na', 'غير متوفر');
  const worstProdVal = Number(analytics?.insights?.worst_productivity?.productivity || 0).toFixed(1);

  const maxCostName = analytics?.insights?.highest_cost_operation?.operation__name || t('dashboard.na', 'غير متوفر');
  const maxCostVal = Number(analytics?.insights?.highest_cost_operation?.total_cost || 0).toLocaleString();

  return (
    <div className="w-full max-w-full space-y-8">
      {/* Header section — Premium, Clean, Unified Layout */}
      <div 
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 backdrop-blur-xl p-5 md:p-6 shadow-sm"
      >
        {/* Accent decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse duration-5000" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-transparent opacity-85" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
          {/* Left Greeting & Context */}
          <div className="space-y-3 flex-grow">
            <div className="flex items-center gap-2">
              <span className="text-xl select-none">👋</span>
              <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                {t('dashboard.welcome', 'مرحبًا بعودتك')}، <span className="text-green-600 dark:text-green-400 font-extrabold">{user?.name?.split(' ')[0] || 'مدير النظام'}</span>
              </h1>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground/90 font-semibold max-w-xl leading-relaxed">
              {t('dashboard.overview', 'ملخص العمليات الزراعية، التحليلات، ومؤشرات الأداء لهذا اليوم.')}
            </p>
            
            {/* Meta badges & Macro KPIs */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="bg-muted/40 border border-border/40 text-[11px] text-muted-foreground font-bold px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1.5 select-none">
                <Calendar className="w-3.5 h-3.5 text-green-600" />
                <span>{todayStr}</span>
              </span>
              <span className="bg-muted/40 border border-border/40 text-[11px] text-muted-foreground font-bold px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1.5 select-none">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('dashboard.season_active', 'الموسم الزراعي 2026')}</span>
              </span>
              
              {canViewFinance && finance?.net && (
                <>
                  <div className="h-4 w-px bg-border/60 hidden sm:block mx-1"></div>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] gap-1.5 border border-emerald-500/20 py-1.5 px-3 rounded-xl shadow-sm hover:bg-emerald-500/20 transition-all select-none">
                    <DollarSign className="w-3 h-3" />
                    <span>${parseFloat(finance?.net).toLocaleString()}</span>
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Right Weather widget with premium frameless layout */}
          <div className="relative z-10 w-full lg:w-[320px] shrink-0">
            <WeatherWidget onWeatherUpdate={setWeatherSummary} />
          </div>
        </div>

        {/* Refresh button — top corner */}
        <button
          onClick={() => fetchDashboard()}
          className="absolute top-4 left-4 p-2 rounded-xl border border-border/60 bg-card hover:bg-muted/80 hover:shadow-sm transition-all flex items-center justify-center text-muted-foreground hover:text-green-600 cursor-pointer active:scale-95 z-20"
          title={t('dashboard.refresh', 'تحديث البيانات')}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Media Slider + Announcements directly after header ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MediaSlider />
        <AnnouncementsBoard />
      </div>

      {/* Smart Alerts and Suggestions Banner */}
      {(analytics?.insights?.alerts?.length > 0 || analytics?.insights?.suggestions?.length > 0) && (
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 via-card to-card/90 dark:from-green-500/10 shadow-md relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
          <CardHeader className="pb-3 flex flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm border border-white/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-extrabold text-foreground">
                {t('dashboard.smart_notifications', 'التنبيهات والمقترحات الذكية')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground/80 font-semibold">
                {t('dashboard.ai_insights_desc', 'نصائح وملاحظات تم توليدها تلقائيًا بناءً على الأداء الأخير')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Alerts */}
            {analytics?.insights?.alerts?.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {analytics.insights.alerts.map((alert, idx) => (
                  <Badge 
                    key={idx} 
                    variant="destructive" 
                    className="bg-red-50 text-red-700 border border-red-200/50 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-102"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{alert.message === "Low productivity detected." ? t('dashboard.alert_low_prod', 'تم رصد إنتاجية منخفضة في بعض العمليات') : alert.message === "High report cost detected." ? t('dashboard.alert_high_cost', 'تم رصد تكاليف تشغيلية مرتفعة مؤخرًا') : alert.message}</span>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Suggestions */}
            {analytics?.insights?.suggestions?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/40">
                {analytics.insights.suggestions.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-muted/20 dark:bg-muted/10 p-4 rounded-2xl border border-border/40 hover:border-green-500/20 transition-all duration-300 hover:shadow-md">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <p className="text-xs md:text-sm font-semibold text-muted-foreground/95 leading-relaxed">
                      {tip === "Reduce contractor workers by 20% for similar tasks." ? t('dashboard.suggest_reduce_workers', 'يُوصى بتقليل الاعتماد على العمالة الخارجية بنسبة 20% لتحسين الهامش الربحي.') : tip === "Benchmark top contractor performance weekly." ? t('dashboard.suggest_benchmark', 'يُوصى بتقييم ومقارنة أداء المقاولين بشكل أسبوعي لتحديد الأكفأ.') : tip}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Primary KPI Cards Row */}
      <div className={cn(
        "grid gap-6",
        canViewFinance ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
      )}>
        {canViewFinance && (
          <StatCard
            title={t('dashboard.net_margin', 'صافي الأرباح')}
            value={`$${parseFloat(finance?.net || 116200).toLocaleString()}`}
            unit={t('dashboard.usd', 'دولار')}
            icon={DollarSign}
            colorClass="text-green-600 dark:text-green-400"
            bgColorClass="bg-green-100 dark:bg-green-950/40"
            trend={t('dashboard.margin_trend', '+15% عن الشهر الماضي')}
            trendUp={true}
          />
        )}

        <StatCard
          title={t('dashboard.fleet_units', 'وحدات الأسطول النشطة')}
          value={equipCount}
          unit={t('dashboard.unit', 'وحدة')}
          icon={Tractor}
          colorClass="text-amber-600 dark:text-amber-400"
          bgColorClass="bg-amber-100 dark:bg-amber-950/40"
          trend={t('dashboard.same_last_month', 'استقرار التشغيل والصيانة')}
          trendUp={null}
        />

        <StatCard
          title={t('dashboard.avg_productivity', 'معدل الإنتاجية العام')}
          value={Number(analytics?.kpi?.avg_productivity || 36.6).toFixed(1)}
          unit={t('dashboard.type', 'كجم/عامل')}
          icon={Package}
          colorClass="text-blue-600 dark:text-blue-400"
          bgColorClass="bg-blue-100 dark:bg-blue-950/40"
          trend={t('dashboard.items_trend', 'تحليل الأداء اليومي')}
          trendUp={true}
        />
      </div>

      {/* Advanced Agricultural & Financial Smart Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightStatCard
          title={t('dashboard.best_productivity_operation', 'الأعلى كفاءة وإنتاجية')}
          value={bestProdName}
          detail={`${t('dashboard.avg_productivity_is', 'بمتوسط إنتاجية')} ${bestProdVal} ${t('dashboard.kg_per_worker', 'كجم لكل عامل في اليوم.')}`}
          icon={Leaf}
          gradientClass="from-green-500 to-emerald-500"
          iconColorClass="text-green-600 dark:text-green-400"
          themeType="success"
        />
        
        <InsightStatCard
          title={t('dashboard.highest_cost_operation', 'الأعلى تكلفة تشغيلية')}
          value={maxCostName}
          detail={`${t('dashboard.total_cost_reached', 'بإجمالي إنفاق')} $${maxCostVal} ${t('dashboard.labor_costs_only', 'للأجور والعمالة.')}`}
          icon={DollarSign}
          gradientClass="from-amber-500 to-yellow-500"
          iconColorClass="text-amber-600 dark:text-amber-400"
          themeType="warning"
        />

        <InsightStatCard
          title={t('dashboard.worst_productivity_operation', 'الأقل كفاءة وإنتاجية')}
          value={worstProdName}
          detail={`${t('dashboard.avg_productivity_is', 'بمتوسط إنتاجية')} ${worstProdVal} ${t('dashboard.kg_per_worker', 'كجم لكل عامل.')}`}
          icon={Activity}
          gradientClass="from-red-500 to-orange-500"
          iconColorClass="text-red-600 dark:text-red-400"
          themeType="danger"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-foreground tracking-tight">
          {t('dashboard.quick_navigation', 'الوصول السريع للأنظمة')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModuleCard
            isRTL={isRTL}
            title={t('sidebar.equipment', 'الأسطول والمعدات')}
            description={t('dashboard.module_desc_equipment', 'إدارة ومتابعة آليات المزرعة، حركات التشغيل، وتتبع الصيانة الدورية.')}
            icon={Tractor}
            colorClass="text-blue-600 dark:text-blue-400"
            bgColorClass="bg-blue-50 dark:bg-blue-950/20"
            path="/equipment"
            count={equipCount > 0 ? `${equipCount} ${t('dashboard.active_unit', 'وحدة نشطة')}` : t('dashboard.no_units', 'لا توجد وحدات')}
          />
          <ModuleCard
            isRTL={isRTL}
            title={t('sidebar.production', 'الإنتاج والمحصول')}
            description={t('dashboard.module_desc_production', 'تتبع الحصاد، عمليات الفرز، الجودة والكميات المستلمة في المستودعات.')}
            icon={Leaf}
            colorClass="text-green-600 dark:text-green-400"
            bgColorClass="bg-green-50 dark:bg-green-950/20"
            path="/production"
            count={t('dashboard.current_season', 'الموسم الحالي')}
          />
          <ModuleCard
            isRTL={isRTL}
            title={t('sidebar.reports', 'التقارير اليومية')}
            description={t('dashboard.module_desc_reports', 'توثيق الأنشطة اليومية، العمالة، نسب الإنجاز، وتقارير استهلاك المواد.')}
            icon={FileText}
            colorClass="text-amber-600 dark:text-amber-400"
            bgColorClass="bg-amber-50 dark:bg-amber-950/20"
            path="/reports"
            count={t('dashboard.last_updated_today', 'تحديث حي ومستمر')}
          />
        </div>
      </div>

      {/* End of Dashboard Content */}
    </div>
  );
};

export default Dashboard;
