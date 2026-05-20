import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Wallet, 
  Receipt, 
  ArrowUp, 
  ArrowDown, 
  CircleDollarSign, 
  Briefcase, 
  Sliders, 
  AlertCircle,
  Building,
  DollarSign
} from 'lucide-react';
import api from '../../services/api';

const ContractorDashboard = () => {
  const [contractors, setContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch contractors list on mount
  useEffect(() => {
    const fetchContractors = async () => {
      setLoadingList(true);
      setErrorMsg('');
      try {
        const res = await api.get('/reports/contractors/');
        const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setContractors(list);
        if (list.length > 0) {
          setSelectedContractor(list[0].id);
        } else {
          setErrorMsg("لم يتم العثور على أي مقاولين مسجلين في النظام. يرجى إضافة مقاولين أولاً.");
        }
      } catch (err) {
        console.error("Failed to load contractors list", err);
        setErrorMsg("فشل تحميل قائمة المقاولين من السيرفر.");
      } finally {
        setLoadingList(false);
      }
    };
    fetchContractors();
  }, []);

  // Fetch individual contractor dashboard details whenever selectedContractor changes
  useEffect(() => {
    if (!selectedContractor) return;

    const fetchDashboard = async () => {
      setLoadingDashboard(true);
      setErrorMsg('');
      try {
        const res = await api.get(`/hr/contractors/${selectedContractor}/dashboard/`);
        setDashboardData(res.data);
      } catch (err) {
        console.error("Failed to load contractor dashboard details", err);
        setErrorMsg("فشل تحميل الحسابات التفصيلية للمقاول المختار.");
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboard();
  }, [selectedContractor]);

  const handleContractorChange = (event) => {
    setSelectedContractor(event.target.value);
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'EARNING':
        return 'مستحقات أساسية';
      case 'OVERTIME':
        return 'عمل إضافي';
      case 'DEDUCTION':
        return 'خصومات وغرامات';
      case 'PAYMENT':
        return 'دفعة مسددة';
      default:
        return type;
    }
  };

  const getTransactionTypeClass = (type) => {
    switch (type) {
      case 'EARNING':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'OVERTIME':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'DEDUCTION':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'PAYMENT':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  if (loadingList) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 w-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        <span className="text-sm font-medium text-slate-500">جاري تحميل قائمة المقاولين المعتمدين...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 text-right font-sans" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Building className="h-7 w-7" />
            </span>
            مستحقات وحسابات المقاولين
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            رصد إحصائيات عمالة المقاولين، وتدقيق المستحقات والخصومات والإضافات اليومية والتدفقات المالية المنسوبة لكل مقاول.
          </p>
        </div>

        {/* Contractor Select Dropdown */}
        {contractors.length > 0 && (
          <div className="flex flex-col gap-1 min-w-[280px]">
            <label className="text-xs font-extrabold text-slate-500 mb-1 block">المقاول المالي النشط</label>
            <select
              value={selectedContractor}
              onChange={handleContractorChange}
              className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {loadingDashboard ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          <span className="text-sm font-medium text-slate-500">جاري تحميل المستحقات وكشف الأستاذ...</span>
        </div>
      ) : dashboardData ? (
        <div className="space-y-6">
          
          {/* Active Contractor Info Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-black text-slate-800">
                المقاول الحالي: {dashboardData.contractor.name}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                dashboardData.contractor.is_active 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-slate-200 text-slate-800'
              }`}>
                {dashboardData.contractor.is_active ? 'نشط ومستمر' : 'غير نشط'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <Sliders className="h-4.5 w-4.5 text-emerald-600" />
              <span>سعر الساعة التعاقدي:</span>
              <span className="text-emerald-700 font-black text-base">{dashboardData.contractor.rate_per_hour} ج.م/ساعة</span>
            </div>
          </div>

          {/* Statistical Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute left-4 top-4 opacity-5 text-emerald-600 group-hover:scale-110 transition-transform">
                <Users className="h-12 w-12" />
              </div>
              <span className="text-xs font-bold text-slate-400 block mb-1">عدد العمال النشطين</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {dashboardData.summary.total_workers} عمال
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-2 block">إجمالي العمال المقيدين تحت ملف المقاول</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute left-4 top-4 opacity-5 text-emerald-600 group-hover:scale-110 transition-transform">
                <ArrowUp className="h-12 w-12" />
              </div>
              <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي مستحقات التشغيل</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {dashboardData.summary.total_earnings.toLocaleString()} ج.م
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-2 block">مجموع اليوميات وساعات العمل الإضافي المعتمدة</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute left-4 top-4 opacity-5 text-rose-600 group-hover:scale-110 transition-transform">
                <ArrowDown className="h-12 w-12" />
              </div>
              <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي الاستقطاعات والجزاءات</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {dashboardData.summary.total_deductions.toLocaleString()} ج.م
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-2 block">الخصومات وغرامات التقصير التشغيلية</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute left-4 top-4 opacity-5 text-blue-600 group-hover:scale-110 transition-transform">
                <CircleDollarSign className="h-12 w-12" />
              </div>
              <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي المسدد مسبقاً</span>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {dashboardData.summary.total_paid.toLocaleString()} ج.م
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-2 block">المدفوعات والحوالات المالية المحولة للمقاول</span>
            </div>
          </div>

          {/* Glowing Net Dues Card */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:justify-between md:items-center gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>
            <div className="space-y-2 max-w-xl">
              <h3 className="text-lg md:text-xl font-black text-emerald-400 flex items-center gap-2">
                <Wallet className="h-6 w-6 text-amber-400" />
                صافي المستحقات الحالية المتبقية للمقاول في ذمة الشركة
              </h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                المستحقات الصافية المعلقة المتبقية في ذمة الشركة لصالح المقاول المختار بعد احتساب ساعات تشغيل العمالة وتنزيل الجزاءات والخصومات وصافي الحوالات المسددة سلفاً.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl md:text-5xl font-black text-amber-400 tracking-tight text-shadow-sm">
                {dashboardData.summary.total_dues.toLocaleString()} <span className="text-lg md:text-2xl font-bold">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold block mt-1">صافي الرصيد المتبقي مستحق الدفع</span>
            </div>
          </div>

          {/* Analytical Ledger Transactions Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-slate-600" />
              كشف حركة الحساب التفصيلية لعمالة المقاول (دفتر الأستاذ العام)
            </h3>

            {dashboardData.transactions.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-500 font-semibold text-sm">لا توجد أي حركات مالية أو قيود مسجلة لهذا المقاول حالياً.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">نوع الحركة</th>
                      <th className="p-3">عدد الساعات</th>
                      <th className="p-3">سعر الساعة</th>
                      <th className="p-3">المبلغ الإجمالي</th>
                      <th className="p-3">المهندس المسؤول</th>
                      <th className="p-3">الموقع / الحوشة</th>
                      <th className="p-3">الملاحظات والبيان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-500">{tx.date}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTransactionTypeClass(tx.transaction_type)}`}>
                            {getTransactionTypeLabel(tx.transaction_type)}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-700">{tx.hours ? `${tx.hours} ساعة` : '-'}</td>
                        <td className="p-3 font-bold text-slate-600">{tx.rate ? `${tx.rate} ج.م` : '-'}</td>
                        <td className={`p-3 font-black text-base ${
                          tx.transaction_type === 'DEDUCTION' || tx.transaction_type === 'PAYMENT' 
                            ? 'text-rose-600' 
                            : 'text-emerald-600'
                        }`}>
                          {tx.transaction_type === 'DEDUCTION' || tx.transaction_type === 'PAYMENT' ? `-${tx.amount}` : `+${tx.amount}`} ج.م
                        </td>
                        <td className="p-3 font-bold text-slate-700">{tx.engineer_name || 'النظام التلقائي'}</td>
                        <td className="p-3 font-semibold text-slate-500">{tx.location_name || 'غير محدد مسبقاً'}</td>
                        <td className="p-3 text-slate-600 font-medium max-w-[240px] truncate" title={tx.notes}>
                          {tx.notes || 'تسجيل حسابي تلقائي لمستحقات عمالة المقاول'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-500 font-semibold text-sm">الرجاء اختيار مقاول لعرض مستحقاته المالية.</p>
        </div>
      )}

    </div>
  );
};

export default ContractorDashboard;
