import React, { useState, useEffect } from 'react';
import {
  Users,
  Wallet,
  Receipt,
  ArrowUp,
  ArrowDown,
  CircleDollarSign,
  Sliders,
  AlertCircle,
  Building,
  DollarSign,
  Plus,
  Phone,
  MapPin,
  Notebook,
  CheckCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  Tag,
  UserCheck,
  Minus,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../../components/ui/dialog";
import api from '../../services/api';

const ACTIVITY_TYPES = [
  { value: '', label: 'غير محدد' },
  { value: 'labor_supply', label: 'توريد عمالة' },
  { value: 'equipment_rental', label: 'تأجير معدات' },
  { value: 'general_contracting', label: 'مقاولات عامة' },
  { value: 'specialized_services', label: 'خدمات متخصصة' },
  { value: 'other', label: 'أخرى' },
];

const WORKER_STATUS_MAP = {
  active: { label: 'نشط', cls: 'bg-emerald-100 text-emerald-800' },
  on_leave: { label: 'إجازة', cls: 'bg-amber-100 text-amber-800' },
  terminated: { label: 'منتهي', cls: 'bg-rose-100 text-rose-800' },
};

const TX_TYPES = {
  ALL:       { label: 'الكل',               cls: 'bg-slate-100 text-slate-700' },
  EARNING:   { label: 'مستحقات أساسية',     cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  OVERTIME:  { label: 'عمل إضافي',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  DEDUCTION: { label: 'خصومات وغرامات',      cls: 'bg-rose-50 text-rose-700 border-rose-100' },
  PAYMENT:   { label: 'دفعة مسددة',          cls: 'bg-purple-50 text-purple-700 border-purple-100' },
};

const ContractorDashboard = () => {
  const [contractors, setContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openTxDialog, setOpenTxDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Workers panel
  const [showWorkers, setShowWorkers] = useState(false);

  // Transaction filters
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');

  // New contractor form
  const [newContractorForm, setNewContractorForm] = useState({
    name: '',
    rate_per_hour: '0',
    is_active: true,
    phone_number: '',
    email: '',
    address: '',
    commercial_registry: '',
    tax_card: '',
    contract_date: '',
    activity_type: '',
    notes: ''
  });

  // Edit contractor form
  const [editingContractorForm, setEditingContractorForm] = useState(null);

  // Manual transaction form
  const [txForm, setTxForm] = useState({
    transaction_type: 'PAYMENT',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // ─── Fetch contractors list ───────────────────────────────────────
  const fetchContractors = async (selectId = null) => {
    setLoadingList(true);
    setErrorMsg('');
    try {
      const res = await api.get('/reports/contractors/');
      const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
      const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      setContractors(sorted);
      if (selectId) {
        setSelectedContractor(selectId);
      } else if (sorted.length > 0) {
        setSelectedContractor(sorted[0].id);
      } else {
        setErrorMsg('لم يتم العثور على أي مقاولين مسجلين.');
      }
    } catch {
      setErrorMsg('فشل تحميل قائمة المقاولين.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchContractors(); }, []);

  // ─── Fetch dashboard ──────────────────────────────────────────────
  const fetchDashboard = async () => {
    if (!selectedContractor) return;
    setLoadingDashboard(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (txDateFrom) params.append('date_from', txDateFrom);
      if (txDateTo)   params.append('date_to',   txDateTo);
      if (txTypeFilter && txTypeFilter !== 'ALL') params.append('transaction_type', txTypeFilter);
      const res = await api.get(`/hr/contractors/${selectedContractor}/dashboard/?${params.toString()}`);
      setDashboardData(res.data);
    } catch {
      setErrorMsg('فشل تحميل الحسابات التفصيلية للمقاول المختار.');
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, [selectedContractor, txTypeFilter, txDateFrom, txDateTo]);

  // ─── Add contractor ───────────────────────────────────────────────
  const handleOpenAddDialog = () => {
    setNewContractorForm({
      name: '', rate_per_hour: '0', is_active: true,
      phone_number: '', email: '', address: '',
      commercial_registry: '', tax_card: '',
      contract_date: '', activity_type: '', notes: ''
    });
    setFormError('');
    setOpenAddDialog(true);
  };

  const handleCreateContractor = async () => {
    if (!newContractorForm.name.trim()) { setFormError('اسم المقاول حقل مطلوب.'); return; }
    setFormLoading(true); setFormError('');
    try {
      const payload = {
        name: newContractorForm.name.trim(),
        rate_per_hour: parseFloat(newContractorForm.rate_per_hour) || 0,
        is_active: newContractorForm.is_active,
        phone_number: newContractorForm.phone_number.trim(),
        email: newContractorForm.email.trim(),
        address: newContractorForm.address.trim(),
        commercial_registry: newContractorForm.commercial_registry.trim(),
        tax_card: newContractorForm.tax_card.trim(),
        contract_date: newContractorForm.contract_date || null,
        activity_type: newContractorForm.activity_type,
        notes: newContractorForm.notes.trim()
      };
      const res = await api.post('/reports/contractors/', payload);
      setOpenAddDialog(false);
      setSuccessMsg('تم إضافة المقاول الجديد بنجاح!');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (res.data?.id) await fetchContractors(res.data.id);
      else await fetchContractors();
    } catch {
      setFormError('حدث خطأ أثناء إضافة المقاول. الرجاء التأكد من صحة البيانات.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Edit contractor ──────────────────────────────────────────────
  const handleOpenEditDialog = (contractor) => {
    setEditingContractorForm({
      ...contractor,
      rate_per_hour: String(contractor.rate_per_hour || '0'),
      phone_number: contractor.phone_number || '',
      email: contractor.email || '',
      address: contractor.address || '',
      commercial_registry: contractor.commercial_registry || '',
      tax_card: contractor.tax_card || '',
      contract_date: contractor.contract_date || '',
      activity_type: contractor.activity_type || '',
      notes: contractor.notes || ''
    });
    setFormError('');
    setOpenEditDialog(true);
  };

  const handleUpdateContractor = async () => {
    if (!editingContractorForm.name.trim()) { setFormError('اسم المقاول حقل مطلوب.'); return; }
    setFormLoading(true); setFormError('');
    try {
      const payload = {
        name: editingContractorForm.name.trim(),
        rate_per_hour: parseFloat(editingContractorForm.rate_per_hour) || 0,
        is_active: editingContractorForm.is_active,
        phone_number: editingContractorForm.phone_number.trim(),
        email: editingContractorForm.email.trim(),
        address: editingContractorForm.address.trim(),
        commercial_registry: editingContractorForm.commercial_registry.trim(),
        tax_card: editingContractorForm.tax_card.trim(),
        contract_date: editingContractorForm.contract_date || null,
        activity_type: editingContractorForm.activity_type,
        notes: editingContractorForm.notes.trim()
      };
      await api.patch(`/reports/contractors/${editingContractorForm.id}/`, payload);
      setOpenEditDialog(false);
      setSuccessMsg('تم تحديث بيانات المقاول بنجاح!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchContractors(selectedContractor);
      await fetchDashboard();
    } catch {
      setFormError('حدث خطأ أثناء تعديل بيانات المقاول.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Manual transaction ───────────────────────────────────────────
  const handleOpenTxDialog = () => {
    setTxForm({
      transaction_type: 'PAYMENT',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setFormError('');
    setOpenTxDialog(true);
  };

  const handleCreateTransaction = async () => {
    if (!txForm.amount || parseFloat(txForm.amount) <= 0) {
      setFormError('يجب إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }
    if (!txForm.date) { setFormError('يجب تحديد تاريخ.'); return; }
    setFormLoading(true); setFormError('');
    try {
      await api.post('/hr/contractors/ledger/create/', {
        contractor_id: selectedContractor,
        transaction_type: txForm.transaction_type,
        amount: parseFloat(txForm.amount),
        date: txForm.date,
        notes: txForm.notes.trim()
      });
      setOpenTxDialog(false);
      setSuccessMsg('تم تسجيل الحركة المالية بنجاح!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchDashboard();
    } catch {
      setFormError('حدث خطأ أثناء تسجيل الحركة المالية.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────
  const resetFilters = () => {
    setTxTypeFilter('ALL');
    setTxDateFrom('');
    setTxDateTo('');
  };

  // ─── Loading state ────────────────────────────────────────────────
  if (loadingList) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 w-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        <span className="text-sm font-medium text-slate-500">جاري تحميل قائمة المقاولين...</span>
      </div>
    );
  }

  const contractor = dashboardData?.contractor;
  const summary    = dashboardData?.summary;
  const txList     = dashboardData?.transactions || [];
  const workerList = dashboardData?.workers || [];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 text-right font-sans" dir="rtl">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Building className="h-7 w-7" />
            </span>
            مستحقات وحسابات المقاولين
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            رصد عمالة المقاولين، والمستحقات، والخصومات، والتدفقات المالية.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          {contractors.length > 0 && (
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-extrabold text-slate-500 mb-1.5 block">المقاول النشط</label>
              <select
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={handleOpenAddDialog}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 h-[44px]"
          >
            <Plus className="h-4 w-4" />
            إضافة مقاول جديد
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {loadingDashboard ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          <span className="text-sm font-medium text-slate-500">جاري تحميل المستحقات والكشف...</span>
        </div>
      ) : dashboardData ? (
        <div className="space-y-6">

          {/* ── Contractor Profile Card ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header bar */}
            <div className="bg-gradient-to-l from-emerald-50 to-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Building className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">{contractor?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      contractor?.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {contractor?.is_active ? 'نشط ومستمر' : 'موقوف'}
                    </span>
                    {contractor?.activity_type_display && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                        {contractor.activity_type_display}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleOpenTxDialog}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  تسجيل حركة مالية
                </button>
                <button
                  onClick={() => handleOpenEditDialog(contractor)}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
                >
                  تعديل الملف
                </button>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0 divide-x divide-x-reverse divide-slate-100">
              {/* سعر الساعة */}
              <ProfileCell icon={<Sliders className="h-4 w-4 text-emerald-500" />} label="سعر الساعة التعاقدي">
                <span className="font-black text-emerald-700">{contractor?.rate_per_hour} ج.م/ساعة</span>
              </ProfileCell>

              {/* الهاتف */}
              <ProfileCell icon={<Phone className="h-4 w-4 text-slate-400" />} label="رقم الهاتف">
                {contractor?.phone_number || <span className="text-slate-300 italic text-xs">غير مسجل</span>}
              </ProfileCell>

              {/* العنوان */}
              <ProfileCell icon={<MapPin className="h-4 w-4 text-slate-400" />} label="العنوان / المقر">
                {contractor?.address || <span className="text-slate-300 italic text-xs">غير مسجل</span>}
              </ProfileCell>

              {/* تاريخ التعاقد */}
              <ProfileCell icon={<Calendar className="h-4 w-4 text-slate-400" />} label="تاريخ التعاقد">
                {contractor?.contract_date || <span className="text-slate-300 italic text-xs">غير محدد</span>}
              </ProfileCell>

              {/* الملاحظات */}
              <ProfileCell icon={<Notebook className="h-4 w-4 text-slate-400" />} label="ملاحظات الملف">
                {contractor?.notes || <span className="text-slate-300 italic text-xs">لا توجد</span>}
              </ProfileCell>
            </div>
          </div>

          {/* ── Summary Stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="h-8 w-8" />}
              color="emerald"
              label="عدد العمال"
              value={`${summary?.total_workers} عمال`}
              sub="إجمالي العمال المسجلين"
            />
            <StatCard
              icon={<ArrowUp className="h-8 w-8" />}
              color="blue"
              label="إجمالي المستحقات"
              value={`${summary?.total_earnings?.toLocaleString()} ج.م`}
              sub="اليوميات والإضافي"
            />
            <StatCard
              icon={<ArrowDown className="h-8 w-8" />}
              color="rose"
              label="إجمالي الخصومات"
              value={`${summary?.total_deductions?.toLocaleString()} ج.م`}
              sub="الجزاءات والاستقطاعات"
            />
            <StatCard
              icon={<CircleDollarSign className="h-8 w-8" />}
              color="purple"
              label="إجمالي المسدد"
              value={`${summary?.total_paid?.toLocaleString()} ج.م`}
              sub="الدفعات المحولة"
            />
          </div>

          {/* ── Net Balance ── */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:justify-between md:items-center gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>
            <div className="space-y-2 max-w-xl">
              <h3 className="text-lg md:text-xl font-black text-emerald-400 flex items-center gap-2">
                <Wallet className="h-6 w-6 text-amber-400" />
                صافي المستحقات المتبقية في ذمة الشركة
              </h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                المستحقات الصافية المعلقة بعد احتساب ساعات التشغيل وتنزيل الجزاءات والدفعات المسددة.
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl md:text-5xl font-black tracking-tight ${
                (summary?.total_dues || 0) >= 0 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {summary?.total_dues?.toLocaleString()} <span className="text-lg md:text-2xl font-bold">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold block mt-1">صافي الرصيد المتبقي</span>
            </div>
          </div>

          {/* ── Workers Panel ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setShowWorkers(!showWorkers)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-slate-800">
                  العمال التابعون للمقاول
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2 py-0.5 rounded-full">
                  {workerList.length}
                </span>
              </div>
              {showWorkers ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {showWorkers && (
              <div className="border-t border-slate-100">
                {workerList.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 font-semibold text-sm">لا يوجد عمال مسجلون تحت هذا المقاول حالياً.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 text-xs">
                          <th className="p-3">اسم العامل</th>
                          <th className="p-3">رقم الكود</th>
                          <th className="p-3">الرقم القومي</th>
                          <th className="p-3">تاريخ التعيين</th>
                          <th className="p-3">الراتب الشهري</th>
                          <th className="p-3">الأجر الساعي</th>
                          <th className="p-3">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workerList.map((w) => {
                          const st = WORKER_STATUS_MAP[w.status] || { label: w.status, cls: 'bg-slate-100 text-slate-600' };
                          return (
                            <tr key={w.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-800">{w.name}</td>
                              <td className="p-3 font-mono text-slate-500">{w.badge_number || '-'}</td>
                              <td className="p-3 font-mono text-slate-500">{w.national_id || '-'}</td>
                              <td className="p-3 text-slate-500">{w.hire_date || '-'}</td>
                              <td className="p-3 font-bold text-slate-700">{w.monthly_salary?.toLocaleString()} ج.م</td>
                              <td className="p-3 font-bold text-emerald-700">{Number(w.hourly_rate).toFixed(2)} ج.م/ساعة</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>
                                  {st.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Transactions Ledger ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header + Filters */}
            <div className="p-5 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-slate-500" />
                  كشف حركة الحساب التفصيلي (دفتر الأستاذ)
                </h3>
                <button
                  onClick={handleOpenTxDialog}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm self-start"
                >
                  <Plus className="h-3.5 w-3.5" />
                  تسجيل دفعة / خصم
                </button>
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap gap-3 items-end">
                {/* Type Filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">نوع الحركة</label>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(TX_TYPES).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => setTxTypeFilter(key)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                          txTypeFilter === key
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date From */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">من تاريخ</label>
                  <input
                    type="date"
                    value={txDateFrom}
                    onChange={(e) => setTxDateFrom(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    value={txDateTo}
                    onChange={(e) => setTxDateTo(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>

                {/* Reset */}
                {(txTypeFilter !== 'ALL' || txDateFrom || txDateTo) && (
                  <button
                    onClick={resetFilters}
                    className="px-3 py-1.5 border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100 transition-all flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    إعادة ضبط
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            {txList.length === 0 ? (
              <div className="text-center py-16 bg-slate-50">
                <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 font-semibold text-sm">لا توجد حركات مالية تطابق الفلتر المحدد.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs">
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">نوع الحركة</th>
                      <th className="p-3">عدد الساعات</th>
                      <th className="p-3">سعر الساعة</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">المهندس</th>
                      <th className="p-3">الموقع</th>
                      <th className="p-3">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txList.map((tx) => {
                      const typeInfo = TX_TYPES[tx.transaction_type] || TX_TYPES['EARNING'];
                      const isDebit  = ['DEDUCTION', 'PAYMENT'].includes(tx.transaction_type);
                      return (
                        <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-slate-500">{tx.date}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeInfo.cls}`}>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-700">{tx.hours > 0 ? `${tx.hours} ساعة` : '—'}</td>
                          <td className="p-3 font-bold text-slate-600">{tx.rate > 0 ? `${tx.rate} ج.م` : '—'}</td>
                          <td className={`p-3 font-black text-base ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isDebit ? '-' : '+'}{Number(tx.amount).toLocaleString()} ج.م
                          </td>
                          <td className="p-3 font-bold text-slate-700">{tx.engineer_name || 'النظام التلقائي'}</td>
                          <td className="p-3 font-semibold text-slate-500">{tx.location_name || '—'}</td>
                          <td className="p-3 text-slate-500 font-medium max-w-[200px] truncate" title={tx.notes}>
                            {tx.notes || 'تسجيل تلقائي'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold text-sm">الرجاء اختيار مقاول لعرض مستحقاته.</p>
        </div>
      )}

      {/* ═══════════════ DIALOGS ═══════════════ */}

      {/* 1. Add Contractor */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-emerald-600 flex items-center gap-2">
              <Building className="h-5 w-5" />
              تسجيل مقاول جديد
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              أدخل البيانات الكاملة لتسجيل ملف مقاول جديد في النظام.
            </DialogDescription>
          </DialogHeader>

          {formError && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold">{formError}</div>}

          <ContractorFormFields form={newContractorForm} setForm={setNewContractorForm} isEdit={false} />

          <DialogFooter className="flex gap-2 justify-start border-t border-slate-100 pt-4 mt-6">
            <button
              onClick={handleCreateContractor}
              disabled={formLoading || !newContractorForm.name}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-all shadow disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'تسجيل المقاول'}
            </button>
            <button onClick={() => setOpenAddDialog(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-2.5 rounded-lg transition-all">
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Contractor */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-sky-600 flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              تعديل بيانات ملف المقاول
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              تعديل بيانات المقاول — الأسعار، البطاقات الرسمية، التواصل.
            </DialogDescription>
          </DialogHeader>

          {editingContractorForm && (
            <>
              {formError && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold">{formError}</div>}
              <ContractorFormFields form={editingContractorForm} setForm={setEditingContractorForm} isEdit={true} />
              <DialogFooter className="flex gap-2 justify-start border-t border-slate-100 pt-4 mt-6">
                <button
                  onClick={handleUpdateContractor}
                  disabled={formLoading || !editingContractorForm?.name}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-all shadow disabled:opacity-50"
                >
                  {formLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button onClick={() => setOpenEditDialog(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-2.5 rounded-lg transition-all">
                  إلغاء
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. Manual Transaction Dialog */}
      <Dialog open={openTxDialog} onOpenChange={setOpenTxDialog}>
        <DialogContent className="max-w-lg text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-amber-600 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              تسجيل حركة مالية يدوية
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              سجّل دفعة مسددة للمقاول أو خصماً/غرامة يدوياً على الحساب.
            </DialogDescription>
          </DialogHeader>

          {formError && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold">{formError}</div>}

          <div className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">نوع الحركة المالية</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTxForm({ ...txForm, transaction_type: 'PAYMENT' })}
                  className={`py-3 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                    txForm.transaction_type === 'PAYMENT'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <ArrowDown className="h-5 w-5" />
                  دفعة مسددة (Payment)
                </button>
                <button
                  onClick={() => setTxForm({ ...txForm, transaction_type: 'DEDUCTION' })}
                  className={`py-3 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                    txForm.transaction_type === 'DEDUCTION'
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Minus className="h-5 w-5" />
                  خصم / غرامة (Deduction)
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                المبلغ (ج.م) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={txForm.amount}
                onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                تاريخ الحركة <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={txForm.date}
                onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">ملاحظات / سبب الحركة</label>
              <textarea
                rows={3}
                placeholder={txForm.transaction_type === 'PAYMENT' ? 'مثال: دفعة أولى عن شهر مايو...' : 'مثال: خصم بسبب تأخير التسليم...'}
                value={txForm.notes}
                onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-start border-t border-slate-100 pt-4 mt-4">
            <button
              onClick={handleCreateTransaction}
              disabled={formLoading || !txForm.amount || !txForm.date}
              className={`text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-all shadow disabled:opacity-50 ${
                txForm.transaction_type === 'PAYMENT'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {formLoading ? 'جاري التسجيل...' : 'تسجيل الحركة'}
            </button>
            <button onClick={() => setOpenTxDialog(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-2.5 rounded-lg transition-all">
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

// ─── Shared Sub-components ─────────────────────────────────────────
const ProfileCell = ({ icon, label, children }) => (
  <div className="flex flex-col gap-1 p-4 border-b border-slate-50 last:border-b-0">
    <span className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1">
      {icon}
      {label}
    </span>
    <span className="font-bold text-slate-800 text-sm leading-snug">{children}</span>
  </div>
);

const StatCard = ({ icon, color, label, value, sub }) => {
  const colors = {
    emerald: 'text-emerald-600 bg-emerald-50',
    blue:    'text-blue-600 bg-blue-50',
    rose:    'text-rose-600 bg-rose-50',
    purple:  'text-purple-600 bg-purple-50',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className={`absolute left-3 top-3 opacity-[0.07] group-hover:scale-110 transition-transform ${colors[color]?.split(' ')[0]}`}>
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-400 block mb-1">{label}</span>
      <div className={`text-xl font-black mt-1 ${colors[color]?.split(' ')[0]}`}>{value}</div>
      <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{sub}</span>
    </div>
  );
};

const ContractorFormFields = ({ form, setForm, isEdit }) => {
  const ringColor = isEdit ? 'focus:ring-sky-500' : 'focus:ring-emerald-500';
  const F = ({ label, required, children }) => (
    <div>
      <label className="text-xs font-semibold text-slate-600 block mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <F label="اسم المقاول / الشركة" required>
          <input
            type="text"
            placeholder="مثال: مقاولات السلام"
            className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${ringColor} bg-white font-semibold`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </F>

        <F label="سعر ساعة العمل التعاقدي (ج.م)" required>
          <input
            type="number"
            placeholder="0.00"
            className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${ringColor} bg-white font-semibold`}
            value={form.rate_per_hour}
            onChange={(e) => setForm({ ...form, rate_per_hour: e.target.value })}
          />
        </F>

        <F label="رقم الهاتف للاتصال">
          <input
            type="text"
            placeholder="01234567890"
            className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${ringColor} bg-white font-semibold font-mono text-left`}
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          />
        </F>

        <F label="تاريخ التعاقد">
          <input
            type="date"
            className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${ringColor} bg-white font-semibold`}
            value={form.contract_date || ''}
            onChange={(e) => setForm({ ...form, contract_date: e.target.value })}
          />
        </F>

        <F label="نوع النشاط">
          <select
            className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${ringColor} bg-white font-bold text-slate-800`}
            value={form.activity_type || ''}
            onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </F>

        {isEdit && (
          <F label="حالة التعاقد">
            <select
              className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${ringColor} bg-white font-bold text-slate-800`}
              value={String(form.is_active)}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
            >
              <option value="true">نشط ويورد عمالة</option>
              <option value="false">معطل / موقوف</option>
            </select>
          </F>
        )}

        <div className={isEdit ? '' : 'col-span-2'}>
          <F label="العنوان / مقر الشركة الرئيسي">
            <input
              type="text"
              placeholder="المحافظة — المركز — تفاصيل المقر"
              className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${ringColor} bg-white font-semibold`}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </F>
        </div>

        <div className="col-span-2">
          <F label="ملاحظات وشروط إدارية">
            <textarea
              rows={2}
              placeholder="أي ملاحظات تخص شروط التوريد أو الدفع..."
              className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${ringColor} bg-white font-medium resize-none`}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </F>
        </div>
      </div>
    </div>
  );
};

export default ContractorDashboard;
