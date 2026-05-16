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
import {
  DollarSign,
  Tractor,
  Package,
  Leaf,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft
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
      className="cursor-pointer group hover:shadow-md hover:-translate-y-1 transition-all duration-200 h-full flex flex-col bg-card border-border"
    >
      <CardContent className="p-6 flex flex-col h-full">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", bgColorClass, colorClass)}>
          <Icon className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-foreground mb-1">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 flex-grow">
          {description}
        </p>

        <div className="flex justify-between items-center mt-auto">
          <Badge variant="secondary" className={cn("font-semibold rounded-md", bgColorClass, colorClass)}>
            {count}
          </Badge>
          <ActionIcon
            className={cn("w-5 h-5 transition-transform duration-200 group-hover:translate-x-1", colorClass)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const StatCard = ({ title, value, unit, icon: Icon, colorClass, bgColorClass, trend, trendUp }) => {
  return (
    <Card className="h-full flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200 bg-card border-border">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-bold text-muted-foreground">
            {title}
          </p>
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", bgColorClass, colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2 flex-grow">
          <h2 className="text-3xl font-extrabold text-foreground">
            {value}
          </h2>
          {unit && (
            <span className="text-sm text-muted-foreground font-medium">{unit}</span>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            {trendUp === true && <TrendingUp className="w-4 h-4 text-green-500" />}
            {trendUp === false && <TrendingDown className="w-4 h-4 text-red-500" />}
            <span
              className={cn(
                "text-xs font-bold",
                trendUp === true ? "text-green-600 dark:text-green-500" : trendUp === false ? "text-red-600 dark:text-red-500" : "text-gray-500"
              )}
            >
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [finance, setFinance] = useState(null);
  const [equipCount, setEquipCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const isRTL = i18n.language === 'ar';
  const canViewFinance = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'].includes(user?.role);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const promises = [getEquipmentList(), getItems()];
        if (canViewFinance) promises.push(getFinancialSummary());
        promises.push(reportsApi.getDashboardAnalytics(), reportsApi.getSmartInsights());
        const results = await Promise.all(promises);
        setEquipCount(results[0]?.length ?? 0);
        setItemCount(results[1]?.length ?? 0);
        if (canViewFinance) setFinance(results[2]);
        setAnalytics({
          ...(results[canViewFinance ? 3 : 2]?.data || {}),
          insights: results[canViewFinance ? 4 : 3]?.data || { alerts: [], suggestions: [] },
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [canViewFinance]);

  if (loading) {
    return (
      <div className="w-full space-y-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={`stat-${i}`} className="h-40 w-full rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={`mod-${i}`} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString(
    i18n.language === 'ar' ? 'ar-DZ' : 'en-GB', 
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="w-full max-w-full space-y-8">
      {/* Greeting */}
      <div className="flex flex-col items-center text-center space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          👋 {t('dashboard.welcome', 'مرحبًا بعودتك')}، <span className="text-green-600 dark:text-green-500">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-base text-muted-foreground font-medium">
          {t('dashboard.overview', 'إليك نظرة عامة على عمليات مزرعتك اليوم')}
        </p>
        <Badge variant="secondary" className="mt-4 text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30 px-3 py-1 font-bold text-xs">
          📅 {todayStr}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className={cn(
        "grid gap-6",
        canViewFinance ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
      )}>
        {canViewFinance && (
          <StatCard
            title={t('dashboard.net_margin', 'صافي الأرباح')}
            value={`$${parseFloat(finance?.net || 0).toLocaleString()}`}
            unit=""
            icon={TrendingUp}
            colorClass="text-green-600 dark:text-green-500"
            bgColorClass="bg-green-100 dark:bg-green-900/30"
            trend={t('dashboard.margin_trend', '+15% عن الشهر الماضي')}
            trendUp={true}
          />
        )}

        <StatCard
          title={t('dashboard.fleet_units', 'وحدات الأسطول النشطة')}
          value={equipCount}
          unit={t('dashboard.unit', 'وحدة')}
          icon={Tractor}
          colorClass="text-amber-500 dark:text-amber-400"
          bgColorClass="bg-amber-100 dark:bg-amber-900/30"
          trend={t('dashboard.same_last_month', 'نفس الشهر الماضي')}
          trendUp={null}
        />

        <StatCard
          title={t('dashboard.warehouse_items', 'الإنتاجية')}
          value={Number(analytics?.kpi?.avg_productivity || 0).toFixed(2)}
          unit={t('dashboard.type', 'وحدة/عامل')}
          icon={Package}
          colorClass="text-blue-500 dark:text-blue-400"
          bgColorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={t('dashboard.items_trend', 'تحليل لحظي')}
          trendUp={true}
        />
      </div>

      {/* Quick Actions (Module Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ModuleCard
          isRTL={isRTL}
          title={t('sidebar.equipment', 'الأسطول والمعدات')}
          description={t('dashboard.module_desc_equipment', 'إدارة آليات المزرعة والمعدات الزراعية')}
          icon={Tractor}
          colorClass="text-blue-500 dark:text-blue-400"
          bgColorClass="bg-blue-100 dark:bg-blue-900/30"
          path="/equipment"
          count={equipCount > 0 ? `${equipCount} ${t('dashboard.active_unit', 'وحدة نشطة')}` : t('dashboard.no_units', 'لا توجد وحدات')}
        />
        <ModuleCard
          isRTL={isRTL}
          title={t('sidebar.production', 'الإنتاج والمحصول')}
          description={t('dashboard.module_desc_production', 'تتبع الإنتاج الزراعي الموسمي')}
          icon={Leaf}
          colorClass="text-green-600 dark:text-green-500"
          bgColorClass="bg-green-100 dark:bg-green-900/30"
          path="/production"
          count={t('dashboard.current_season', 'الموسم الحالي')}
        />
        <ModuleCard
          isRTL={isRTL}
          title={t('sidebar.reports', 'التقارير اليومية')}
          description={t('dashboard.module_desc_reports', 'ملخصات يومية وتقارير العمليات')}
          icon={FileText}
          colorClass="text-amber-500 dark:text-amber-400"
          bgColorClass="bg-amber-100 dark:bg-amber-900/30"
          path="/reports"
          count={t('dashboard.last_updated_today', 'آخر تحديث: اليوم')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        <AreaChartCard
          title={t('dashboard.operations_over_time', 'العمليات عبر الزمن')}
          data={(analytics?.operations_over_time || []).map((r) => ({ name: r.day, value: r.total }))}
          dataKey="value"
        />
        <BarChartCard
          title={t('dashboard.workers_usage', 'استخدام العمالة')}
          data={(analytics?.workers_usage || []).map((r) => ({ name: r.operation__name, value: Number(r.company_workers || 0) + Number(r.contractor_workers || 0) }))}
          dataKey="value"
        />
        <PieChartCard
          title={t('dashboard.cost_by_operation', 'تحليل التكلفة حسب العملية')}
          data={(analytics?.costs?.per_operation || []).slice(0, 6).map((r) => ({ name: r.report__operation__name || 'N/A', value: Number(r.total_cost || 0) }))}
        />
        
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              {t('dashboard.smart_alerts', 'تنبيهات ومقترحات ذكية')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(analytics?.insights?.alerts || []).map((alert, idx) => (
                <Badge key={idx} variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200">
                  {alert.message}
                </Badge>
              ))}
            </div>
            <div className="space-y-2 mt-4">
              {(analytics?.insights?.suggestions || []).map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="bg-card border-border overflow-hidden mt-6">
        <CardHeader className="bg-muted border-b border-border">
          <CardTitle className="text-lg font-bold text-foreground">
            {t('dashboard.operation_table', 'جدول العمليات')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-foreground bg-muted">
                  {t('dashboard.operation', 'العملية')}
                </TableHead>
                <TableHead className={cn("font-bold text-foreground bg-muted", isRTL ? "text-left" : "text-right")}>
                  {t('dashboard.total_cost', 'إجمالي التكلفة')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(analytics?.costs?.per_operation || []).map((row, idx) => (
                <TableRow key={`${row.report__operation__name}-${idx}`} className="border-b border-border hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {row.report__operation__name || '-'}
                  </TableCell>
                  <TableCell className={cn("font-semibold text-muted-foreground", isRTL ? "text-left" : "text-right")}>
                    {Number(row.total_cost || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {(analytics?.costs?.per_operation?.length === 0 || !analytics?.costs?.per_operation) && (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    لا توجد بيانات متاحة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
