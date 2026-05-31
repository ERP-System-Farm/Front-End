import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFinancialSummary } from '../../features/accounting/services';
import { getEquipmentList, getPendingAlerts } from '../../features/equipment/services';
import { getItems, getMovements } from '../../features/warehouse/services';
import { getHarvestReports, getSortingReports } from '../../features/production/services';
import { exportToExcel, exportToCSV } from '../../utils/export';
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
  Calendar,
  Search,
  History,
  Clock,
  CheckCircle,
  User,
  Wrench,
  X,
  Download,
  Filter
} from 'lucide-react';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.locale('ar');

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";

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
  const navigate = useNavigate();
  const [finance, setFinance] = useState(null);
  const [equipCount, setEquipCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [weatherSummary, setWeatherSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  // Advanced filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    engineer: 'all',
    location: 'all',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

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

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError(null);

      // Fetch only recent records from each source (latest 10 records per module)
      const params = { page: 1, page_size: 10 };

      const [
        tasksRes,
        irrigationsRes,
        pestControlsRes,
        harvestsRes,
        sortingsRes,
        movementsRes,
        alertsRes,
        equipmentRes
      ] = await Promise.allSettled([
        reportsApi.getTasks(params),
        reportsApi.getIrrigations(params),
        reportsApi.getPestControls(params),
        getHarvestReports(params),
        getSortingReports(params),
        getMovements(),
        getPendingAlerts(),
        getEquipmentList()
      ]);

      const getResults = (res) => {
        if (res.status === 'rejected') return [];
        const val = res.value;
        const data = val?.data || val;
        return data?.results || (Array.isArray(data) ? data : []);
      };

      const tasks = getResults(tasksRes);
      const irrigations = getResults(irrigationsRes);
      const pestControls = getResults(pestControlsRes);
      const harvests = getResults(harvestsRes);
      const sortings = getResults(sortingsRes);
      const movements = getResults(movementsRes).slice(0, 10);
      const alerts = getResults(alertsRes).slice(0, 10);
      const equipments = getResults(equipmentRes).slice(0, 10);

      // Normalizer maps structured data directly from the respective sources
      const normalizedTasks = tasks.map(t => ({
        id: `task-${t.id}`,
        original_id: t.id,
        type: 'daily_task',
        typeLabel: isRTL ? 'تقرير يومي' : 'Daily Report',
        name: t.operation_summary || t.operation_name || (isRTL ? `تقرير مهام يومي #${t.id}` : `Daily Task Report #${t.id}`),
        location: t.location_path || t.enclosure_name || 'N/A',
        engineer: t.engineer_name || 'N/A',
        date: t.report_date || t.created_at?.split('T')?.[0] || '',
        time: t.created_at ? dayjs(t.created_at).format('hh:mm A') : '',
        timestamp: t.created_at || t.report_date,
        status: t.status === 'approved' ? 'approved' : (t.status === 'draft' ? 'draft' : 'submitted'),
        raw_data: t
      }));

      const normalizedIrrigations = irrigations.map(ir => ({
        id: `irrig-${ir.id}`,
        original_id: ir.id,
        type: 'irrigation',
        typeLabel: isRTL ? 'ري وتسميد' : 'Irrigation',
        name: isRTL
          ? `عملية ري ${ir.is_fertilized ? '(مع التسميد)' : '(بدون تسميد)'}`
          : `Irrigation Operation ${ir.is_fertilized ? '(with Fertilization)' : '(no Fertilization)'}`,
        location: ir.details?.[0]?.phase_name || 'N/A',
        engineer: ir.engineer_name || 'N/A',
        date: ir.date || '',
        time: ir.created_at ? dayjs(ir.created_at).format('hh:mm A') : '',
        timestamp: ir.date || ir.created_at,
        status: 'approved',
        raw_data: ir
      }));

      const normalizedPestControls = pestControls.map(pc => ({
        id: `pest-${pc.id}`,
        original_id: pc.id,
        type: 'pest_control',
        typeLabel: isRTL ? 'مكافحة الآفات' : 'Pest Control',
        name: isRTL
          ? `عملية مكافحة وقائية ${pc.pesticide_item_name ? `(${pc.pesticide_item_name})` : pc.custom_pesticide_name ? `(${pc.custom_pesticide_name})` : ''}`
          : `Pest Control Treatment ${pc.pesticide_item_name ? `(${pc.pesticide_item_name})` : pc.custom_pesticide_name ? `(${pc.custom_pesticide_name})` : ''}`,
        location: pc.allocations?.map(a => a.enclosure_name).join(' + ') || 'N/A',
        engineer: pc.engineer_name || 'N/A',
        date: pc.date || '',
        time: pc.created_at ? dayjs(pc.created_at).format('hh:mm A') : '',
        timestamp: pc.date || pc.created_at,
        status: 'approved',
        raw_data: pc
      }));

      const normalizedHarvests = harvests.map(h => ({
        id: `harvest-${h.id}`,
        original_id: h.id,
        type: 'harvest',
        typeLabel: isRTL ? 'حصاد وفرز' : 'Productivity',
        name: isRTL
          ? `عملية حصاد: ${parseFloat(h.quantity).toLocaleString()} ${h.unit_name || h.unit_label_snapshot || ''}`
          : `Harvest Operation: ${parseFloat(h.quantity).toLocaleString()} ${h.unit_name || h.unit_label_snapshot || ''}`,
        location: h.location_name || 'N/A',
        engineer: h.supervisor_name || h.creator_name || 'N/A',
        date: h.harvest_date || '',
        time: h.created_at ? dayjs(h.created_at).format('hh:mm A') : '',
        timestamp: h.harvest_date || h.created_at,
        status: h.status === 'APPROVED' || h.status === 'FINALIZED' ? 'approved' : (h.status === 'DRAFT' ? 'draft' : 'submitted'),
        raw_data: h
      }));

      const normalizedSortings = sortings.map(s => ({
        id: `sorting-${s.id}`,
        original_id: s.id,
        type: 'sorting',
        typeLabel: isRTL ? 'حصاد وفرز' : 'Productivity',
        name: isRTL
          ? `عملية فرز وتعبئة: ${parseFloat(s.final_quantity).toLocaleString()}`
          : `Sorting & Packaging Operation: ${parseFloat(s.final_quantity).toLocaleString()}`,
        location: s.location_name || 'N/A',
        engineer: s.supervisor_name || 'N/A',
        date: s.processing_date || '',
        time: s.created_at ? dayjs(s.created_at).format('hh:mm A') : '',
        timestamp: s.processing_date || s.created_at,
        status: s.status === 'FINALIZED' ? 'approved' : (s.status === 'DRAFT' ? 'draft' : 'submitted'),
        raw_data: s
      }));

      const normalizedMovements = movements.map(m => {
        const getTypeName = (t) => {
          if (t === 'IN') return isRTL ? 'وارد مخزني' : 'Stock Addition';
          if (t === 'OUT') return isRTL ? 'صرف مخزني' : 'Stock Withdrawal';
          if (t === 'RETURNED') return isRTL ? 'مرتجع مخزني' : 'Stock Return';
          return isRTL ? 'تالف مخزني' : 'Stock Damage';
        };
        return {
          id: `move-${m.id}`,
          original_id: m.id,
          type: 'warehouse',
          typeLabel: isRTL ? 'حركة مخزنية' : 'Warehouse Movement',
          name: `${getTypeName(m.movement_type)} - ${m.item_name} (${parseFloat(m.quantity)} ${m.unit || 'وحدة'})`,
          location: m.location_name || m.other_location || (isRTL ? 'موقع خارجي / غير محدد' : 'External / Unspecified'),
          engineer: m.responsible_user_name || m.user_name || 'N/A',
          date: m.date || '',
          time: m.created_at ? dayjs(m.created_at).format('hh:mm A') : '',
          timestamp: m.date || m.created_at,
          status: 'approved',
          raw_data: m
        };
      });

      const normalizedAlerts = alerts.map(al => ({
        id: `alert-${al.id}`,
        original_id: al.id,
        type: 'equipment',
        typeLabel: isRTL ? 'حركة المعدات' : 'Equipment',
        name: isRTL ? `تنبيه صيانة وقائية: ${al.alert_message}` : `Preventive Maintenance: ${al.alert_message}`,
        location: al.equipment_name || 'N/A',
        engineer: 'N/A',
        date: al.created_at?.split('T')?.[0] || '',
        time: al.created_at ? dayjs(al.created_at).format('hh:mm A') : '',
        timestamp: al.created_at,
        status: al.is_resolved ? 'approved' : 'submitted',
        raw_data: al
      }));

      const normalizedEquipments = equipments.map(eq => ({
        id: `equip-${eq.id}`,
        original_id: eq.id,
        type: 'equipment',
        typeLabel: isRTL ? 'حركة المعدات' : 'Equipment',
        name: isRTL ? `تحديث حالة الآلية: ${eq.name} (${eq.equipment_type_display})` : `Fleet Status: ${eq.name} (${eq.equipment_type_display})`,
        location: eq.plate_number || 'N/A',
        engineer: 'N/A',
        date: eq.last_operation_date || eq.created_at?.split('T')?.[0] || '',
        time: '',
        timestamp: eq.last_operation_date || eq.created_at || '',
        status: eq.is_active ? 'approved' : 'draft',
        raw_data: eq
      }));

      const all = [
        ...normalizedTasks,
        ...normalizedIrrigations,
        ...normalizedPestControls,
        ...normalizedHarvests,
        ...normalizedSortings,
        ...normalizedMovements,
        ...normalizedAlerts,
        ...normalizedEquipments
      ].filter(a => a.timestamp);

      // Sort descending by date/time
      all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(all);
    } catch (err) {
      console.error("Error aggregating activities:", err);
      setActivitiesError(isRTL ? "فشل تحميل سجل الأنشطة الأخير" : "Failed to load recent activities");
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchActivities();
  }, [canViewFinance]);

  // Extract unique filters from the aggregated recent dataset
  const uniqueEngineers = useMemo(() => {
    const set = new Set();
    activities.forEach(a => {
      if (a.engineer && a.engineer !== 'N/A') set.add(a.engineer);
    });
    return ['all', ...Array.from(set)];
  }, [activities]);

  const uniqueLocations = useMemo(() => {
    const set = new Set();
    activities.forEach(a => {
      if (a.location && a.location !== 'N/A') set.add(a.location);
    });
    return ['all', ...Array.from(set)];
  }, [activities]);

  // Filter activities locally over the retrieved recent items
  const filteredActivities = useMemo(() => {
    return activities
      .filter(a => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.engineer.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          a.typeLabel.toLowerCase().includes(q) ||
          String(a.original_id).toLowerCase().includes(q)
        );
      })
      .filter(a => {
        if (filters.type === 'all') return true;
        if (filters.type === 'productivity') return a.type === 'harvest' || a.type === 'sorting';
        return a.type === filters.type;
      })
      .filter(a => {
        if (filters.status === 'all') return true;
        return a.status === filters.status;
      })
      .filter(a => {
        if (filters.engineer === 'all') return true;
        return a.engineer === filters.engineer;
      })
      .filter(a => {
        if (filters.location === 'all') return true;
        return a.location === filters.location;
      })
      .filter(a => {
        if (!filters.startDate) return true;
        return new Date(a.date) >= new Date(filters.startDate);
      })
      .filter(a => {
        if (!filters.endDate) return true;
        return new Date(a.date) <= new Date(filters.endDate);
      });
  }, [activities, searchQuery, filters]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage) || 1;
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredActivities.slice(start, start + itemsPerPage);
  }, [filteredActivities, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Export current filtered view
  const handleExport = (format) => {
    const exportData = filteredActivities.map((a, idx) => ({
      '#': idx + 1,
      [isRTL ? 'نوع النشاط' : 'Activity Type']: a.typeLabel,
      [isRTL ? 'اسم النشاط' : 'Activity Name']: a.name,
      [isRTL ? 'الموقع' : 'Site / Location']: a.location,
      [isRTL ? 'المسؤول' : 'Engineer / User']: a.engineer,
      [isRTL ? 'التاريخ' : 'Date']: a.date,
      [isRTL ? 'الوقت' : 'Time']: a.time,
      [isRTL ? 'الحالة' : 'Status']: a.status === 'approved' ? (isRTL ? 'معتمد' : 'Approved') : a.status === 'submitted' ? (isRTL ? 'تحت المراجعة' : 'Under Review') : (isRTL ? 'مسودة' : 'Draft')
    }));

    const filename = `activity_report_${dayjs().format('YYYY-MM-DD')}`;
    if (format === 'excel') {
      exportToExcel(exportData, filename, isRTL ? 'سجل الأنشطة' : 'Activity Log');
    } else {
      exportToCSV(exportData, filename);
    }
  };

  const getBadgeStyles = (type) => {
    switch (type) {
      case 'daily_task':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30';
      case 'irrigation':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30';
      case 'pest_control':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
      case 'harvest':
      case 'sorting':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'warehouse':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
      case 'equipment':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getBadgeIcon = (type) => {
    switch (type) {
      case 'daily_task':
        return FileText;
      case 'irrigation':
        return Leaf;
      case 'pest_control':
        return ShieldAlert;
      case 'harvest':
      case 'sorting':
        return Activity;
      case 'warehouse':
        return Package;
      case 'equipment':
        return Tractor;
      default:
        return FileText;
    }
  };

  const renderDetailView = (activity) => {
    const data = activity.raw_data;
    if (!data) return null;

    switch (activity.type) {
      case 'daily_task':
        return (
          <div className="space-y-6 text-sm font-semibold select-text">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'العملية' : 'Operation'}</span>
                <span className="text-foreground font-bold">{data.operation_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'الموقع' : 'Location'}</span>
                <span className="text-foreground font-bold">{data.location_path || data.location_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'المهندس' : 'Engineer'}</span>
                <span className="text-foreground font-bold">{data.engineer_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'تاريخ التقرير' : 'Report Date'}</span>
                <span className="text-foreground font-bold">{data.report_date || '—'}</span>
              </div>
            </div>

            {/* Labor section */}
            {data.labor_entries && data.labor_entries.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'كشف العمالة والتشغيل' : 'Labor & Operations'}</h4>
                <div className="overflow-x-auto border border-border/60 rounded-xl">
                  <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-bold border-b border-border/40">
                      <tr>
                        <th className="p-2.5">{isRTL ? 'الاسم / المقاول' : 'Name / Contractor'}</th>
                        <th className="p-2.5">{isRTL ? 'الساعات' : 'Hours'}</th>
                        <th className="p-2.5">{isRTL ? 'المعدل' : 'Rate'}</th>
                        <th className="p-2 text-left rtl:text-left">{isRTL ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {data.labor_entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-muted/10">
                          <td className="p-2.5 font-bold">{entry.worker_name || entry.contractor_name}</td>
                          <td className="p-2.5 font-mono">{entry.hours}س {entry.overtime > 0 && `(+${entry.overtime}إ)`}</td>
                          <td className="p-2.5 font-mono">${entry.worker_rate}</td>
                          <td className="p-2.5 font-mono font-bold text-left rtl:text-left">${((entry.hours + entry.overtime) * entry.worker_rate).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Productivity / logs section */}
            {data.operation_logs && data.operation_logs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'سجلات الإنتاجية والتفاصيل الميدانية' : 'Productivity Logs'}</h4>
                <div className="space-y-2">
                  {data.operation_logs.map((log, idx) => (
                    <div key={log.id || idx} className="p-3 border border-border/40 bg-muted/20 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">{log.operation_name}</span>
                        <span className="text-emerald-600 dark:text-emerald-450">{log.actual_productivity} {log.unit_name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4">
                        <span>{isRTL ? `الصنف: ${log.variety_name || '—'}` : `Variety: ${log.variety_name || '—'}`}</span>
                        <span>{isRTL ? `الموقع: ${log.location_path || '—'}` : `Location: ${log.location_path || '—'}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'المرفقات' : 'Attachments'}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {data.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.file || file.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 border border-border/50 hover:bg-muted/40 rounded-xl flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 truncate"
                    >
                      <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{file.file_name || (isRTL ? 'مرفق تشغيلي' : 'Attachment')}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'irrigation':
        return (
          <div className="space-y-6 text-sm font-semibold select-text">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'التاريخ' : 'Date'}</span>
                <span className="text-foreground font-bold">{data.date || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'المهندس' : 'Engineer'}</span>
                <span className="text-foreground font-bold">{data.engineer_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'المقاول' : 'Contractor'}</span>
                <span className="text-foreground font-bold">{data.contractor_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'نوع التسميد' : 'Fertilization'}</span>
                <span className="text-foreground font-bold">
                  {data.is_fertilized ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400">
                      {isRTL ? 'نعم (مع التسميد)' : 'Yes (with Fertilizer)'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      {isRTL ? 'بدون تسميد' : 'No Fertilizer'}
                    </Badge>
                  )}
                </span>
              </div>
            </div>

            {/* Details Phases */}
            {data.details && data.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'المراحل والمواقع المشمولة' : 'Irrigation Phases & Locations'}</h4>
                <div className="space-y-3">
                  {data.details.map((detail, idx) => (
                    <div key={detail.id || idx} className="p-4 border border-border/40 bg-muted/20 rounded-xl space-y-2.5">
                      <div className="flex justify-between font-bold items-center">
                        <span className="text-foreground text-xs font-black">{isRTL ? `المرحلة ${idx + 1}: ${detail.phase_name}` : `Phase ${idx + 1}: ${detail.phase_name}`}</span>
                        <span className="text-teal-600 dark:text-teal-400 font-mono text-xs">
                          {detail.water_amount} {isRTL ? 'متر مكعب' : 'm³'} ({detail.hours}س)
                        </span>
                      </div>
                      {/* Fertilizers in this detail */}
                      {detail.fertilizers && detail.fertilizers.length > 0 && (
                        <div className="pt-2 border-t border-border/30 space-y-1">
                          <span className="text-[10px] text-muted-foreground font-black block uppercase">{isRTL ? 'الأسمدة المضافة' : 'Applied Fertilizers'}</span>
                          <div className="grid grid-cols-2 gap-2">
                            {detail.fertilizers.map((fert, fidx) => (
                              <div key={fert.id || fidx} className="flex justify-between items-center text-xs bg-card border border-border/30 px-2 py-1 rounded-lg">
                                <span className="text-foreground font-bold">{fert.fertilizer_item_name}</span>
                                <span className="text-purple-600 dark:text-purple-400 font-mono">{fert.quantity} {fert.unit || (isRTL ? 'كجم' : 'kg')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.notes && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block">{isRTL ? 'ملاحظات' : 'Notes'}</span>
                <p className="p-3 border border-border/40 bg-muted/10 rounded-xl text-foreground italic whitespace-pre-wrap">"{data.notes}"</p>
              </div>
            )}
          </div>
        );

      case 'pest_control':
        return (
          <div className="space-y-6 text-sm font-semibold select-text">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'نوع العلاج / المكافحة' : 'Treatment Type'}</span>
                <span className="text-foreground font-bold">{isRTL ? 'مكافحة آفات زراعية' : 'Pest Control Treatment'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'تاريخ العملية' : 'Date'}</span>
                <span className="text-foreground font-bold">{data.date || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'مادة المكافحة (المبيد)' : 'Material (Pesticide)'}</span>
                <span className="text-foreground font-bold">{data.pesticide_item_name || data.custom_pesticide_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'الكمية المستخدمة' : 'Quantity Used'}</span>
                <span className="text-foreground font-bold">{parseFloat(data.quantity || 0)} {isRTL ? 'لتر/كجم' : 'L/kg'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'المهندس المسؤول' : 'Responsible Engineer'}</span>
                <span className="text-foreground font-bold">{data.engineer_name || '—'}</span>
              </div>
            </div>

            {/* Allocations */}
            {data.allocations && data.allocations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'مواقع الرش والتوزيع' : 'Spraying Locations (Allocations)'}</h4>
                <div className="flex flex-wrap gap-2">
                  {data.allocations.map((alloc, idx) => (
                    <Badge key={alloc.id || idx} variant="outline" className="py-1 px-3 bg-muted/40">
                      <MapPin className="w-3.5 h-3.5 text-red-500 mr-1.5 ml-1" />
                      <span>{alloc.enclosure_name}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.notes && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block">{isRTL ? 'ملاحظات' : 'Notes'}</span>
                <p className="p-3 border border-border/40 bg-muted/10 rounded-xl text-foreground italic whitespace-pre-wrap">"{data.notes}"</p>
              </div>
            )}
          </div>
        );

      case 'harvest':
      case 'sorting':
        const isHarvest = activity.type === 'harvest';
        return (
          <div className="space-y-6 text-sm font-semibold select-text">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'نوع العملية' : 'Operation Type'}</span>
                <span className="text-foreground font-bold">{isHarvest ? (isRTL ? 'حصاد محصول' : 'Harvesting') : (isRTL ? 'فرز وتعبئة' : 'Sorting & Packaging')}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'التاريخ' : 'Date'}</span>
                <span className="text-foreground font-bold">{isHarvest ? (data.harvest_date || '—') : (data.processing_date || '—')}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'الموقع' : 'Location'}</span>
                <span className="text-foreground font-bold">{data.location_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'المسؤول / المشرف' : 'Supervisor'}</span>
                <span className="text-foreground font-bold">{data.supervisor_name || '—'}</span>
              </div>
              {isHarvest ? (
                <>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'الصنف' : 'Variety'}</span>
                    <span className="text-foreground font-bold">{data.variety_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'الكمية المحصودة' : 'Harvested Quantity'}</span>
                    <span className="text-emerald-600 dark:text-emerald-450 font-bold">{parseFloat(data.quantity || 0)} {data.unit_name || ''}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'الكمية الواردة' : 'Incoming Quantity'}</span>
                    <span className="text-foreground font-bold">{parseFloat(data.incoming_quantity || 0)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'الكمية المقبولة (الصالح)' : 'Accepted Quantity'}</span>
                    <span className="text-emerald-600 dark:text-emerald-450 font-bold">{parseFloat(data.final_quantity || 0)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'الكمية المرفوضة' : 'Rejected Quantity'}</span>
                    <span className="text-red-500 font-bold">{parseFloat(data.rejected_quantity || 0)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'هالك / فاقد' : 'Waste Quantity'}</span>
                    <span className="text-amber-500 font-bold">{parseFloat(data.waste_quantity || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Labor Entries detail (for harvest) */}
            {isHarvest && data.labor_entries_detail && data.labor_entries_detail.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'كشف حضور العمالة' : 'Labor Details'}</h4>
                <div className="overflow-x-auto border border-border/60 rounded-xl">
                  <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-bold border-b border-border/40">
                      <tr>
                        <th className="p-2">{isRTL ? 'العامل' : 'Worker'}</th>
                        <th className="p-2">{isRTL ? 'الساعات' : 'Hours'}</th>
                        <th className="p-2">{isRTL ? 'المعدل' : 'Rate'}</th>
                        <th className="p-2 text-left rtl:text-left">{isRTL ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {data.labor_entries_detail.map((entry) => (
                        <tr key={entry.id}>
                          <td className="p-2 font-bold">{entry.worker_name}</td>
                          <td className="p-2 font-mono">{entry.hours}س {entry.overtime > 0 && `(+${entry.overtime}إ)`}</td>
                          <td className="p-2 font-mono">${entry.worker_rate}</td>
                          <td className="p-2 font-mono font-bold text-left rtl:text-left">${((entry.hours + entry.overtime) * entry.worker_rate).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {data.notes && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block">{isRTL ? 'ملاحظات' : 'Notes'}</span>
                <p className="p-3 border border-border/40 bg-muted/10 rounded-xl text-foreground italic whitespace-pre-wrap">"{data.notes}"</p>
              </div>
            )}
          </div>
        );

      case 'warehouse':
        const getMovementLabel = (type) => {
          if (type === 'IN') return isRTL ? 'توريد / إضافة مخزنية' : 'Stock Addition';
          if (type === 'OUT') return isRTL ? 'صرف مخزني' : 'Stock Withdrawal';
          if (type === 'RETURNED') return isRTL ? 'مرتجع مخزني' : 'Stock Return';
          return isRTL ? 'تالف مخزني' : 'Stock Damage';
        };
        return (
          <div className="space-y-6 text-sm font-semibold select-text">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'نوع الحركة' : 'Movement Type'}</span>
                <span className="text-foreground font-bold">
                  <Badge variant="outline" className={cn(
                    "py-0.5 px-2 rounded-lg text-xs font-bold",
                    data.movement_type === 'IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450' :
                      data.movement_type === 'OUT' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400'
                  )}>
                    {getMovementLabel(data.movement_type)}
                  </Badge>
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'الصنف المخزني' : 'Item Name'}</span>
                <span className="text-foreground font-bold">{data.item_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'الكمية' : 'Quantity'}</span>
                <span className="text-foreground font-bold font-mono">{parseFloat(data.quantity || 0)} {data.unit || 'وحدة'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'المستودع الرئيسي' : 'Default Warehouse'}</span>
                <span className="text-foreground font-bold">{data.location_name || data.other_location || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'مدخل البيانات / أمين المستودع' : 'Data Operator'}</span>
                <span className="text-foreground font-bold">{data.responsible_user_name || data.user_name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'تاريخ الحركة' : 'Movement Date'}</span>
                <span className="text-foreground font-bold">{data.date || '—'}</span>
              </div>
            </div>

            {data.notes && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block">{isRTL ? 'ملاحظات وحالة الفحص' : 'Notes & Remarks'}</span>
                <p className="p-3 border border-border/40 bg-muted/10 rounded-xl text-foreground italic whitespace-pre-wrap">"{data.notes}"</p>
              </div>
            )}
          </div>
        );

      case 'equipment':
        const isAlert = activity.id.startsWith('alert-');
        return (
          <div className="space-y-6 text-sm font-semibold select-text">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'الآلية / المعدة' : 'Equipment'}</span>
                <span className="text-foreground font-bold">{isAlert ? (data.equipment_name || '—') : (data.name || '—')}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{isRTL ? 'النوع الفني' : 'Equipment Type'}</span>
                <span className="text-foreground font-bold">{isAlert ? (isRTL ? 'تنبيه صيانة وقائية' : 'Maintenance Alert') : (data.equipment_type_display || '—')}</span>
              </div>
              {isAlert ? (
                <>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'رسالة التنبيه / الصيانة المطلوبة' : 'Alert Message / Action'}</span>
                    <span className="text-red-600 dark:text-red-400 font-bold block bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 rounded-xl mt-1">{data.alert_message}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'تاريخ رصد التنبيه' : 'Alert Date'}</span>
                    <span className="text-foreground font-bold">{data.created_at?.split('T')?.[0]}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'حالة التنبيه' : 'Alert Status'}</span>
                    <span className="text-foreground font-bold">
                      {data.is_resolved ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {isRTL ? 'تم الحل والاعتماد' : 'Resolved'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 ring-4 ring-amber-500/10">
                          {isRTL ? 'قيد الانتظار' : 'Pending Action'}
                        </Badge>
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'اللوحة / الرقم التسلسلي' : 'Plates / Serial'}</span>
                    <span className="text-foreground font-bold">{data.plate_number || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'متر التشغيل الحالي' : 'Current Meter (km/h)'}</span>
                    <span className="text-foreground font-bold font-mono">{parseFloat(data.current_meter || 0).toLocaleString()} {data.meter_type || ''}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'تاريخ آخر تشغيل' : 'Last Operation Date'}</span>
                    <span className="text-foreground font-bold">{data.last_operation_date || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{isRTL ? 'حالة المعدة' : 'Fleet Status'}</span>
                    <span className="text-foreground font-bold">
                      {data.is_active ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {isRTL ? 'نشط بالخدمة' : 'Active'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          {isRTL ? 'خارج الخدمة' : 'Inactive'}
                        </Badge>
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
            {data.notes && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block">{isRTL ? 'ملاحظات إضافية' : 'Notes'}</span>
                <p className="p-3 border border-border/40 bg-muted/10 rounded-xl text-foreground italic whitespace-pre-wrap">"{data.notes}"</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

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
    <div className="w-full max-w-full space-y-8 atls-page-enter">
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
          className="absolute top-4 end-4 p-2 rounded-xl border border-border/60 bg-card hover:bg-muted/80 hover:shadow-sm transition-all flex items-center justify-center text-muted-foreground hover:text-green-600 cursor-pointer active:scale-95 z-20"
          title={t('dashboard.refresh', 'Refresh')}
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

      {/* Premium Quick Access */}
      <div className="space-y-5 mt-8">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-foreground tracking-tight">
            {t('dashboard.quick_access', 'الوصول السريع')}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <ModuleCard
            isRTL={isRTL}
            title={t('sidebar.daily_reports', 'التقارير اليومية')}
            description="توثيق الأنشطة اليومية وسير العمليات"
            icon={FileText}
            colorClass="text-amber-600 dark:text-amber-400"
            bgColorClass="bg-amber-50 dark:bg-amber-950/20"
            path="/reports"
            count={t('dashboard.update_live', 'تحديث حي')}
          />
          <ModuleCard
            isRTL={isRTL}
            title={t('sidebar.productivity_reports', 'تقارير الإنتاجية')}
            description="تحليل الأداء اليومي ومعدلات الحصاد"
            icon={Activity}
            colorClass="text-blue-600 dark:text-blue-400"
            bgColorClass="bg-blue-50 dark:bg-blue-950/20"
            path="/production"
            count={t('dashboard.stats', 'إحصائيات')}
          />
          <ModuleCard
            isRTL={isRTL}
            title={t('sidebar.equipment', 'الأسطول والمعدات')}
            description="متابعة آليات المزرعة وتتبع الصيانة"
            icon={Tractor}
            colorClass="text-emerald-600 dark:text-emerald-450"
            bgColorClass="bg-emerald-50 dark:bg-emerald-950/20"
            path="/equipment"
            count={equipCount > 0 ? `${equipCount} وحدة` : 'نشط'}
          />
          <ModuleCard
            isRTL={isRTL}
            title={t('sidebar.warehouse', 'المستودعات')}
            description="إدارة المخزون والواردات اليومية"
            icon={Package}
            colorClass="text-purple-600 dark:text-purple-400"
            bgColorClass="bg-purple-50 dark:bg-purple-950/20"
            path="/warehouse"
            count={itemCount > 0 ? `${itemCount} صنف` : 'نشط'}
          />
        </div>
      </div>

      {/* Activity Feed Section */}
      <div className="mt-12 space-y-5 select-none">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center justify-between w-full xl:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-border/40 shadow-sm text-foreground">
                <History className="w-5.5 h-5.5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight">
                  {isRTL ? 'مركز أنشطة العمليات (ERP)' : 'Operational Activity Center (ERP)'}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  {isRTL ? 'سجل العمليات والتقارير الموحد لحظياً' : 'Unified live operational log feed'}
                </p>
              </div>
            </div>
            {/* Mobile filter sheet trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterSheetOpen(!isFilterSheetOpen)}
              className="xl:hidden h-10 w-10 p-0 rounded-xl bg-card border-border/50 relative"
            >
              <Filter className="w-4 h-4 text-muted-foreground" />
              {(filters.type !== 'all' || filters.status !== 'all' || filters.engineer !== 'all' || filters.location !== 'all' || filters.startDate || filters.endDate || searchQuery) && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 w-full xl:w-auto justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? "بحث في السجل..." : "Search log..."}
                className="pl-3 pr-9.5 h-10 w-full bg-card border-border/50 rounded-xl font-semibold shadow-inner focus-visible:ring-emerald-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Export options */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
                className="h-10 rounded-xl gap-1.5 font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-700 transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="h-10 rounded-xl gap-1.5 font-bold bg-muted border-border/50 hover:bg-muted/80 transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Panel - Collapsible for desktop as well */}
        <div className={cn(
          "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 p-5 bg-card/45 backdrop-blur-xl border border-border/50 rounded-2xl transition-all duration-300",
          isFilterSheetOpen ? "grid" : "hidden xl:grid"
        )}>
          {/* Type Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'نوع النشاط' : 'Activity Type'}</label>
            <Select value={filters.type} onValueChange={(val) => setFilters(prev => ({ ...prev, type: val }))}>
              <SelectTrigger className="h-9.5 border-border/50 bg-card rounded-xl font-semibold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'كل الأنشطة' : 'All Activities'}</SelectItem>
                <SelectItem value="daily_task">{isRTL ? 'تقرير يومي' : 'Daily Report'}</SelectItem>
                <SelectItem value="irrigation">{isRTL ? 'ري وتسميد' : 'Irrigation'}</SelectItem>
                <SelectItem value="pest_control">{isRTL ? 'مكافحة الآفات' : 'Pest Control'}</SelectItem>
                <SelectItem value="productivity">{isRTL ? 'حصاد وفرز' : 'Productivity'}</SelectItem>
                <SelectItem value="warehouse">{isRTL ? 'حركة مخزنية' : 'Warehouse'}</SelectItem>
                <SelectItem value="equipment">{isRTL ? 'المعدات والأسطول' : 'Equipment'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'الحالة' : 'Status'}</label>
            <Select value={filters.status} onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}>
              <SelectTrigger className="h-9.5 border-border/50 bg-card rounded-xl font-semibold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                <SelectItem value="draft">{isRTL ? 'مسودة' : 'Draft'}</SelectItem>
                <SelectItem value="submitted">{isRTL ? 'تحت المراجعة' : 'Under Review'}</SelectItem>
                <SelectItem value="approved">{isRTL ? 'معتمد' : 'Approved'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Engineer Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'المهندس / المشرف' : 'Responsible'}</label>
            <Select value={filters.engineer} onValueChange={(val) => setFilters(prev => ({ ...prev, engineer: val }))}>
              <SelectTrigger className="h-9.5 border-border/50 bg-card rounded-xl font-semibold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                {uniqueEngineers.filter(e => e !== 'all').map(eng => (
                  <SelectItem key={eng} value={eng}>{eng}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'الموقع' : 'Location'}</label>
            <Select value={filters.location} onValueChange={(val) => setFilters(prev => ({ ...prev, location: val }))}>
              <SelectTrigger className="h-9.5 border-border/50 bg-card rounded-xl font-semibold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                {uniqueLocations.filter(l => l !== 'all').map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'من تاريخ' : 'Start Date'}</label>
            <Input
              type="date"
              className="h-9.5 border-border/50 bg-card rounded-xl font-semibold text-xs py-0 select-text"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{isRTL ? 'إلى تاريخ' : 'End Date'}</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-9.5 border-border/50 bg-card rounded-xl font-semibold text-xs py-0 flex-grow select-text"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
              {(filters.type !== 'all' || filters.status !== 'all' || filters.engineer !== 'all' || filters.location !== 'all' || filters.startDate || filters.endDate || searchQuery) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilters({ type: 'all', status: 'all', engineer: 'all', location: 'all', startDate: '', endDate: '' });
                    setSearchQuery('');
                  }}
                  className="h-9.5 w-9.5 p-0 shrink-0 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-500/10 cursor-pointer"
                  title={isRTL ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabular/Feed Content Card */}
        <Card className="border border-border/50 bg-card/65 backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {activitiesLoading ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-9 h-9 animate-spin text-emerald-500 stroke-[2]" />
                <p className="text-sm text-muted-foreground font-bold">{isRTL ? 'جاري تجميع الأنشطة الموحدة...' : 'Aggregating unified activity logs...'}</p>
              </div>
            ) : activitiesError ? (
              <div className="p-16 text-center text-red-500 font-bold text-sm bg-red-500/5">
                {activitiesError}
              </div>
            ) : paginatedActivities.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-2">
                <History className="w-10 h-10 text-muted-foreground/60 mb-2 stroke-[1.5]" />
                <p className="text-base text-foreground font-black">{isRTL ? 'لا توجد عمليات مطابقة للفلاتر' : 'No operational logs found'}</p>
                <p className="text-xs text-muted-foreground font-semibold">{isRTL ? 'يرجى مراجعة معايير البحث أو تصفية المدخلات.' : 'Try adjusting your search query or filters.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto animate-fadeIn">
                <Table>
                  <TableHeader className="bg-muted/40 font-bold border-b border-border/40 select-none">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[140px] font-black py-3">{isRTL ? 'نوع العملية' : 'Activity Type'}</TableHead>
                      <TableHead className="font-black py-3">{isRTL ? 'اسم النشاط / التفاصيل' : 'Details'}</TableHead>
                      <TableHead className="w-[180px] font-black py-3">{isRTL ? 'الموقع الرئيسي' : 'Site / Location'}</TableHead>
                      <TableHead className="w-[160px] font-black py-3">{isRTL ? 'المسؤول' : 'Engineer / User'}</TableHead>
                      <TableHead className="w-[140px] font-black py-3">{isRTL ? 'التاريخ والوقت' : 'Date & Time'}</TableHead>
                      <TableHead className="w-[100px] font-black py-3 text-center">{isRTL ? 'حالة التقرير' : 'Status'}</TableHead>
                      <TableHead className="w-[110px] font-black py-3 text-center">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/30">
                    {paginatedActivities.map((activity) => {
                      const IconComponent = getBadgeIcon(activity.type);
                      return (
                        <TableRow
                          key={activity.id}
                          className="hover:bg-muted/30 transition-all group cursor-pointer border-b border-border/30"
                          onClick={() => {
                            if (activity.type === 'daily_task') {
                              navigate(`/reports/tasks/${activity.original_id}`);
                            } else if (activity.type === 'harvest') {
                              navigate(`/production?id=${activity.original_id}`);
                            } else if (activity.type === 'irrigation') {
                              navigate(`/reports/irrigation/${activity.original_id}/edit`);
                            } else if (activity.type === 'pest_control') {
                              navigate(`/reports/pest-control?id=${activity.original_id}`);
                            } else if (activity.type === 'warehouse') {
                              navigate(`/warehouse?tab=movements&search=${activity.raw_data?.item_name || ''}`);
                            } else if (activity.type === 'equipment') {
                              navigate(`/equipment?id=${activity.original_id}`);
                            } else {
                              setSelectedActivity(activity);
                            }
                          }}
                        >
                          {/* Type Column */}
                          <TableCell className="py-3 font-semibold">
                            <Badge variant="outline" className={cn("px-2.5 py-1 rounded-xl text-xs gap-1.5 flex items-center w-fit border font-bold", getBadgeStyles(activity.type))}>
                              <IconComponent className="w-3.5 h-3.5 stroke-[2]" />
                              <span>{activity.typeLabel}</span>
                            </Badge>
                          </TableCell>

                          {/* Name/Details Column */}
                          <TableCell className="py-3 max-w-[320px]">
                            <div className="font-extrabold text-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-1 leading-snug">
                              {activity.name}
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground/75 font-mono">#{activity.original_id}</span>
                          </TableCell>

                          {/* Site/Location Column */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold leading-normal truncate max-w-[170px]">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400/80 shrink-0" />
                              <span className="truncate">{activity.location}</span>
                            </div>
                          </TableCell>

                          {/* Responsible Column */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold leading-normal truncate max-w-[150px]">
                              <User className="w-3.5 h-3.5 text-zinc-400/80 shrink-0" />
                              <span className="truncate">{activity.engineer}</span>
                            </div>
                          </TableCell>

                          {/* Date/Time Column */}
                          <TableCell className="py-3 font-semibold text-xs text-muted-foreground/90">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400/80 shrink-0" />
                              <span>{activity.date}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground/75 font-mono">
                              <Clock className="w-3 h-3 text-zinc-400/60 shrink-0" />
                              <span>{activity.time || dayjs(activity.timestamp).format('hh:mm A')}</span>
                            </div>
                          </TableCell>

                          {/* Status Badge Column */}
                          <TableCell className="py-3 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-black text-[10px] px-2.5 py-0.5 rounded-lg w-fit mx-auto border-0",
                                activity.status === 'approved' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450" :
                                  activity.status === 'submitted' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse" :
                                    "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              )}
                            >
                              {activity.status === 'approved' ? (isRTL ? 'معتمد' : 'Approved') :
                                activity.status === 'submitted' ? (isRTL ? 'قيد المراجعة' : 'Review') :
                                  (isRTL ? 'مسودة' : 'Draft')}
                            </Badge>
                          </TableCell>

                          {/* Actions Column */}
                          <TableCell className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 font-bold text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 cursor-pointer"
                              onClick={() => {
                                if (activity.type === 'daily_task') {
                                  navigate(`/reports/tasks/${activity.original_id}`);
                                } else if (activity.type === 'harvest') {
                                  navigate(`/production?id=${activity.original_id}`);
                                } else if (activity.type === 'irrigation') {
                                  navigate(`/reports/irrigation/${activity.original_id}/edit`);
                                } else if (activity.type === 'pest_control') {
                                  navigate(`/reports/pest-control?id=${activity.original_id}`);
                                } else if (activity.type === 'warehouse') {
                                  navigate(`/warehouse?tab=movements&search=${activity.raw_data?.item_name || ''}`);
                                } else if (activity.type === 'equipment') {
                                  navigate(`/equipment?id=${activity.original_id}`);
                                } else {
                                  setSelectedActivity(activity);
                                }
                              }}
                            >
                              {isRTL ? 'التفاصيل' : 'Details'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {!activitiesLoading && filteredActivities.length > 0 && (
              <div className="p-4 bg-muted/15 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3.5 select-none text-xs font-semibold text-muted-foreground">
                <div>
                  {isRTL
                    ? `عرض ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredActivities.length)} من أصل ${filteredActivities.length} عمليات`
                    : `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredActivities.length)} of ${filteredActivities.length} activities`
                  }
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg font-bold border-border/60 hover:bg-muted text-foreground cursor-pointer shadow-sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    {isRTL ? 'السابق' : 'Previous'}
                  </Button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <Button
                      key={idx}
                      variant={currentPage === idx + 1 ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 rounded-lg font-bold border-border/60 cursor-pointer",
                        currentPage === idx + 1 ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "hover:bg-muted text-foreground"
                      )}
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg font-bold border-border/60 hover:bg-muted text-foreground cursor-pointer shadow-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    {isRTL ? 'التالي' : 'Next'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual slide-over Drawer Panel */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[150] overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Background backdrop */}
            <div
              className="absolute inset-0 bg-zinc-955/60 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedActivity(null)}
            />
            <div className={cn(
              "pointer-events-none fixed inset-y-0 flex max-w-full pl-0 sm:pl-10",
              isRTL ? "left-0" : "right-0"
            )}>
              <div className="pointer-events-auto w-screen max-w-2xl transform bg-card border-l border-border/80 shadow-2xl transition-all duration-300 ease-in-out flex flex-col h-full select-none">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border/50 bg-muted/40 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                      <Badge className={cn("px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono", getBadgeStyles(selectedActivity.type))}>
                        {selectedActivity.typeLabel}
                      </Badge>
                      <span>#{selectedActivity.original_id}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">{selectedActivity.name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {renderDetailView(selectedActivity)}
                </div>
                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50 bg-muted/30 flex justify-end gap-3 shrink-0">
                  {(selectedActivity.type === 'daily_task' || selectedActivity.type === 'harvest' || selectedActivity.type === 'irrigation' || selectedActivity.type === 'pest_control') && (
                    <Button
                      variant="outline"
                      className="font-bold text-xs"
                      onClick={() => {
                        let path = '';
                        if (selectedActivity.type === 'daily_task') {
                          path = `/reports/tasks/${selectedActivity.original_id}`;
                        } else if (selectedActivity.type === 'harvest') {
                          path = `/production?id=${selectedActivity.original_id}`;
                        } else if (selectedActivity.type === 'irrigation') {
                          path = `/reports/irrigation/${selectedActivity.original_id}/edit`;
                        } else if (selectedActivity.type === 'pest_control') {
                          path = `/reports/pest-control?id=${selectedActivity.original_id}`;
                        }
                        navigate(path);
                        setSelectedActivity(null);
                      }}
                    >
                      {isRTL ? 'عرض الصفحة الكاملة' : 'View Full Page'}
                    </Button>
                  )}
                  <Button
                    className="font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => setSelectedActivity(null)}
                  >
                    {isRTL ? 'إغلاق' : 'Close'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End of Dashboard Content */}
    </div>
  );
};

export default Dashboard;
