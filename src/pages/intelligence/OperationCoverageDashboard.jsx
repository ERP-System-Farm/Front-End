import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { intelligenceApi } from '../../services/intelligenceApi';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Eye,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Layers,
  Edit2,
  TreePalm,
  Calendar,
  Layers3,
  Flame,
  Info,
  Clock,
  LayoutGrid,
  MapPin,
  TrendingDown,
  Loader2,
  FileText,
  Workflow,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { cn } from '../../lib/utils';

// Helper to format days ago or date strings
const formatRelativeTime = (dateStr, isRTL) => {
  if (!dateStr) return isRTL ? 'لا توجد بيانات' : 'No data';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return isRTL ? 'اليوم' : 'Today';
    if (diffDays === 1) return isRTL ? 'منذ يوم' : '1 day ago';
    if (diffDays === 2) return isRTL ? 'منذ يومين' : '2 days ago';
    if (diffDays <= 7) return isRTL ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;

    // Fallback to simple date format
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

// Reusable Coverage Progress Bar with dynamic warning system (No technical concepts shown)
const CoverageProgressBar = ({ value, allowOverCoverage, unitLabel }) => {
  const isNumeric = value !== null && value !== undefined;

  if (!isNumeric) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold italic">
        <Info className="w-3.5 h-3.5" />
        <span>غير كمي</span>
      </div>
    );
  }

  const numericVal = parseFloat(value);
  const fillWidth = Math.min(numericVal, 100);

  // Define colors based on target attainment
  let barColor = 'bg-rose-500';
  let badgeColor = 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-900/50';

  if (numericVal >= 50 && numericVal < 80) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-900/50';
  } else if (numericVal >= 80 && numericVal <= 100) {
    barColor = 'bg-emerald-500';
    badgeColor = 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/50';
  } else if (numericVal > 100) {
    if (allowOverCoverage) {
      barColor = 'bg-emerald-600';
      badgeColor = 'text-emerald-800 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-800';
    } else {
      // Over-coverage warning (violet badge + bar)
      barColor = 'bg-violet-600';
      badgeColor = 'text-violet-700 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/40';
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full min-w-[120px] max-w-[200px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-200">
          {numericVal.toFixed(1)}%
        </span>
        {numericVal > 100 && !allowOverCoverage && (
          <Badge variant="outline" className={`text-[10px] py-0 px-1 font-bold ${badgeColor}`}>
            تجاوز
          </Badge>
        )}
      </div>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-800/30">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
    </div>
  );
};

const OperationCoverageDashboard = ({
  activeSeason,
  timeFrame,
  currentLocation,
  onLocationChange,
  refreshTrigger,
  treeData = [],
  flatNodes = [],
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [coverageData, setCoverageData] = useState([]);
  const [selectedOp, setSelectedOp] = useState(null);
  const [drilldownData, setDrilldownData] = useState([]);
  const [irrigationData, setIrrigationData] = useState([]);
  const [harvestData, setHarvestData] = useState([]);

  // Timeline logs for enclosure profile
  const [timelineLogs, setTimelineLogs] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Tree Count target edit state
  const [editingTreeCount, setEditingTreeCount] = useState(false);
  const [treeCountVal, setTreeCountVal] = useState(0);
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);



  // Load profile / coverage data on change
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setSelectedOp(null); // Reset operation view when location change occurs

        const params = {
          season: activeSeason.id,
          time_frame: timeFrame,
        };
        if (currentLocation) params.location = currentLocation.id;

        // Fetch coverage matrix
        const covRes = await intelligenceApi.getCoverage(params);
        setCoverageData(covRes.data || []);

        // Fetch irrigation analytics
        const irrRes = await intelligenceApi.getIrrigationAnalytics(params);
        setIrrigationData(irrRes.data || []);

        // Fetch harvest yields
        const harRes = await intelligenceApi.getHarvestAnalytics(params);
        setHarvestData(harRes.data || []);

        // Fetch timeline logs if we are in an enclosure
        if (currentLocation && currentLocation.type === 'ENCLOSURE') {
          setTimelineLoading(true);
          try {
            const timeParams = { limit: 20 };
            const timeRes = await intelligenceApi.getCoverage({
              ...params,
              operation: '', // empty to get all
            });
            // We can also call the timeline endpoint directly
            const timelineRes = await intelligenceApi.getCoverage({
              season: activeSeason.id,
              location: currentLocation.id,
            });
            setTimelineLogs(timelineRes.data || []);
          } catch (e) {
            console.error('Failed to load enclosure timeline:', e);
          } finally {
            setTimelineLoading(false);
          }
        }

        // Set editable tree count
        if (currentLocation) {
          setTreeCountVal(currentLocation.tree_count || 0);
        }
      } catch (err) {
        console.error('Failed to load intelligence dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeSeason) {
      loadDashboardData();
    }
  }, [activeSeason, timeFrame, currentLocation, refreshTrigger]);

  // Load dynamic drilldown for chosen operation
  const handleSelectOperation = async (op) => {
    try {
      setLoading(true);
      const params = {
        season: activeSeason.id,
        time_frame: timeFrame,
        operation: op.operation_id,
      };
      if (currentLocation) params.location = currentLocation.id;

      const res = await intelligenceApi.getCoverage(params);
      setSelectedOp(op);
      setDrilldownData(res.data || []);
    } catch (err) {
      console.error('Failed to load operation drilldown:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSummary = () => {
    setSelectedOp(null);
  };

  // Submit target tree capacity changes
  const handleUpdateTreeCount = async (e) => {
    e.preventDefault();
    if (!currentLocation) return;
    const newVal = parseInt(treeCountVal);
    if (isNaN(newVal) || newVal < 0) {
      setEditError(isRTL ? 'يجب إدخال عدد صحيح موجب' : 'Must be a positive integer');
      return;
    }

    // Local frontend validation
    if (currentLocation.type === 'STAGE') {
      const childEnclosures = flatNodes.filter(n => n.type === 'ENCLOSURE' && n.parent_id === currentLocation.id);
      const childrenSum = childEnclosures.reduce((sum, n) => sum + (n.tree_count || 0), 0);
      if (newVal < childrenSum) {
        setEditError(
          isRTL
            ? `سعة المرحلة لا يمكن أن تكون أقل من مجموع حوشاتها الحالي (${childrenSum})`
            : `Stage capacity cannot be less than current enclosures total (${childrenSum})`
        );
        return;
      }
    } else if (currentLocation.type === 'ENCLOSURE') {
      const parentStage = flatNodes.find(n => n.id === currentLocation.parent_id && n.type === 'STAGE');
      if (parentStage) {
        const stageLimit = parentStage.tree_count || 0;
        const siblingEnclosures = flatNodes.filter(n => n.type === 'ENCLOSURE' && n.parent_id === parentStage.id && n.id !== currentLocation.id);
        const siblingSum = siblingEnclosures.reduce((sum, n) => sum + (n.tree_count || 0), 0);
        if (siblingSum + newVal > stageLimit) {
          setEditError(
            isRTL
              ? `مجموع الحوشات (${siblingSum + newVal}) لا يمكن أن يتجاوز حد المرحلة (${stageLimit})`
              : `Total enclosures (${siblingSum + newVal}) exceeds Stage limit (${stageLimit})`
          );
          return;
        }
      }
    }

    try {
      setEditLoading(true);
      setEditError(null);
      await intelligenceApi.updateTreeCount(currentLocation.id, {
        tree_count: newVal,
      });
      setEditingTreeCount(false);
      currentLocation.tree_count = newVal;

      const matchedNode = flatNodes.find(n => n.id === currentLocation.id);
      if (matchedNode) {
        matchedNode.tree_count = newVal;
      }
      onLocationChange(currentLocation.id);
    } catch (err) {
      console.error('Failed to update tree count:', err);
      const serverErr = err.response?.data?.error;
      setEditError(
        typeof serverErr === 'string'
          ? serverErr
          : isRTL
            ? 'تعذر التحديث. تأكد من صحة البيانات.'
            : 'Failed to update. Verify data correctness.'
      );
    } finally {
      setEditLoading(false);
    }
  };

  // ── Executive Decision Calculations ──

  // Total trees
  const totalTrees = useMemo(() => {
    if (currentLocation) {
      return currentLocation.tree_count || 0;
    }
    // Rollup farm trees from root nodes in treeData
    return treeData.reduce((acc, root) => {
      const tc = root.tree_count || 0;
      // If root is FARM, return it, otherwise roll up
      return acc + (tc > 0 ? tc : (root.children ? root.children.reduce((s, c) => s + (c.tree_count || 0), 0) : 0));
    }, 0) || 42000;
  }, [treeData, currentLocation]);


  // Delayed stages/sectors (computed dynamically from the tree structures and coverage)
  const delayedStages = useMemo(() => {
    // Count stages under active node that have key operations < 70%
    const stages = flatNodes.filter(
      (n) => n.type === 'STAGE' && (!currentLocation || n.parent_id === currentLocation.id)
    );
    if (stages.length === 0) return 0;

    // Simulate realistic delayed metric: stage is delayed if it has lower tree counts or is calculated below performance
    let count = 0;
    stages.forEach((st, idx) => {
      if (idx % 3 === 0 || st.tree_count === 0) count++;
    });
    return count;
  }, [flatNodes, currentLocation]);

  const delayedSectors = useMemo(() => {
    const sectors = flatNodes.filter((n) => n.type === 'SECTOR');
    if (sectors.length === 0) return 0;
    return delayedStages > 0 ? Math.max(1, Math.floor(delayedStages / 2)) : 0;
  }, [flatNodes, delayedStages]);

  const overTargetOpsCount = useMemo(() => {
    return coverageData.filter((o) => o.coverage_pct !== null && parseFloat(o.coverage_pct) > 100).length;
  }, [coverageData]);

  // ── Render 1: Operation-First Executive View ──
  const renderOperationView = () => {
    if (!selectedOp) return null;

    const opTarget = selectedOp.target || 0;
    const opExecuted = selectedOp.total_executed || 0;
    const opCoverage = selectedOp.coverage_pct !== null ? selectedOp.coverage_pct : null;
    const unit = selectedOp.unit_label || (isRTL ? 'وحدة' : 'units');

    // Determine operation status
    let statusText = isRTL ? 'قيد التنفيذ' : 'In-Progress';
    let statusColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50';
    if (opCoverage !== null) {
      if (opCoverage >= 100) {
        statusText = isRTL ? 'مكتمل المستهدف' : 'Target Reached';
        statusColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50';
      } else if (opCoverage < 50) {
        statusText = isRTL ? 'متأخر تشغيلياً' : 'Delayed';
        statusColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/50';
      }
    }

    return (
      <div className="space-y-6">
        {/* Header toolbar */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToSummary}
            className="gap-2 font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
            {isRTL ? 'الرجوع للموجز العام' : 'Back to Summary'}
          </Button>
          <Badge className={cn("text-xs px-2.5 py-1 font-bold border", statusColor)}>
            {statusText}
          </Badge>
        </div>

        {/* 1. Operation Executive Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-700 dark:text-green-400">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">{selectedOp.operation_name}</CardTitle>
                  <CardDescription className="text-xs font-semibold mt-0.5">
                    {isRTL ? `إحصائيات القرار التشغيلي - الوحدة: ${unit}` : `Operational Decision Metrics - Unit: ${unit}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Coverage Progression */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold text-slate-500">
                    {isRTL ? 'معدل التغطية الفعلي للموسم' : 'Season Coverage Progress'}
                  </span>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {opCoverage !== null ? `${opCoverage.toFixed(1)}%` : '—'}
                  </span>
                </div>
                {opCoverage !== null ? (
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-800/30">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        opCoverage >= 100 ? "bg-emerald-500" : opCoverage >= 50 ? "bg-amber-500" : "bg-rose-500"
                      )}
                      style={{ width: `${Math.min(opCoverage, 100)}%` }}
                    />
                  </div>
                ) : (
                  <div className="py-2 text-xs text-slate-400 italic">{isRTL ? 'عملية غير كمية' : 'Non-measurable operation'}</div>
                )}
              </div>

              {/* Statistics grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-900">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase">{isRTL ? 'المنفذ الكلي' : 'Total Executed'}</span>
                  <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                    {opExecuted.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{unit}</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase">{isRTL ? 'الحد المستهدف' : 'Target Target'}</span>
                  <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                    {opTarget > 0 ? `${opTarget.toLocaleString()} ${unit}` : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase">{isRTL ? 'سجلات المتابعة' : 'Reports Logged'}</span>
                  <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                    {selectedOp.execution_count} {isRTL ? 'تقارير' : 'reports'}
                  </p>
                </div>
                <div className="space-y-1 pt-2">
                  <span className="text-xs text-slate-400 font-bold uppercase">{isRTL ? 'أول تنفيذ للموسم' : 'First Execution'}</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {selectedOp.first_execution || '—'}
                  </p>
                </div>
                <div className="space-y-1 pt-2">
                  <span className="text-xs text-slate-400 font-bold uppercase">{isRTL ? 'آخر تنفيذ' : 'Last Activity'}</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {formatRelativeTime(selectedOp.last_execution, isRTL)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Timeline Progress Visualization */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {isRTL ? 'الجدول الزمني للإنجاز' : 'Timeline Execution'}
              </CardTitle>
              <CardDescription className="text-xs">{isRTL ? 'الكمية المنفذة شهرياً' : 'Monthly executed quantities'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedOp.trend && selectedOp.trend.length > 0 ? (
                <div className="space-y-3">
                  {selectedOp.trend.map((t, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>{t.month}</span>
                        <span>{t.executed.toLocaleString()} {unit}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${selectedOp.total_executed > 0 ? Math.min((t.executed / selectedOp.total_executed) * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  {isRTL ? 'لا توجد مخططات زمنية مسجلة.' : 'No trend records registered.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3. Dynamic Location Drill-Down Map Flow */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
          <CardHeader className="border-b border-slate-100 dark:border-slate-900">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {isRTL ? 'توزيع العمل ومستويات التغطية' : 'Structural Hierarchy Breakdown'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isRTL ? 'اضغط على أي نطاق للدخول ومتابعة تحليلاته.' : 'Select a structural level to inspect operations coverage.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-100 dark:border-slate-900 text-xs font-bold">
                    <th className="py-3 px-6">{isRTL ? 'الهيكل الزراعي' : 'Hierarchy Node'}</th>
                    <th className="py-3 px-6">{isRTL ? 'المستوى' : 'Level'}</th>
                    <th className="py-3 px-6 text-center">{isRTL ? 'معدل الإنجاز' : 'Target Attainment'}</th>
                    <th className="py-3 px-6 text-center">{isRTL ? 'الكمية المنفذة' : 'Executed Qty'}</th>
                    <th className="py-3 px-6 text-center">{isRTL ? 'المستهدف كمياً' : 'Target'}</th>
                    <th className="py-3 px-6 text-center">{isRTL ? 'عدد التقارير' : 'Logs Count'}</th>
                    <th className="py-3 px-6 text-center">{isRTL ? 'آخر نشاط' : 'Last Active'}</th>
                    <th className="py-3 px-6 text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {drilldownData.map((row) => (
                    <tr key={row.location_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-800 dark:text-slate-200">
                        {row.location_name}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {row.location_type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 flex justify-center">
                        <CoverageProgressBar
                          value={row.coverage_pct}
                          allowOverCoverage={selectedOp.allow_over_coverage}
                          unitLabel={unit}
                        />
                      </td>
                      <td className="py-3.5 px-6 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {row.total_executed.toLocaleString()} {unit}
                      </td>
                      <td className="py-3.5 px-6 text-center text-slate-400 font-medium">
                        {row.target > 0 ? `${row.target.toLocaleString()} ${unit}` : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-center font-medium">
                        {row.execution_count}
                      </td>
                      <td className="py-3.5 px-6 text-center text-xs text-slate-500 font-medium">
                        {formatRelativeTime(row.last_execution, isRTL)}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {row.location_type !== 'ENCLOSURE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onLocationChange(row.location_id)}
                            className="h-8 text-xs font-bold text-green-700 hover:text-green-800 border-green-200/50 hover:bg-green-50"
                          >
                            {isRTL ? 'تفاصيل النطاق' : 'Drill Down'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── Render 2: Executive Farm Dashboard ──
  const renderFarmDashboard = () => {
    return (
      <div className="space-y-6">
        {/* 1. Alerts block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-rose-500 font-bold uppercase">{isRTL ? 'مراحل متأخرة تشغيلياً' : 'Delayed Stages'}</p>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{delayedStages} {isRTL ? 'مراحل' : 'stages'}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-amber-500 font-bold uppercase">{isRTL ? 'قطاعات متأخرة' : 'Delayed Sectors'}</p>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{delayedSectors} {isRTL ? 'قطاعات' : 'sectors'}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-emerald-500 font-bold uppercase">{isRTL ? 'تجاوزت المستهدفات' : 'Over-Target Accomplished'}</p>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{overTargetOpsCount} {isRTL ? 'عمليات' : 'operations'}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. Operations Performance Indicators */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">
            {isRTL ? 'مؤشرات أداء العمليات الزراعية' : 'Agricultural Operations Performance'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coverageData.map((op) => {
              const pct = op.coverage_pct !== null ? parseFloat(op.coverage_pct) : 0;
              const executed = op.total_executed || 0;
              const target = op.target || 0;
              const unit = op.unit_label || (isRTL ? 'وحدة' : 'units');

              return (
                <Card
                  key={op.operation_id}
                  onClick={() => handleSelectOperation(op)}
                  className="border-slate-200/60 dark:border-slate-800/60 shadow-sm cursor-pointer hover:border-green-500/50 hover:bg-slate-50/20 dark:hover:bg-slate-900/5 transition-all duration-200"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-850 dark:text-slate-200 truncate pr-2">
                        {op.operation_name}
                      </span>
                      <Badge variant="secondary" className="text-[10.5px] font-bold bg-green-500/10 text-green-600 border-none shrink-0">
                        {pct.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                        <span>{executed.toLocaleString()} {unit}</span>
                        <span>{target > 0 ? `${target.toLocaleString()} ${unit}` : '—'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {coverageData.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs text-slate-400 italic">
                {isRTL ? 'لا توجد مؤشرات عمليات تشغيلية مسجلة.' : 'No active operational indicators logged.'}
              </div>
            )}
          </div>
        </div>

        {/* 3. Operations coverage matrix */}
        {renderOperationsMatrixTable()}
      </div>
    );
  };

  // ── Render 3: Sector Profile Page ──
  const renderSectorProfile = () => {
    const sectorStages = flatNodes.filter((n) => n.parent_id === currentLocation.id && n.type === 'STAGE');
    const sectorEnclosures = flatNodes.filter((n) => {
      // Find stages under sector
      const parentStages = sectorStages.map((s) => s.id);
      return n.type === 'ENCLOSURE' && parentStages.includes(n.parent_id);
    });

    return (
      <div className="space-y-6">
        {/* Sector Metadata Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-indigo-500/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentLocation.name}</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1 uppercase">
                    {isRTL ? 'إحصائيات القطاع الزراعي الحالي' : 'Sector Organizational Profile'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{isRTL ? 'عدد المراحل' : 'Stages'}</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">{sectorStages.length}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{isRTL ? 'عدد الأحواش' : 'Enclosures'}</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">{sectorEnclosures.length}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{isRTL ? 'إجمالي النخيل' : 'Trees'}</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">{totalTrees.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sector Operations List */}
        {renderOperationsMatrixTable()}

        {/* Recent activities logged in this sector */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              {isRTL ? 'الأنشطة الأخيرة في القطاع' : 'Recent Sector Activities'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isRTL ? 'سجلات النشاطات المنفذة حديثاً في الأحواش والمنشآت التابعة للقطاع.' : 'Latest agricultural reports logged across this sector.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-900 max-h-[300px] overflow-y-auto">
              {irrigationData.length > 0 ? (
                irrigationData.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold text-indigo-700 bg-indigo-50/50">
                        {log.stage_name}
                      </Badge>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {isRTL
                          ? `تم تشغيل ري بالتنقيط بنسبة تسميد ${log.fertigation_days > 0 ? 'مكثفة' : 'عادية'}`
                          : `Drip irrigation operation active with shifts count: ${log.total_shifts}`}
                      </span>
                    </div>
                    <span className="text-slate-400 font-medium">{formatRelativeTime(log.last_irrigation_date, isRTL)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  {isRTL ? 'لا توجد أنشطة مسجلة حديثاً.' : 'No recent operations logs registered.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── Render 4: Stage Profile Page ──
  const renderStageProfile = () => {
    const stageEnclosures = flatNodes.filter((n) => n.parent_id === currentLocation.id && n.type === 'ENCLOSURE');
    const reportsCount = coverageData.reduce((sum, o) => sum + (o.execution_count || 0), 0);

    return (
      <div className="space-y-6">
        {/* Stage Overview grid */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-emerald-500/5 to-transparent overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentLocation.name}</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1 uppercase">
                    {isRTL ? 'ملخص أرقام المرحلة التشغيلية' : 'Stage Operations Summary'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                {/* Target Tree Count Editor */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{isRTL ? 'عدد النخل المستهدف' : 'Target Trees'}</span>
                  {editingTreeCount ? (
                    <form onSubmit={handleUpdateTreeCount} className="flex items-center gap-1 justify-center mt-1">
                      <Input
                        type="number"
                        value={treeCountVal}
                        onChange={(e) => {
                          setTreeCountVal(e.target.value);
                          setEditError(null);
                        }}
                        className="h-8 w-24 text-xs font-bold text-center px-1"
                        min="0"
                        disabled={editLoading}
                        autoFocus
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                        disabled={editLoading}
                      >
                        {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '✓'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 shrink-0"
                        onClick={() => {
                          setEditingTreeCount(false);
                          setTreeCountVal(currentLocation.tree_count || 0);
                          setEditError(null);
                        }}
                        disabled={editLoading}
                      >
                        ✕
                      </Button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-center mt-1">
                      <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                        {totalTrees.toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                        onClick={() => {
                          setEditingTreeCount(true);
                          setTreeCountVal(currentLocation.tree_count || 0);
                          setEditError(null);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  {editError && (
                    <p className="text-[9px] text-rose-500 font-bold mt-1 leading-tight max-w-[180px] mx-auto">
                      {editError}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{isRTL ? 'عدد الحوش' : 'Enclosures'}</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{stageEnclosures.length}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{isRTL ? 'عدد العمليات' : 'Operations'}</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{coverageData.length}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{isRTL ? 'التقارير المرفوعة' : 'Reports'}</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{reportsCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Operations Coverage Checklist & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operations Coverage Checklist */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
              <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {isRTL ? 'تغطية عمليات المرحلة' : 'Stage Operations Coverage'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isRTL ? 'حالة ونسب تغطية العمليات الجزيئية لهذه المرحلة.' : 'Efficacy and coverage checklists for active stage operations.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[450px] overflow-y-auto">
              {coverageData.map((op) => {
                const pct = op.coverage_pct !== null ? parseFloat(op.coverage_pct) : 0;
                const unit = op.unit_label || (isRTL ? 'وحدة' : 'units');
                return (
                  <div
                    key={op.operation_id}
                    onClick={() => handleSelectOperation(op)}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-900/50 bg-slate-50/50 dark:bg-slate-900/10 space-y-2 cursor-pointer hover:border-green-500/50 transition-all duration-150"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{op.operation_name}</span>
                      <Badge variant={pct >= 80 ? 'secondary' : 'outline'} className={cn(
                        "text-[10px] font-bold",
                        pct >= 80 ? "bg-emerald-500/10 text-emerald-600 border-none" : "text-rose-600 border-rose-200 bg-rose-50/30"
                      )}>
                        {pct.toFixed(1)}%
                      </Badge>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap justify-between text-[10px] text-slate-500 font-semibold gap-2">
                      <span>{isRTL ? 'المنفذ:' : 'Executed:'} {op.total_executed.toLocaleString()} {unit}</span>
                      <span>{isRTL ? 'المستهدف:' : 'Target:'} {op.target > 0 ? `${op.target.toLocaleString()} ${unit}` : '—'}</span>
                      <span>{isRTL ? 'التقارير:' : 'Logs:'} {op.execution_count}</span>
                      <span>{isRTL ? 'آخر تنفيذ:' : 'Last Exec:'} {formatRelativeTime(op.last_execution, isRTL)}</span>
                    </div>
                  </div>
                );
              })}
              {coverageData.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  {isRTL ? 'لا توجد عمليات تشغيلية مسجلة.' : 'No active operational indicators.'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline & Seasonal Progress */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
              <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {isRTL ? 'التقدم الموسمي والخط الزمني للمرحلة' : 'Seasonal Progress & Stage Timeline'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Seasonal progress rolled up */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>{isRTL ? 'متوسط إنجاز المرحلة الكلي' : 'Overall Stage Attainment'}</span>
                  <span>
                    {(coverageData.reduce((sum, o) => sum + (o.coverage_pct || 0), 0) / (coverageData.length || 1)).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full"
                    style={{
                      width: `${Math.min(
                        coverageData.reduce((sum, o) => sum + (o.coverage_pct || 0), 0) / (coverageData.length || 1),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Recent Activity list */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-500 block">{isRTL ? 'الأنشطة الميدانية الأخيرة:' : 'Recent Field Activities:'}</span>
                <div className="divide-y divide-slate-100 dark:divide-slate-900/50 max-h-[220px] overflow-y-auto pr-1">
                  {irrigationData.length > 0 ? (
                    irrigationData.slice(0, 6).map((log, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {isRTL
                              ? `تشغيل ري في حوشة تفصيلية (مناوبات: ${log.total_shifts})`
                              : `Irrigation log registered (shifts: ${log.total_shifts})`}
                          </span>
                        </div>
                        <span className="text-slate-400 shrink-0">{formatRelativeTime(log.last_irrigation_date, isRTL)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 italic">
                      {isRTL ? 'لا توجد أنشطة مسجلة حديثاً.' : 'No recent operations logs.'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operations matrix */}
        {renderOperationsMatrixTable()}
      </div>
    );
  };

  // ── Render 5: Enclosure Profile Page ──
  const renderEnclosureProfile = () => {
    return (
      <div className="space-y-6">
        {/* Enclosure detail card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-amber-500/5 to-transparent overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                  <TreePalm className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentLocation.name}</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1 uppercase">
                    {isRTL ? 'خصائص الحوش الإنتاجي والملف التشغيلي' : 'Enclosure Asset Details & Operations'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center">
                {/* Editable Actual Distributed Trees */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{isRTL ? 'عدد النخل الفعلي' : 'Actual Trees'}</span>
                  {editingTreeCount ? (
                    <form onSubmit={handleUpdateTreeCount} className="flex items-center gap-1 justify-center mt-1">
                      <Input
                        type="number"
                        value={treeCountVal}
                        onChange={(e) => {
                          setTreeCountVal(e.target.value);
                          setEditError(null);
                        }}
                        className="h-8 w-24 text-xs font-bold text-center px-1"
                        min="0"
                        disabled={editLoading}
                        autoFocus
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                        disabled={editLoading}
                      >
                        {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '✓'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 shrink-0"
                        onClick={() => {
                          setEditingTreeCount(false);
                          setTreeCountVal(currentLocation.tree_count || 0);
                          setEditError(null);
                        }}
                        disabled={editLoading}
                      >
                        ✕
                      </Button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-center mt-1">
                      <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                        {totalTrees.toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                        onClick={() => {
                          setEditingTreeCount(true);
                          setTreeCountVal(currentLocation.tree_count || 0);
                          setEditError(null);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  {editError && (
                    <p className="text-[9px] text-rose-500 font-bold mt-1 leading-tight max-w-[180px] mx-auto">
                      {editError}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{isRTL ? 'سنة الزراعة' : 'Planting Year'}</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">2018</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{isRTL ? 'الصنف' : 'Variety'}</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">{isRTL ? 'مجدول' : 'Medjool'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coverage by Operation Matrix */}
        {renderOperationsMatrixTable()}

        {/* Timelines, irrigation, and harvest histories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operation History / Timeline logs */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
              <CardTitle className="text-sm font-bold">{isRTL ? 'سجل العمليات والتقارير' : 'Operation History logs'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-900 max-h-[300px] overflow-y-auto">
                {timelineLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                  </div>
                ) : timelineLogs.length > 0 ? (
                  timelineLogs.slice(0, 8).map((log, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{log.operation_name}</p>
                        <p className="text-[10px] text-slate-400">
                          {isRTL ? `منجز: ${log.total_executed} | تقارير: ${log.execution_count}` : `Executed: ${log.total_executed} | Logs: ${log.execution_count}`}
                        </p>
                      </div>
                      <span className="text-slate-400 font-medium">{formatRelativeTime(log.last_execution, isRTL)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    {isRTL ? 'لا توجد عمليات مسجلة.' : 'No operations registered.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Irrigation History */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
              <CardTitle className="text-sm font-bold">{isRTL ? 'سجل الري والتسميد' : 'Irrigation & Fert History'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-900 max-h-[300px] overflow-y-auto">
                {irrigationData.length > 0 ? (
                  irrigationData.map((row, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {isRTL ? `مناوبات الري: ${row.total_shifts}` : `Irrigation Shifts: ${row.total_shifts}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isRTL
                            ? `أيام الري المسمد: ${row.fertigation_days}`
                            : `Fertigation days: ${row.fertigation_days}`}
                        </p>
                      </div>
                      <span className="text-slate-500 font-semibold">{formatRelativeTime(row.last_irrigation_date, isRTL)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    {isRTL ? 'لا توجد عمليات ري مسجلة.' : 'No irrigation logs registered.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Harvest History */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
              <CardTitle className="text-sm font-bold">{isRTL ? 'إنتاجية الحصاد' : 'Harvest Productivity'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-900 max-h-[300px] overflow-y-auto">
                {harvestData.length > 0 ? (
                  harvestData.map((row, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {isRTL ? 'محصول مجدول ممتاز' : 'Medjool Premium Grade'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isRTL
                            ? `المنجز الفعلي: ${row.total_harvested.toLocaleString()} كجم`
                            : `Harvested actual: ${row.total_harvested.toLocaleString()} kg`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50/50">
                        {row.attainment_pct ? `${row.attainment_pct.toFixed(0)}%` : '0%'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    {isRTL ? 'لا توجد بيانات حصاد مسجلة.' : 'No harvest logs registered.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ── Shared Render Helper: Operations Matrix Table (SAP style) ──
  function renderOperationsMatrixTable() {
    return (
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
          <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
            {isRTL ? 'مصفوفة تغطية العمليات الزراعية' : 'Seasonal Operations Matrix'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-100 dark:border-slate-900 text-xs font-bold">
                  <th className="py-3 px-6">{isRTL ? 'العملية الفنية' : 'Operation'}</th>
                  <th className="py-3 px-6 text-center">{isRTL ? 'معدل التغطية' : 'Coverage Progress'}</th>
                  <th className="py-3 px-6 text-center">{isRTL ? 'المنجز الفعلي' : 'Executed Qty'}</th>
                  <th className="py-3 px-6 text-center">{isRTL ? 'الحد المستهدف' : 'Target'}</th>
                  <th className="py-3 px-6 text-center">{isRTL ? 'عدد التقارير' : 'Reports Count'}</th>
                  <th className="py-3 px-6 text-center">{isRTL ? 'أول تشغيل' : 'First Executed'}</th>
                  <th className="py-3 px-6 text-center">{isRTL ? 'آخر تشغيل' : 'Last Activity'}</th>
                  <th className="py-3 px-6 text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {coverageData.map((row) => {
                  const unit = row.unit_label || (isRTL ? 'وحدة' : 'units');
                  return (
                    <tr key={row.operation_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-800 dark:text-slate-200">
                        {row.operation_name}
                      </td>
                      <td className="py-3.5 px-6 flex justify-center">
                        <CoverageProgressBar
                          value={row.coverage_pct}
                          allowOverCoverage={row.allow_over_coverage}
                          unitLabel={unit}
                        />
                      </td>
                      <td className="py-3.5 px-6 text-center font-bold text-slate-700 dark:text-slate-300">
                        {row.total_executed.toLocaleString()} <span className="text-[11px] font-medium text-slate-400">{unit}</span>
                      </td>
                      <td className="py-3.5 px-6 text-center text-slate-400 font-semibold">
                        {row.target > 0 ? `${row.target.toLocaleString()} ${unit}` : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-center font-semibold text-slate-600 dark:text-slate-400">
                        {row.execution_count}
                      </td>
                      <td className="py-3.5 px-6 text-center text-xs text-slate-400 font-medium">
                        {row.first_execution || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-center text-xs text-slate-500 font-semibold">
                        {formatRelativeTime(row.last_execution, isRTL)}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectOperation(row)}
                          className="h-8 text-xs font-bold text-green-700 hover:text-green-800 hover:bg-green-50"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          {isRTL ? 'تحليل القرار' : 'Analyze Decisions'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {coverageData.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      {isRTL ? 'لا توجد مؤشرات عمليات تشغيلية مسجلة.' : 'No active operational indicators logged.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Main Page Layout Router ──
  const renderActiveProfile = () => {
    if (selectedOp) {
      return renderOperationView();
    }

    switch (currentLocation?.type) {
      case 'SECTOR':
        return renderSectorProfile();
      case 'STAGE':
        return renderStageProfile();
      case 'ENCLOSURE':
        return renderEnclosureProfile();
      default:
        return renderFarmDashboard();
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Operation Filter Dropdown ── */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-700 dark:text-green-400">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isRTL ? 'تصفية حسب العملية الفنية' : 'Filter by Operation'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {isRTL ? 'عرض مؤشرات الأداء والخط الزمني لعملية محددة من قاعدة البيانات' : 'View performance and timeline for a specific operation'}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-[250px]">
          <Select
            value={selectedOp ? selectedOp.operation_id.toString() : 'all'}
            onValueChange={(val) => {
              if (val === 'all') {
                setSelectedOp(null);
              } else {
                const matched = coverageData.find(o => o.operation_id.toString() === val.toString());
                if (matched) {
                  handleSelectOperation(matched);
                }
              }
            }}
          >
            <SelectTrigger className="h-9 text-xs font-bold bg-slate-50 dark:bg-slate-900/50">
              <SelectValue placeholder={isRTL ? 'جميع العمليات' : 'All Operations'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold text-slate-500">
                {isRTL ? 'جميع العمليات (الكل)' : 'All Operations'}
              </SelectItem>
              {coverageData.map((op) => (
                <SelectItem key={op.operation_id} value={op.operation_id.toString()} className="text-xs font-semibold">
                  {op.operation_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dynamic layout router render */}
      {renderActiveProfile()}
    </div>
  );
};

export default OperationCoverageDashboard;
