import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { SeasonProvider, useSeason } from './SeasonContext';
import { intelligenceApi } from '../../services/intelligenceApi';
import OperationCoverageDashboard from './OperationCoverageDashboard';
import {
  Tractor,
  LayoutGrid,
  Layers,
  Mountain,
  ChevronRight,
  RefreshCw,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

// Helper to find path to active node in the tree
const findPathInTree = (nodes, targetId, path = []) => {
  if (!nodes || nodes.length === 0) return null;
  for (const node of nodes) {
    if (node.id.toString() === targetId.toString()) {
      return [...path, node];
    }
    if (node.children && node.children.length > 0) {
      const found = findPathInTree(node.children, targetId, [...path, node]);
      if (found) return found;
    }
  }
  return null;
};

const DashboardShell = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { activeSeason, seasons, setActiveSeason, isLoading: seasonLoading } = useSeason();

  const [searchParams, setSearchParams] = useSearchParams();
  const locationParam = searchParams.get('location');

  const [treeData, setTreeData] = useState([]);
  const [flatNodes, setFlatNodes] = useState([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [timeFrame, setTimeFrame] = useState('season'); // 'today' | 'week' | 'month' | 'season'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load location tree
  useEffect(() => {
    const fetchTree = async () => {
      try {
        setTreeLoading(true);
        const res = await intelligenceApi.getFarmHierarchy();
        const tree = res.data.tree || [];
        setTreeData(tree);

        // Flatten nodes for quick lookup
        const flattened = [];
        const flatten = (nodes) => {
          nodes.forEach((node) => {
            flattened.push(node);
            if (node.children && node.children.length > 0) {
              flatten(node.children);
            }
          });
        };
        flatten(tree);
        setFlatNodes(flattened);
      } catch (err) {
        console.error('Failed to load location tree for intelligence:', err);
      } finally {
        setTreeLoading(false);
      }
    };
    fetchTree();
  }, [refreshTrigger]);

  // Sync query parameter `location` to currentLocation state
  useEffect(() => {
    if (flatNodes.length > 0) {
      if (locationParam) {
        const matchedNode = flatNodes.find((n) => n.id.toString() === locationParam.toString());
        if (matchedNode) {
          setCurrentLocation(matchedNode);
        } else {
          setCurrentLocation(null);
        }
      } else {
        setCurrentLocation(null);
      }
    } else {
      setCurrentLocation(null);
    }
  }, [locationParam, flatNodes]);

  const breadcrumbs = currentLocation
    ? findPathInTree(treeData, currentLocation.id) || [currentLocation]
    : [];

  const handleLocationChange = (nodeId) => {
    const node = flatNodes.find((n) => n.id.toString() === nodeId.toString());
    if (node) {
      setSearchParams({ location: node.id.toString() });
    } else {
      setSearchParams({});
    }
  };

  const handleResetLocation = () => {
    setSearchParams({});
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'SECTOR':
        return <LayoutGrid className="w-4 h-4 text-indigo-500" />;
      case 'STAGE':
        return <Layers className="w-4 h-4 text-emerald-500" />;
      case 'ENCLOSURE':
        return <Mountain className="w-4 h-4 text-amber-500" />;
      default:
        return <Tractor className="w-4 h-4 text-green-600" />;
    }
  };

  // Determine selector paths
  const activeSectorNode = breadcrumbs.find((n) => n.type === 'SECTOR') || null;
  const activeStageNode = breadcrumbs.find((n) => n.type === 'STAGE') || null;
  const activeEnclosureNode = breadcrumbs.find((n) => n.type === 'ENCLOSURE') || null;

  const selectedSectorId = activeSectorNode?.id || 'all';
  const selectedStageId = activeStageNode?.id || 'all';
  const selectedEnclosureId = activeEnclosureNode?.id || 'all';

  const sectorOptions = flatNodes.filter((n) => n.type === 'SECTOR');

  const stageOptions = useMemo(() => {
    if (selectedSectorId !== 'all') {
      return flatNodes.filter((n) => n.type === 'STAGE' && n.parent_id?.toString() === selectedSectorId.toString());
    }
    if (sectorOptions.length === 0) {
      return flatNodes.filter((n) => n.type === 'STAGE');
    }
    return [];
  }, [flatNodes, selectedSectorId, sectorOptions]);

  const enclosureOptions = useMemo(() => {
    if (selectedStageId !== 'all') {
      return flatNodes.filter((n) => n.type === 'ENCLOSURE' && n.parent_id?.toString() === selectedStageId.toString());
    }
    return [];
  }, [flatNodes, selectedStageId]);

  const isStageDisabled = selectedSectorId === 'all' && sectorOptions.length > 0;
  const isEnclosureDisabled = selectedStageId === 'all';

  if (seasonLoading || (treeLoading && treeData.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <span className="text-slate-500 text-sm font-medium">
          {isRTL ? 'جاري تحميل لوحة الذكاء التشغيلي...' : 'Loading Operations Intelligence...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tractor className="w-7 h-7 text-green-600 dark:text-green-500 animate-pulse" />
            {isRTL ? 'الذكاء التشغيلي وتحليل التغطية' : 'Operations Intelligence & Coverage'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isRTL
              ? 'تتبع كفاءة ونسب تغطية العمليات الفنية على مستوى المزرعة وهيكلها التنظيمي.'
              : 'Track efficacy and coverage indicators across the entire agricultural hierarchy.'}
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Season Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">
              {isRTL ? 'الموسم:' : 'Season:'}
            </span>
            <Select
              value={activeSeason?.id || ''}
              onValueChange={(id) => {
                const s = seasons.find((x) => x.id === id);
                if (s) setActiveSeason(s);
              }}
            >
              <SelectTrigger className="border-none bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 h-8 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-0 focus:ring-offset-0 px-2">
                <SelectValue placeholder={isRTL ? 'اختر الموسم' : 'Select Season'} />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs font-medium">
                    {s.name} ({s.status === 'OPEN' ? (isRTL ? 'مفتوح' : 'Open') : (isRTL ? 'مغلق' : 'Closed')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Frame Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
            {[
              { id: 'today', label: isRTL ? 'اليوم' : 'Today' },
              { id: 'week', label: isRTL ? 'أسبوع' : 'Week' },
              { id: 'month', label: isRTL ? 'شهر' : 'Month' },
              { id: 'season', label: isRTL ? 'الموسم' : 'Season' },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeFrame(tf.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
                  timeFrame === tf.id
                    ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-950 dark:hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ── Linked Dropdown Hierarchy Selectors ── */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Sector Dropdown */}
          <div className="flex flex-col gap-1.5 min-w-[150px] w-full sm:w-auto">
            <Label className="text-[11px] font-extrabold text-slate-500">
              {isRTL ? 'القطاع' : 'Sector'}
            </Label>
            <Select
              value={selectedSectorId.toString()}
              onValueChange={(val) => {
                if (val === 'all') {
                  setSearchParams({});
                } else {
                  setSearchParams({ location: val });
                }
              }}
            >
              <SelectTrigger className="h-9 text-xs font-bold">
                <SelectValue placeholder={isRTL ? 'اختر القطاع' : 'Select Sector'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-bold text-slate-500">
                  {isRTL ? 'المزرعة (الكل)' : 'Global Farm'}
                </SelectItem>
                {sectorOptions.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id.toString()} className="text-xs font-semibold">
                    {sec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stage Dropdown */}
          <div className="flex flex-col gap-1.5 min-w-[150px] w-full sm:w-auto">
            <Label className="text-[11px] font-extrabold text-slate-500">
              {isRTL ? 'المرحلة' : 'Stage'}
            </Label>
            <Select
              value={selectedStageId.toString()}
              disabled={isStageDisabled}
              onValueChange={(val) => {
                if (val === 'all') {
                  setSearchParams(selectedSectorId !== 'all' ? { location: selectedSectorId } : {});
                } else {
                  setSearchParams({ location: val });
                }
              }}
            >
              <SelectTrigger className="h-9 text-xs font-bold">
                <SelectValue placeholder={isRTL ? 'اختر المرحلة' : 'Select Stage'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-bold text-slate-500">
                  {isRTL ? 'كل المراحل' : 'All Stages'}
                </SelectItem>
                {stageOptions.map((stg) => (
                  <SelectItem key={stg.id} value={stg.id.toString()} className="text-xs font-semibold">
                    {stg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enclosure Dropdown */}
          <div className="flex flex-col gap-1.5 min-w-[150px] w-full sm:w-auto">
            <Label className="text-[11px] font-extrabold text-slate-500">
              {isRTL ? 'الحوشة' : 'Enclosure'}
            </Label>
            <Select
              value={selectedEnclosureId.toString()}
              disabled={isEnclosureDisabled}
              onValueChange={(val) => {
                if (val === 'all') {
                  setSearchParams({ location: selectedStageId });
                } else {
                  setSearchParams({ location: val });
                }
              }}
            >
              <SelectTrigger className="h-9 text-xs font-bold">
                <SelectValue placeholder={isRTL ? 'اختر الحوشة' : 'Select Enclosure'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-bold text-slate-500">
                  {isRTL ? 'كل الأحواش' : 'All Enclosures'}
                </SelectItem>
                {enclosureOptions.map((enc) => (
                  <SelectItem key={enc.id} value={enc.id.toString()} className="text-xs font-semibold">
                    {enc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear selection */}
        {currentLocation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetLocation}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-extrabold self-end md:self-center"
          >
            {isRTL ? 'الرجوع للمزرعة ككل' : 'Reset to Farm View'}
          </Button>
        )}
      </div>

      {/* ── Breadcrumb Hierarchy Drill-down ── */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2 text-sm shadow-sm">
        <button
          onClick={handleResetLocation}
          className={`flex items-center gap-1.5 font-bold transition-colors ${
            breadcrumbs.length === 0
              ? 'text-green-700 dark:text-green-400 pointer-events-none'
              : 'text-slate-500 hover:text-slate-950 dark:hover:text-slate-200'
          }`}
        >
          <Tractor className="w-4 h-4" />
          <span>{isRTL ? 'المزرعة' : 'Global Farm'}</span>
        </button>

        {breadcrumbs.map((node, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={node.id}>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              <button
                onClick={() => handleLocationChange(node.id)}
                disabled={isLast}
                className={`flex items-center gap-1 font-semibold transition-colors ${
                  isLast
                    ? 'text-green-700 dark:text-green-400 cursor-default'
                    : 'text-slate-500 hover:text-slate-950 dark:hover:text-slate-200'
                }`}
              >
                {getLocationIcon(node.type)}
                <span>{node.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Main Dashboard Content ── */}
      {activeSeason ? (
        <OperationCoverageDashboard
          activeSeason={activeSeason}
          timeFrame={timeFrame}
          currentLocation={currentLocation}
          onLocationChange={handleLocationChange}
          refreshTrigger={refreshTrigger}
          treeData={treeData}
          flatNodes={flatNodes}
        />
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl text-amber-800 dark:text-amber-300 font-semibold text-center">
          {isRTL
            ? 'يرجى تهيئة أو تفعيل موسم زراعي أولاً لعرض التحليلات.'
            : 'Please configure or activate a season first to view analytics.'}
        </div>
      )}
    </div>
  );
};

const IntelligenceIndex = () => {
  return (
    <SeasonProvider>
      <DashboardShell />
    </SeasonProvider>
  );
};

export default IntelligenceIndex;
