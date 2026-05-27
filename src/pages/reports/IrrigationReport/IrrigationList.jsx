import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Plus,
  User,
  MapPin,
  Users,
  Search,
  FilterX,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  Paperclip,
  RefreshCcw,
  FileDown,
  Loader2,
  Sprout,
  Droplets,
  Calendar,
  AlertCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';

import api from '../../../services/api';
import { reportsApi } from '../../../services/reportsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AttachmentGallery from '../shared/AttachmentGallery';
import IrrigationDetailDrawer from './components/IrrigationDetailDrawer';
import { cn } from '../../../lib/utils';

dayjs.extend(relativeTime);
dayjs.locale('ar');

const IrrigationList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalReports: 0,
    totalShifts: 0,
    totalHours: 0,
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    engineers: [],
    stages: [],
  });

  const [filters, setFilters] = useState({
    search: '',
    start_date: '',
    end_date: '',
    engineer: '',
    phase: '',
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleReportClick = (id) => {
    setSelectedReportId(id);
    setIsDrawerOpen(true);
  };

  const toggleRow = (id, e) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all'));
      params.page = page;

      const res = await reportsApi.getIrrigations(params);

      if (res.data.results) {
        setReports(res.data.results);
        setTotalPages(Math.ceil(res.data.count / 10));
        
        // Calculate stats
        const totalCount = res.data.count || 0;
        const sampleShifts = res.data.results.reduce((sum, r) => sum + (parseInt(r.total_shifts) || 0), 0);
        const sampleHours = res.data.results.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0);
        setStats({
          totalReports: totalCount,
          totalShifts: sampleShifts,
          totalHours: sampleHours.toFixed(1),
        });
      } else {
        const list = res.data || [];
        setReports(list);
        setTotalPages(1);
        
        const sumShifts = list.reduce((sum, r) => sum + (parseInt(r.total_shifts) || 0), 0);
        const sumHours = list.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0);
        setStats({
          totalReports: list.length,
          totalShifts: sumShifts,
          totalHours: sumHours.toFixed(1),
        });
      }
    } catch (err) {
      console.error('Error fetching irrigation reports:', err);
      setError('فشل في جلب تقارير الري والتسميد.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذا التقرير نهائياً؟')) return;
    
    try {
      setDeleteLoading(true);
      await reportsApi.deleteIrrigation(id);
      await fetchReports();
    } catch (err) {
      console.error('Failed to delete report:', err);
      setError('فشل في حذف تقرير الري.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [engRes, stageRes] = await Promise.allSettled([
          reportsApi.getEngineers(),
          reportsApi.getLocationNodes("STAGE"),
        ]);
        
        const engineers = engRes.status === 'fulfilled' ? (engRes.value.data.results || engRes.value.data || []) : [];
        const stages = stageRes.status === 'fulfilled' ? (stageRes.value.data.results || stageRes.value.data || []) : [];
        
        setFilterOptions({ engineers, stages });
      } catch (err) {
        console.error('Failure initializing filters:', err);
      }
    };
    loadFilters();
  }, []);

  // Refetch when filters/page changes
  useEffect(() => {
    fetchReports();
  }, [filters, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      start_date: '',
      end_date: '',
      engineer: '',
      phase: '',
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 text-right" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-500">
              <Droplets className="w-8 h-8" />
            </div>
            سجل دورات الري والتسميد
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-lg">
            إدارة ومتابعة دورات الري، إضافة الأسمدة والمبيدات، وتوزيع العمالة بالموقع
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={fetchReports} 
            className="rounded-2xl h-14 w-14 p-0 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-all bg-white dark:bg-slate-900"
          >
            <RefreshCcw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link to="new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 h-14 rounded-2xl shadow-xl shadow-blue-600/20">
              <Plus className="mr-2 h-6 w-6" />
              تسجيل دورة جديدة
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي دورات الري</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
              {stats.totalReports} <span className="text-base text-slate-400 dark:text-slate-500 font-bold">دورة</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي تحويلات الري</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-500">
              {stats.totalShifts} <span className="text-base text-blue-450 dark:text-blue-500/70 font-bold">تحويلة</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي الساعات التشغيلية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
              {stats.totalHours} <span className="text-base text-emerald-450 dark:text-emerald-500/70 font-bold">ساعة</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
        {/* Filters Top Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-grow min-w-[280px]">
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="البحث ببيانات التقرير أو ملاحظات..."
                className="pl-3 pr-9 h-11 border-slate-200 dark:border-slate-700 font-bold bg-slate-50/50 dark:bg-transparent rounded-xl focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
              />
            </div>
            
            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={filters.engineer || 'all'} onValueChange={(val) => setFilters({ ...filters, engineer: val })}>
                <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 font-bold bg-transparent rounded-xl w-[180px]" dir="rtl">
                  <SelectValue placeholder="المهندس المسؤول" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل المهندسين</SelectItem>
                  {filterOptions.engineers.map((eng) => (
                    <SelectItem key={eng.id} value={eng.id.toString()}>{eng.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.phase || 'all'} onValueChange={(val) => setFilters({ ...filters, phase: val })}>
                <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 font-bold bg-transparent rounded-xl w-[180px]" dir="rtl">
                  <SelectValue placeholder="المرحلة التشغيلية" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل المراحل</SelectItem>
                  {filterOptions.stages.map((stg) => (
                    <SelectItem key={stg.id} value={stg.id.toString()}>{stg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="h-11 border-rose-100 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl px-4 font-bold"
              >
                <FilterX className="w-4 h-4 ml-2" />
                مسح
              </Button>
              <Button
                onClick={fetchReports}
                className="h-11 bg-blue-600 hover:bg-blue-700 font-black shadow-lg shadow-blue-600/10 px-8 rounded-xl gap-2"
              >
                <Search className="w-4 h-4" />
                بحث
              </Button>
            </div>
          </div>
          
          {/* Date filter row */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-3">
            <div className="flex items-center gap-2 lg:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 mr-2 shrink-0">من:</span>
              <Input
                type="date"
                className="h-8 border-none font-bold text-slate-600 dark:text-slate-300 bg-transparent shadow-none"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
              <span className="text-xs font-bold text-slate-500 mx-2 shrink-0">إلى:</span>
              <Input
                type="date"
                className="h-8 border-none font-bold text-slate-600 dark:text-slate-300 bg-transparent shadow-none"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <CardContent className="p-0 bg-white dark:bg-slate-900">
          <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {reports.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl m-6">
                <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-slate-600 dark:text-slate-400 font-bold text-lg">لا توجد تقارير ري وتسميد مطابقة</h3>
                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-1">جرب تغيير فلاتر البحث أو تسجيل دورة ري جديدة</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-right border-collapse" dir="rtl">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-400 text-xs font-black bg-slate-50 dark:bg-slate-950/60">
                      <th className="p-4 w-12 text-center"></th>
                      <th className="p-4 w-20">المعرف</th>
                      <th className="p-4">تاريخ المناوبة</th>
                      <th className="p-4">المهندس المسؤول</th>
                      <th className="p-4">ساعات الري الإجمالية</th>
                      <th className="p-4">عدد التحويلات</th>
                      <th className="p-4">مع تسميد؟</th>
                      <th className="p-4">العمالة الإجمالية</th>
                      <th className="p-4">المرفقات</th>
                      <th className="p-4 text-center w-24">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60">
                    {reports.map((report) => {
                      const isExpanded = !!expandedRows[report.id];
                      
                      // Robust workers calculation (fallback to individual labor entries if global counts are 0)
                      const companyLaborCount = report.labor_entries?.filter(e => e.worker_type === 'COMPANY').length || 0;
                      const contractorLaborCount = report.labor_entries?.filter(e => e.worker_type === 'CONTRACTOR').length || 0;
                      const companyWorkers = companyLaborCount > 0 ? companyLaborCount : (report.company_workers || 0);
                      const contractorWorkers = contractorLaborCount > 0 ? contractorLaborCount : (report.contractor_workers || 0);
                      const totalWorkers = companyWorkers + contractorWorkers;

                      return (
                        <React.Fragment key={report.id}>
                          <tr
                            className={cn(
                              "hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer border-b border-slate-100 dark:border-slate-855/40",
                              isExpanded && "bg-slate-50/40 dark:bg-slate-950/20"
                            )}
                            onClick={() => handleReportClick(report.id)}
                          >
                            {/* Chevron Expand/Collapse Button */}
                            <td className="p-4 text-center" onClick={(e) => toggleRow(report.id, e)}>
                              <button className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>

                            {/* ID */}
                            <td className="p-4 font-mono text-xs font-bold text-slate-455 dark:text-slate-500">
                              #{report.id}
                            </td>

                            {/* Date */}
                            <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                              {report.date ? dayjs(report.date).format('DD MMM YYYY') : '-'}
                            </td>

                            {/* Responsible Engineer */}
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7 border border-slate-200 dark:border-slate-850">
                                  <AvatarFallback className="text-[9px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-355">
                                    {report.engineer_name ? report.engineer_name.substring(0, 2) : 'مه'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-355">
                                  {report.engineer_name || 'غير مسجل'}
                                </span>
                              </div>
                            </td>

                            {/* Total Hours */}
                            <td className="p-4">
                              <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                <span>{report.total_hours} ساعة</span>
                              </div>
                            </td>

                            {/* Total Shifts */}
                            <td className="p-4">
                              <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                                <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{report.total_shifts} تحويلات</span>
                              </div>
                            </td>

                            {/* Fertilized? */}
                            <td className="p-4">
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-[10px] font-black py-0.5 px-2.5 rounded-lg border-0 shadow-none", 
                                  report.is_fertilized 
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450" 
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                )}
                              >
                                {report.is_fertilized ? 'نعم' : 'لا'}
                              </Badge>
                            </td>

                            {/* Labor Count */}
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-855 dark:text-slate-200">
                                  {totalWorkers} عمال
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 leading-tight">
                                  (شركة: {companyWorkers} | مقاول: {contractorWorkers})
                                </span>
                              </div>
                            </td>

                            {/* Attachments Indicator */}
                            <td className="p-4">
                              {report.attachments && report.attachments.length > 0 ? (
                                <Badge variant="outline" className="gap-1 border-purple-250 bg-purple-50 text-purple-700 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-400 text-[10px] font-extrabold py-0.5 px-2 select-none">
                                  <Paperclip className="w-3 h-3" />
                                  {report.attachments.length}
                                </Badge>
                              ) : (
                                <span className="text-xs font-bold text-slate-400">-</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  onClick={() => handleReportClick(report.id)}
                                  title="عرض التفاصيل"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                                  onClick={() => navigate(`/reports/irrigation/${report.id}/edit`)}
                                  title="تعديل"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg text-red-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                                  onClick={(e) => handleDelete(report.id, e)}
                                  disabled={deleteLoading}
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {/* Collapsible Row Panel */}
                          {isExpanded && (
                            <tr className="bg-slate-50/20 dark:bg-slate-950/40">
                              <td colSpan={10} className="p-6 border-b border-slate-200 dark:border-slate-850">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
                                  {/* Shift details and fertilizers */}
                                  <div className="lg:col-span-2 space-y-6">
                                    <div className="space-y-4">
                                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                                        <Sprout className="w-4 h-4 text-emerald-600" />
                                        تفاصيل التحويلات والمواد المضافة
                                      </h4>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {report.details && report.details.length > 0 ? (
                                          report.details.map((detail, idx) => (
                                            <div key={detail.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                              <div className="bg-slate-50/80 dark:bg-slate-850 px-4 py-2 border-b border-slate-200 dark:border-slate-750 flex justify-between items-center">
                                                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200">
                                                  القطاع / المرحلة: {detail.phase_name || `مرحلة #${detail.phase}`}
                                                </span>
                                                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none font-bold text-[10px]">
                                                  {detail.shifts_count} تحويلات • {detail.hours_per_shift}س
                                                </Badge>
                                              </div>
                                              <div className="p-3 space-y-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">المواد والخلطات المضافة</p>
                                                {detail.fertilizers && detail.fertilizers.length > 0 ? (
                                                  <div className="space-y-1.5">
                                                    {detail.fertilizers.map((fert, fIdx) => (
                                                      <div key={fert.id || fIdx} className="flex justify-between items-center text-xs bg-slate-50/40 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800/80">
                                                        <span className="font-semibold text-slate-800 dark:text-slate-350">
                                                          {fert.fertilizer_item_name || fert.custom_material_name || "مادة غير محددة"}
                                                        </span>
                                                        <span className="font-extrabold text-blue-600 dark:text-blue-400">
                                                          {fert.quantity} {fert.unit || "كجم"}
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <p className="text-xs text-slate-400 italic">لا توجد مواد مضافة في هذه التحويلة</p>
                                                )}
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-xs text-slate-400 italic col-span-2">لا توجد تفاصيل للمناوبات مسجلة.</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Labor details list */}
                                    <div className="space-y-4">
                                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        سجل حركة العمالة الفردية لهذه النوبة
                                      </h4>
                                      {report.labor_entries && report.labor_entries.length > 0 ? (
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                          <table className="w-full text-right text-xs" dir="rtl">
                                            <thead>
                                              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                                                <th className="p-2.5">اسم العامل</th>
                                                <th className="p-2.5">نوع العامل</th>
                                                <th className="p-2.5">ساعات العمل القياسية</th>
                                                <th className="p-2.5">ساعات الإضافي</th>
                                                <th className="p-2.5">ملاحظات / سبب الإضافي أو الخصم</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                              {report.labor_entries.map((entry, eIdx) => (
                                                <tr key={entry.id || eIdx} className="hover:bg-slate-50/50">
                                                  <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{entry.worker_name}</td>
                                                  <td className="p-2.5">
                                                    <span className={cn(
                                                      "px-2 py-0.5 rounded text-[10px] font-bold",
                                                      entry.worker_type === "COMPANY" 
                                                        ? "bg-slate-100 text-slate-700" 
                                                        : "bg-orange-50 text-orange-700"
                                                    )}>
                                                      {entry.worker_type === "COMPANY" ? "عمالة شركة" : "عمالة مقاول"}
                                                    </span>
                                                  </td>
                                                  <td className="p-2.5 font-bold">{entry.hours} ساعة</td>
                                                  <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">+{entry.overtime || 0}س</td>
                                                  <td className="p-2.5 text-slate-500 italic">{entry.note || '—'}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400 font-bold">
                                          لم يتم إضافة تفاصيل فردية للعمالة. تم الاكتفاء بالأعداد الإجمالية.
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Notes & Attachments */}
                                  <div className="space-y-4 border-r border-slate-250 dark:border-slate-850 pr-6">
                                    <div className="space-y-2">
                                      <h5 className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider">ملاحظات المناوبة</h5>
                                      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                        {report.notes ? `"${report.notes}"` : 'لا توجد ملاحظات إضافية للمناوبة.'}
                                      </div>
                                    </div>

                                    {report.attachments && report.attachments.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                          <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                                          مرفقات التقرير ({report.attachments.length})
                                        </h5>
                                        <AttachmentGallery attachments={report.attachments} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 pb-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => page > 1 && setPage(p => p - 1)}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink 
                        onClick={() => setPage(i + 1)}
                        isActive={page === i + 1}
                        className="cursor-pointer font-bold"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => page < totalPages && setPage(p => p + 1)}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <IrrigationDetailDrawer
        reportId={selectedReportId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onDeleteSuccess={fetchReports}
      />
    </div>
  );
};

export default IrrigationList;
