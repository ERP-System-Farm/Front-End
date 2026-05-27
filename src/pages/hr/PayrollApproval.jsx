import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CheckSquare, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  XCircle,
  Briefcase,
  Search,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../../services/api';

const PayrollApproval = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // States for Tab 1 Filters and Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [revertingId, setRevertingId] = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
    setSearchQuery('');
    setTxTypeFilter('ALL');
    setDateFilter('');
    setCurrentPage(1);
    setExpandedTxId(null);
  };

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/hr/transactions/');
      setTransactions(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (err) {
      console.error("Failed to fetch payroll transactions", err);
      setErrorMessage("فشل تحميل الحركات المالية من السيرفر.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    setActionId(id);
    setErrorMessage('');
    try {
      await api.post('/hr/transactions/bulk-approve/', { transaction_ids: [id] });
      setSuccessMessage('تم اعتماد وترحيل الحركة المالية بنجاح!');
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchData();
    } catch (err) {
      setErrorMessage("فشل اعتماد الحركة المالية. الرجاء المحاولة مرة أخرى.");
    } finally {
      setActionId(null);
    }
  };

  const handleApproveAll = async () => {
    if (!window.confirm("هل أنت متأكد من رغبتك في اعتماد وترحيل جميع الحركات المعلقة دفعة واحدة؟")) {
      return;
    }
    setBulkApproving(true);
    setErrorMessage('');
    try {
      const pendingIds = transactions.filter(t => t.status === 'PENDING').map(t => t.id);
      if (pendingIds.length === 0) {
        setErrorMessage("لا توجد حركات معلقة لاعتمادها.");
        setBulkApproving(false);
        return;
      }
      await api.post('/hr/transactions/bulk-approve/', { transaction_ids: pendingIds });
      setSuccessMessage(`تم اعتماد وترحيل عدد ${pendingIds.length} حركة بنجاح!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchData();
    } catch (err) {
      setErrorMessage("فشل اعتماد الحركات. الرجاء المحاولة مرة أخرى.");
    } finally {
      setBulkApproving(false);
    }
  };

  const handleRevertTransaction = async (txId, newStatus) => {
    setRevertingId(txId);
    setErrorMessage('');
    try {
      await api.patch(`/hr/transactions/${txId}/`, { status: newStatus });
      setSuccessMessage('تم تعديل حالة الإجراء بنجاح وتحديث الحسابات الميدانية!');
      setTimeout(() => setSuccessMessage(''), 4500);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMessage("فشل تعديل حالة الإجراء. الرجاء المحاولة مرة أخرى.");
    } finally {
      setRevertingId(null);
    }
  };

  // Filter based on tabs: 0 = Pending, 1 = Approved, 2 = Rejected/Others
  const filteredTransactions = transactions.filter(t => {
    const matchesTab = activeTab === 0 
      ? t.status === 'PENDING' 
      : activeTab === 1 
        ? t.status === 'APPROVED' 
        : t.status === 'REJECTED';

    if (!matchesTab) return false;

    // Apply filters in Tab 1
    if (activeTab === 1) {
      const matchesSearch = 
        t.worker_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.period_name && t.period_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = 
        txTypeFilter === 'ALL' || 
        t.transaction_type === txTypeFilter;

      const matchesDate = 
        !dateFilter || 
        t.date === dateFilter;

      return matchesSearch && matchesType && matchesDate;
    }

    return true;
  });

  // Sort transactions by date descending (newest first), then by ID descending
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.id.localeCompare(a.id);
  });

  // Calculate pagination for Tab 1
  const itemsPerPage = 6;
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const activePage = Math.min(currentPage, totalPages || 1);
  const startIndex = (activePage - 1) * itemsPerPage;

  const displayedTransactions = activeTab === 1
    ? sortedTransactions.slice(startIndex, startIndex + itemsPerPage)
    : sortedTransactions;

  // Calculate summary metrics
  const pendingTransactions = transactions.filter(t => t.status === 'PENDING');
  const totalPendingOvertime = pendingTransactions
    .filter(t => t.transaction_type === 'OVERTIME')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalPendingDeductions = pendingTransactions
    .filter(t => t.transaction_type === 'DEDUCTION')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const netPendingImpact = totalPendingOvertime - totalPendingDeductions;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 text-right font-sans" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="h-7 w-7" />
            </span>
            اعتماد الرواتب والمستحقات (الـ HR المحاسبي)
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            مراجعة واعتماد يوميات العمل الإضافي، الحوافز، والخصومات المرفوعة من المهندسين الميدانيين وترحيلها للحسابات الختامية.
          </p>
        </div>

        {activeTab === 0 && pendingTransactions.length > 0 && (
          <button
            onClick={handleApproveAll}
            disabled={bulkApproving}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <CheckSquare className="h-4.5 w-4.5" />
            {bulkApproving ? 'جاري ترحيل الكل...' : 'اعتماد وترحيل جميع المعلقات'}
          </button>
        )}
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          {errorMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي إضافيات الرواتب المعلقة</span>
          <div className="text-2xl font-black text-emerald-600 flex items-center gap-1.5 mt-1">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            <span>+{totalPendingOvertime.toLocaleString()} ج.م</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold mt-2 block">ساعات عمل إضافية وحوافز ميدانية بانتظار الاعتماد</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي الخصومات المعلقة</span>
          <div className="text-2xl font-black text-rose-600 flex items-center gap-1.5 mt-1">
            <TrendingDown className="h-6 w-6 text-rose-500" />
            <span>-{totalPendingDeductions.toLocaleString()} ج.م</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold mt-2 block">جزاءات وغيابات ساعات مسجلة ميدانياً معلقة</span>
        </div>

        <div className={`border rounded-2xl p-5 shadow-sm ${
          netPendingImpact >= 0 
            ? 'bg-emerald-50/40 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50/40 border-rose-200 text-rose-900'
        }`}>
          <span className="text-xs font-bold text-slate-500 block mb-1">صافي القيمة المعلقة للتسوية</span>
          <div className={`text-2xl font-black flex items-center gap-1.5 mt-1 ${
            netPendingImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            <DollarSign className="h-6 w-6" />
            <span>{netPendingImpact >= 0 ? `+${netPendingImpact.toLocaleString()}` : `${netPendingImpact.toLocaleString()}`} ج.م</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold mt-2 block">الأثر المالي المتوقع على بند الرواتب للفترة الحالية</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1 mb-6 flex w-full">
        <button
          onClick={() => handleTabChange(0)}
          className={`flex-1 py-3 text-center text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 0 
              ? 'bg-amber-50 text-amber-700' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>بانتظار الاعتماد المالي</span>
          {pendingTransactions.length > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-black">
              {pendingTransactions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange(1)}
          className={`flex-1 py-3 text-center text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 1 
              ? 'bg-amber-50 text-amber-700' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span>معاملات معتمدة ومرحلة</span>
        </button>

        <button
          onClick={() => handleTabChange(2)}
          className={`flex-1 py-3 text-center text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 2 
              ? 'bg-amber-50 text-amber-700' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <XCircle className="h-4 w-4" />
          <span>حركات مرفوضة</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
          <span className="text-sm font-medium text-slate-500">جاري تحميل السجلات واليوميات الميدانية...</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-2">
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 0 ? "الحركات المالية المعلقة للمراجعة والموافقة" : activeTab === 1 ? "الحركات المالية المعتمدة والمرحلة" : "الحركات المالية المرفوضة"}
            </h2>
            <span className="text-xs font-medium text-slate-400">
              {activeTab === 1 ? `عرض ${filteredTransactions.length} حركة معتمدة` : ""}
            </span>
          </div>

          {/* Filters for Tab 1 (Approved and Posted) */}
          {activeTab === 1 && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-150 pb-5">
              {/* Search Box */}
              <div className="relative flex-1 md:flex-initial min-w-[280px]">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث باسم العامل، الملاحظات، الفترة..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pr-10 pl-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white transition-all text-right"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Date Picker Filter */}
                <div className="relative min-w-[180px]">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pr-3 pl-9 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer text-center"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => { setDateFilter(''); setCurrentPage(1); }}
                      className="absolute left-2.5 top-2.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="مسح التاريخ"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Type selector */}
                <select
                  value={txTypeFilter}
                  onChange={(e) => {
                    setTxTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">جميع الحركات (إضافي وخصومات)</option>
                  <option value="OVERTIME">إضافي راتب</option>
                  <option value="DEDUCTION">خصم مباشر</option>
                </select>
              </div>
            </div>
          )}

          {displayedTransactions.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-500 font-semibold text-sm">لا توجد حركات مالية مطابقة لتصفية البحث حالياً.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3 w-10"></th>
                    <th className="p-3">اسم العامل (اضغط للتفاصيل)</th>
                    <th className="p-3">نوع التوظيف</th>
                    <th className="p-3">الفترة</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">عدد الساعات</th>
                    <th className="p-3">المبلغ المحتسب</th>
                    <th className="p-3">البيان / الملاحظة</th>
                    <th className="p-3">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTransactions.map((tx) => {
                    const isExpanded = expandedTxId === tx.id;
                    return (
                      <React.Fragment key={tx.id}>
                        {/* Main row */}
                        <tr 
                          onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                        >
                          <td className="p-3 text-center">
                            <button className="text-slate-500 p-0.5 hover:bg-slate-200 rounded transition-all">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="p-3 font-bold text-slate-800 underline decoration-dotted decoration-slate-400">{tx.worker_name}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.worker_type === 'COMPANY' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                : 'bg-purple-50 text-purple-700 border border-purple-100'
                            }`}>
                              {tx.worker_type === 'COMPANY' ? 'موظف شركة' : 'عامل مقاول'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-medium">{tx.period_name || 'الفترة الافتراضية'}</td>
                          <td className="p-3 text-slate-500 font-medium">{tx.date}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              tx.transaction_type === 'OVERTIME' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {tx.transaction_type === 'OVERTIME' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              {tx.transaction_type === 'OVERTIME' ? 'إضافي راتب' : 'خصم مباشر'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-bold">{tx.hours} ساعة</td>
                          <td className={`p-3 font-black text-base ${
                            tx.transaction_type === 'OVERTIME' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {tx.transaction_type === 'OVERTIME' ? `+${tx.amount}` : `-${tx.amount}`} ج.م
                          </td>
                          <td className="p-3 text-slate-600 font-medium max-w-[200px] truncate" title={tx.notes}>
                            {tx.notes || 'تسجيل ميداني تلقائي'}
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            {tx.status === 'PENDING' ? (
                              <button
                                onClick={() => handleApprove(tx.id)}
                                disabled={actionId === tx.id}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm disabled:opacity-50 transition-all"
                              >
                                {actionId === tx.id ? 'جاري الاعتماد...' : 'اعتماد وترحيل'}
                              </button>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                tx.status === 'APPROVED' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {tx.status === 'APPROVED' ? 'معتمد ومرحل' : 'مرفوض'}
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Dropdown Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50 border-b border-slate-200" onClick={(e) => e.stopPropagation()}>
                            <td colSpan={10} className="p-5 text-right">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-xs font-bold text-slate-500 block">المسؤول عن تسجيل هذا الإجراء في الميدان:</span>
                                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                      <Briefcase className="h-4 w-4 text-slate-400" />
                                      {tx.engineer_name || 'النظام / إدخال يدوي'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-500 block">البيان والملاحظات التفصيلية:</span>
                                    <span className="text-sm font-medium text-slate-700">
                                      {tx.notes || 'لا توجد ملاحظات تفصيلية مدونة لهذا الإجراء.'}
                                    </span>
                                  </div>
                                  {tx.report_id && (
                                    <div>
                                      <span className="text-xs font-bold text-slate-500 block">كود التقرير الميداني للرجوع إليه:</span>
                                      <span className="text-xs font-mono text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded select-all">
                                        {tx.report_id}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {tx.status === 'APPROVED' && (
                                    <>
                                      <button
                                        disabled={revertingId === tx.id}
                                        onClick={() => handleRevertTransaction(tx.id, 'PENDING')}
                                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                                      >
                                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                                        {revertingId === tx.id ? 'جاري الرجوع...' : 'الرجوع عن الاعتماد (إعادة كمعلق)'}
                                      </button>
                                      <button
                                        disabled={revertingId === tx.id}
                                        onClick={() => handleRevertTransaction(tx.id, 'REJECTED')}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                                      >
                                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                        {revertingId === tx.id ? 'جاري التعديل...' : 'رفض المعاملة'}
                                      </button>
                                    </>
                                  )}

                                  {tx.status === 'REJECTED' && (
                                    <button
                                      disabled={revertingId === tx.id}
                                      onClick={() => handleRevertTransaction(tx.id, 'PENDING')}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                                      {revertingId === tx.id ? 'جاري إعادة التعيين...' : 'إعادة تعيين كمعلقة للمراجعة'}
                                    </button>
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

          {/* Pagination Controls */}
          {activeTab === 1 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 border-t border-slate-100 pt-4" dir="rtl">
              <div className="text-xs text-slate-500 font-semibold">
                عرض {startIndex + 1} إلى {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} من أصل {filteredTransactions.length} حركة معتمدة
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      activePage === page 
                        ? 'bg-amber-600 text-white shadow-md border-amber-600' 
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default PayrollApproval;
