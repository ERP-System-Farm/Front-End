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
  Briefcase
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

  // Filter based on tabs: 0 = Pending, 1 = Approved, 2 = Rejected/Others
  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 0) return t.status === 'PENDING';
    if (activeTab === 1) return t.status === 'APPROVED';
    return t.status === 'REJECTED';
  });

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
          onClick={() => setActiveTab(0)}
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
          onClick={() => setActiveTab(1)}
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
          onClick={() => setActiveTab(2)}
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
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            {activeTab === 0 ? "الحركات المالية المعلقة للمراجعة والموافقة" : activeTab === 1 ? "الحركات المالية المعتمدة والمرحلة" : "الحركات المالية المرفوضة"}
          </h2>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-500 font-semibold text-sm">لا توجد حركات مالية في هذا القسم حالياً.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">اسم العامل</th>
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
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{tx.worker_name}</td>
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
                      <td className="p-3">
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default PayrollApproval;
