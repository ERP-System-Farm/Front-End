import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  ShieldAlert,
  Loader2,
  Search,
  FilterX,
  RefreshCcw,
  Calendar,
  User,
  MapPin,
  Beaker,
  Users,
  Eye,
  Trash2,
  AlertCircle,
  Paperclip
} from 'lucide-react';
import dayjs from 'dayjs';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PestControlDetailDrawer from './components/PestControlDetailDrawer';
import { cn } from '../../../lib/utils';

dayjs.locale('ar');

export default function PestControlList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const reportId = searchParams.get('id');
    if (reportId) {
      setSelectedReportId(Number(reportId));
      setIsDrawerOpen(true);
    }
  }, [searchParams]);

  // Stats
  const [stats, setStats] = useState({
    totalReports: 0,
    totalQuantity: 0,
    totalLocations: 0,
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    engineers: [],
  });

  const [filters, setFilters] = useState({
    search: '',
    start_date: '',
    end_date: '',
    engineer: '',
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all'));
      params.page = page;

      const res = await reportsApi.getPestControls(params);

      if (res.data.results) {
        setReports(res.data.results);
        setTotalPages(Math.ceil(res.data.count / 10));
        
        // Calculate stats
        const totalCount = res.data.count || 0;
        const sumQty = res.data.results.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0);
        const sumLocs = res.data.results.reduce((sum, r) => sum + (r.allocations?.length || 0), 0);
        setStats({
          totalReports: totalCount,
          totalQuantity: sumQty.toFixed(1),
          totalLocations: sumLocs,
        });
      } else {
        const list = res.data || [];
        setReports(list);
        setTotalPages(1);
        
        const sumQty = list.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0);
        const sumLocs = list.reduce((sum, r) => sum + (r.allocations?.length || 0), 0);
        setStats({
          totalReports: list.length,
          totalQuantity: sumQty.toFixed(1),
          totalLocations: sumLocs,
        });
      }
    } catch (err) {
      console.error('Error fetching pest control reports:', err);
      setError('فشل في جلب تقارير المكافحة ووقاية النبات.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذا التقرير نهائياً؟')) return;
    
    try {
      setDeleteLoading(true);
      await reportsApi.deletePestControl(id);
      await fetchReports();
    } catch (err) {
      console.error('Failed to delete report:', err);
      setError('فشل في حذف تقرير المكافحة.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReportClick = (id) => {
    setSelectedReportId(id);
    setIsDrawerOpen(true);
  };

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const engRes = await reportsApi.getEngineers();
        const engineers = engRes.data.results || engRes.data || [];
        setFilterOptions({ engineers });
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
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 text-right" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            سجل تقارير وقاية النبات والمكافحة
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-lg">
            متابعة وإشراف على رش المبيدات ومكافحة الآفات وتوزيع عمالة المكافحة
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={fetchReports} 
            className="rounded-2xl h-14 w-14 p-0 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-amber-600 transition-all bg-white dark:bg-slate-900"
          >
            <RefreshCcw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link to="new">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg px-8 h-14 rounded-2xl shadow-xl shadow-amber-600/20">
              <Plus className="mr-2 h-6 w-6" />
              تسجيل عملية مكافحة
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
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي عمليات الرش</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
              {stats.totalReports} <span className="text-base text-slate-400 dark:text-slate-500 font-bold">عملية</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي جرعة المبيدات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-500">
              {stats.totalQuantity} <span className="text-base text-amber-450 dark:text-amber-500/70 font-bold">لتر / كجم</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي الحواش المعالجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
              {stats.totalLocations} <span className="text-base text-emerald-450 dark:text-emerald-500/70 font-bold">حوشة</span>
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
                placeholder="البحث بنوع المبيد أو ملاحظات المكافحة..."
                className="pl-3 pr-9 h-11 border-slate-200 dark:border-slate-700 font-bold bg-slate-50/50 dark:bg-transparent rounded-xl focus:ring-amber-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
              />
            </div>
            
            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={filters.engineer || 'all'} onValueChange={(val) => setFilters({ ...filters, engineer: val })}>
                <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 font-bold bg-transparent rounded-xl w-[200px]" dir="rtl">
                  <SelectValue placeholder="المهندس المسؤول" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل المهندسين</SelectItem>
                  {filterOptions.engineers.map((eng) => (
                    <SelectItem key={eng.id} value={eng.id.toString()}>{eng.name}</SelectItem>
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
                className="h-11 bg-amber-600 hover:bg-amber-700 font-black shadow-lg shadow-amber-600/10 px-8 rounded-xl gap-2"
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
                <h3 className="text-slate-600 dark:text-slate-400 font-bold text-lg">لا توجد تقارير مكافحة مطابقة</h3>
                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-1">جرب تغيير فلاتر البحث أو تسجيل عملية جديدة</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-right border-collapse" dir="rtl">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-855 text-slate-400 text-xs font-black bg-slate-50 dark:bg-slate-950/60">
                      <th className="p-4">تاريخ العملية</th>
                      <th className="p-4">المبيد المستخدم</th>
                      <th className="p-4">إجمالي الكمية</th>
                      <th className="p-4">المهندس المسؤول</th>
                      <th className="p-4">العمالة</th>
                      <th className="p-4">المواقع المستهدفة</th>
                      <th className="p-4">المرفقات</th>
                      <th className="p-4 text-center w-24">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60">
                    {reports.map((report) => {
                      const reportCompanyWorkers = report.allocations?.reduce((sum, a) => sum + (parseInt(a.allocated_workers_company) || 0), 0) || 0;
                      const reportContractorWorkers = report.allocations?.reduce((sum, a) => sum + (parseInt(a.contractor_workers) || 0), 0) || 0;
                      const totalWorkers = reportCompanyWorkers + reportContractorWorkers;

                      return (
                        <tr
                          key={report.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer border-b border-slate-100 dark:border-slate-855/40"
                          onClick={() => handleReportClick(report.id)}
                        >
                          {/* Date */}
                          <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {report.date ? dayjs(report.date).format('DD MMM YYYY - HH:mm') : '-'}
                          </td>

                          {/* Pesticide Name */}
                          <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                            {report.applied_pesticides && report.applied_pesticides.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {report.applied_pesticides.map((ap, idx) => (
                                  <span key={idx} className="block text-xs font-semibold">
                                    {ap.pesticide_item_name || ap.custom_pesticide_name || "غير محدد"}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              report.pesticide_item_name || report.custom_pesticide_name || "غير محدد"
                            )}
                          </td>

                          {/* Quantity */}
                          <td className="p-4 font-extrabold text-slate-800 dark:text-slate-200">
                            {report.applied_pesticides && report.applied_pesticides.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {report.applied_pesticides.map((ap, idx) => (
                                  <span key={idx} className="block text-xs font-semibold">
                                    {ap.quantity} لتر / كجم
                                  </span>
                                ))}
                              </div>
                            ) : (
                              `${report.quantity || 0} لتر / كجم`
                            )}
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

                          {/* Workers Count */}
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-855 dark:text-slate-200">
                                {totalWorkers} عمال
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 leading-tight">
                                (شركة: {reportCompanyWorkers} | مقاول: {reportContractorWorkers})
                              </span>
                            </div>
                          </td>

                          {/* Target Locations Count */}
                          <td className="p-4 font-bold text-slate-750 dark:text-slate-300">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{report.allocations?.length || 0} مواقع</span>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PestControlDetailDrawer
        reportId={selectedReportId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onDeleteSuccess={fetchReports}
      />
    </div>
  );
}
