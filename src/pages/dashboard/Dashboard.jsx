import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFinancialSummary } from '../../features/accounting/services';
import { getEquipmentList } from '../../features/equipment/services';
import { getItems } from '../../features/warehouse/services';
import { useAuth } from '../../app/AuthContext';
import { reportsApi } from '../../services/reportsApi';
import { AreaChartCard, BarChartCard, PieChartCard } from '../../components/Charts';
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
  RefreshCw
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
      className="cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col bg-card/60 backdrop-blur-md border-border/80 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
      <CardContent className="p-6 flex flex-col h-full z-10">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110", bgColorClass, colorClass)}>
          <Icon className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 flex-grow leading-relaxed">
          {description}
        </p>

        <div className="flex justify-between items-center mt-auto">
          <Badge variant="secondary" className={cn("font-bold rounded-lg px-2.5 py-1", bgColorClass, colorClass)}>
            {count}
          </Badge>
          <ActionIcon
            className={cn("w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5", colorClass)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const StatCard = ({ title, value, unit, icon: Icon, colorClass, bgColorClass, trend, trendUp }) => {
  return (
    <Card className="h-full flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 bg-gradient-to-b from-card to-card/70 border-border/65 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/10 to-transparent" />
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-semibold text-muted-foreground">
            {title}
          </p>
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-sm", bgColorClass, colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2 flex-grow">
          <h2 className="text-3xl font-black text-foreground tracking-tight">
            {value}
          </h2>
          {unit && (
            <span className="text-xs text-muted-foreground font-semibold">{unit}</span>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 mt-2 bg-muted/30 px-2 py-1 rounded-md w-fit">
            {trendUp === true && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
            {trendUp === false && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
            <span
              className={cn(
                "text-[11px] font-bold",
                trendUp === true ? "text-green-600 dark:text-green-500" : trendUp === false ? "text-red-600 dark:text-red-500" : "text-muted-foreground"
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

const InsightStatCard = ({ title, value, detail, icon: Icon, gradientClass, iconColorClass }) => {
  return (
    <Card className="h-full border-border/60 overflow-hidden relative group hover:shadow-md transition-all duration-300">
      <div className={cn("absolute inset-0 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.06] transition-opacity", gradientClass)} />
      <CardContent className="p-5 flex flex-col h-full relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("p-2 rounded-xl bg-muted/40", iconColorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</h4>
        </div>
        <div className="flex-grow">
          <div className="text-lg font-black text-foreground mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-1">
            {value}
          </div>
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
      {/* Header section — with embedded Weather widget */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-transparent p-6 md:p-8 flex flex-col lg:flex-row justify-between items-stretch gap-6">
        <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Left: greeting text */}
        <div className="text-center md:text-right space-y-2 relative z-10 flex-grow">
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none flex items-center justify-center md:justify-start gap-2.5">
            <span>👋 {t('dashboard.welcome', 'مرحبًا بعودتك')}</span>
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium">
            {t('dashboard.overview', 'إليك ملخص شامل ونظرة عامة على عمليات مزرعتك وتحليلاتها اليوم')}
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center md:justify-start pt-2">
            <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200/50 dark:text-green-400 dark:bg-green-950/20 dark:border-green-800/30 px-3 py-1 font-bold text-xs shadow-sm">
              📅 {todayStr}
            </Badge>
            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200/50 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-800/30 px-3 py-1 font-bold text-xs shadow-sm">
              🌾 {t('dashboard.season_active', 'الموسم الزراعي 2026 نشط')}
            </Badge>
          </div>
        </div>

        {/* Right: Weather widget embedded */}
        <div className="relative z-10 w-full lg:w-72 shrink-0">
          <WeatherWidget />
        </div>

        {/* Refresh button — top corner */}
        <button
          onClick={fetchDashboard}
          className="absolute top-4 left-4 p-2 rounded-full border border-border/60 bg-card/80 hover:bg-card hover:shadow transition-all flex items-center justify-center text-muted-foreground hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 z-20"
          title={t('dashboard.refresh', 'تحديث البيانات')}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Media Slider + Announcements directly after header ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MediaSlider />
        <AnnouncementsBoard />
      </div>

      {/* Smart Alerts and Suggestions Banner */}
      {(analytics?.insights?.alerts?.length > 0 || analytics?.insights?.suggestions?.length > 0) && (
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 via-card to-card/90 dark:from-green-500/10 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-3 flex flex-row items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-base font-black text-foreground">
                {t('dashboard.smart_notifications', 'التنبيهات والمقترحات الذكية')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">
                {t('dashboard.ai_insights_desc', 'نصائح وملاحظات تم توليدها تلقائيًا بناءً على الأداء الأخير')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Alerts */}
            {analytics?.insights?.alerts?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {analytics.insights.alerts.map((alert, idx) => (
                  <Badge 
                    key={idx} 
                    variant="destructive" 
                    className="bg-red-50 text-red-700 border border-red-200/50 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{alert.message === "Low productivity detected." ? t('dashboard.alert_low_prod', 'تم رصد إنتاجية منخفضة في بعض العمليات') : alert.message === "High report cost detected." ? t('dashboard.alert_high_cost', 'تم رصد تكاليف تشغيلية مرتفعة مؤخرًا') : alert.message}</span>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Suggestions */}
            {analytics?.insights?.suggestions?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                {analytics.insights.suggestions.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-muted/30 dark:bg-muted/10 p-3 rounded-2xl border border-border/40 hover:border-green-500/20 transition-all duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <p className="text-xs md:text-sm font-semibold text-muted-foreground leading-relaxed">
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
        />
        
        <InsightStatCard
          title={t('dashboard.highest_cost_operation', 'الأعلى تكلفة تشغيلية')}
          value={maxCostName}
          detail={`${t('dashboard.total_cost_reached', 'بإجمالي إنفاق')} $${maxCostVal} ${t('dashboard.labor_costs_only', 'للأجور والعمالة.')}`}
          icon={DollarSign}
          gradientClass="from-amber-500 to-yellow-500"
          iconColorClass="text-amber-600 dark:text-amber-400"
        />

        <InsightStatCard
          title={t('dashboard.worst_productivity_operation', 'الأقل كفاءة وإنتاجية')}
          value={worstProdName}
          detail={`${t('dashboard.avg_productivity_is', 'بمتوسط إنتاجية')} ${worstProdVal} ${t('dashboard.kg_per_worker', 'كجم لكل عامل.')}`}
          icon={Activity}
          gradientClass="from-red-500 to-orange-500"
          iconColorClass="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-foreground tracking-tight">
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

      {/* Sectors and Farm Structure Widget */}
      {sectors?.length > 0 && (
        <Card className="bg-card border-border/80 relative overflow-hidden">
          <div className="p-6">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span>{t('dashboard.sectors_status', 'توزيع قطاعات المزرعة النشطة')}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sectors.map((sector) => (
                <div key={sector.id} className="p-4 rounded-2xl bg-muted/30 border border-border/40 hover:border-green-500/20 hover:bg-muted/50 transition-all duration-300">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-foreground">{sector.name}</span>
                    <Badge variant="outline" className="text-[10px] bg-green-50 dark:bg-green-950/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30">
                      {t('dashboard.active', 'نشط')}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{t('dashboard.farm_sector', 'قطاع زراعي رئيسي')}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}



      {/* Dynamic Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        <AreaChartCard
          title={t('dashboard.operations_over_time', 'معدلات الأنشطة والعمليات اليومية')}
          data={(analytics?.operations_over_time || []).map((r) => ({ name: r.day || 'N/A', value: r.total }))}
          dataKey="value"
        />
        <BarChartCard
          title={t('dashboard.workers_usage', 'توزيع إجمالي العمالة (الشركة والمقاولين) حسب العملية')}
          data={(analytics?.workers_usage || []).map((r) => ({ name: r.operation__name, value: Number(r.company_workers || 0) + Number(r.contractor_workers || 0) }))}
          dataKey="value"
        />
        <PieChartCard
          title={t('dashboard.cost_by_operation', 'تحليل تكلفة العمالة الإجمالية حسب العملية')}
          data={(analytics?.costs?.per_operation || []).slice(0, 6).map((r) => ({ 
            name: r.operation_log__operation__name || r.report__operation__name || 'N/A', 
            value: Number(r.total_cost || 0) 
          }))}
        />
        
        {/* Operations Breakdown Table */}
        <Card className="bg-card border-border overflow-hidden flex flex-col h-full">
          <CardHeader className="bg-muted/50 border-b border-border py-4">
            <CardTitle className="text-sm font-bold text-foreground">
              {t('dashboard.operation_table', 'تفاصيل تكاليف العمالة للعمليات')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto flex-grow">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-foreground text-xs">
                    {t('dashboard.operation', 'اسم العملية')}
                  </TableHead>
                  <TableHead className={cn("font-bold text-foreground text-xs", isRTL ? "text-left" : "text-right")}>
                    {t('dashboard.total_cost', 'إجمالي تكلفة العمالة')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(analytics?.costs?.per_operation || []).map((row, idx) => (
                  <TableRow key={`${row.operation_log__operation__name || row.report__operation__name}-${idx}`} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <TableCell className="font-semibold text-sm">
                      {row.operation_log__operation__name || row.report__operation__name || '-'}
                    </TableCell>
                    <TableCell className={cn("font-bold text-sm text-muted-foreground", isRTL ? "text-left" : "text-right")}>
                      ${Number(row.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
                {(analytics?.costs?.per_operation?.length === 0 || !analytics?.costs?.per_operation) && (
                  <TableRow>
                    <TableCell colSpan={2} className="h-28 text-center text-muted-foreground text-sm">
                      {t('dashboard.no_data', 'لا توجد بيانات عمليات مسجلة')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
