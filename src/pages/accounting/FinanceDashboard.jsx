import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getFinancialSummary, 
  getExpenses, 
  createExpense, 
  getRevenues, 
  createRevenue,
  getInvoices,
  createInvoice,
  updateInvoiceStatus
} from '../../features/accounting/services';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  FileText, 
  Receipt, 
  Calendar as CalendarIcon, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  Eye, 
  Info,
  Clock,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

const FinanceDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [summary, setSummary]   = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'expense' | 'revenue' | 'invoice' | 'details'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], textRef: '', notes: '' });
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    type: 'sales',
    party_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }]
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, e, r, inv] = await Promise.all([
        getFinancialSummary(), 
        getExpenses(), 
        getRevenues(),
        getInvoices()
      ]);
      setSummary(s); 
      setExpenses(e); 
      setRevenues(r);
      setInvoices(inv);
    } catch (err) { 
      console.error(err); 
      toast.error(t('common.error_loading', 'خطأ في تحميل البيانات الماليّة'));
    } finally { 
      setLoading(false); 
    }
  };

  const handleSimpleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.textRef) {
      toast.error(t('accounting.fill_required', 'يرجى ملء الحقول المطلوبة'));
      return;
    }
    setFormLoading(true);
    try {
      if (activeModal === 'expense') {
        await createExpense({ 
          amount: parseFloat(formData.amount), 
          date: formData.date, 
          category: formData.textRef, 
          notes: formData.notes 
        });
        toast.success(t('accounting.expense_logged', 'تم تسجيل المصروف بنجاح'));
      } else {
        await createRevenue({ 
          amount: parseFloat(formData.amount), 
          date: formData.date, 
          source: formData.textRef 
        });
        toast.success(t('accounting.revenue_logged', 'تم تسجيل الإيراد بنجاح'));
      }
      setActiveModal(null); 
      fetchData();
    } catch (err) { 
      console.error(err);
      toast.error(t('common.error', 'حدث خطأ ما'));
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceForm.invoice_number || !invoiceForm.party_name) {
      toast.error(t('accounting.fill_required', 'يرجى ملء الحقول المطلوبة'));
      return;
    }
    if (invoiceForm.items.some(item => !item.description || item.quantity <= 0 || item.unit_price <= 0)) {
      toast.error(t('accounting.invalid_items', 'يرجى التحقق من تفاصيل البنود'));
      return;
    }
    setFormLoading(true);
    try {
      await createInvoice({
        invoice_number: invoiceForm.invoice_number,
        type: invoiceForm.type,
        party_name: invoiceForm.party_name,
        issue_date: invoiceForm.issue_date,
        due_date: invoiceForm.due_date || null,
        notes: invoiceForm.notes,
        items: invoiceForm.items
      });
      toast.success(t('accounting.invoice_created', 'تم إنشاء الفاتورة بنجاح'));
      setActiveModal(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(t('common.error', 'حدث خطأ ما'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId, status) => {
    try {
      await updateInvoiceStatus(invoiceId, status);
      toast.success(t('accounting.status_updated', 'تم تحديث حالة الفاتورة'));
      fetchData();
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        // Refresh details modal too
        const updated = invoices.find(inv => inv.id === invoiceId);
        if (updated) setSelectedInvoice({ ...updated, status });
      }
    } catch (err) {
      console.error(err);
      toast.error(t('common.error', 'فشل تحديث الحالة'));
    }
  };

  // Dynamic items manipulation
  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeInvoiceItem = (index) => {
    if (invoiceForm.items.length === 1) return;
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const updateItemField = (index, field, val) => {
    const newItems = [...invoiceForm.items];
    newItems[index] = { ...newItems[index], [field]: val };
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  // Total invoice sum helper
  const getInvoiceFormTotal = () => {
    return invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-3 bg-emerald-50 rounded-xl text-emerald-600 inline-block">
              <Receipt className="h-7 w-7" />
            </span>
            {t('accounting.title', 'الإدارة المالية والمحاسبة')}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">{t('accounting.subtitle', 'إدارة الدفاتر المحاسبية والفواتير والتحليلات المالية')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 font-bold" onClick={() => {
            setFormData({ amount: '', date: new Date().toISOString().split('T')[0], textRef: '', notes: '' });
            setActiveModal('expense');
          }}>
            <TrendingDown className="h-4 w-4 mr-1 ml-1" />
            {t('accounting.log_expense', 'تسجيل مصروف')}
          </Button>
          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold" onClick={() => {
            setFormData({ amount: '', date: new Date().toISOString().split('T')[0], textRef: '', notes: '' });
            setActiveModal('revenue');
          }}>
            <TrendingUp className="h-4 w-4 mr-1 ml-1" />
            {t('accounting.log_revenue', 'تسجيل إيراد')}
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => {
            setInvoiceForm({
              invoice_number: `INV-${Date.now().toString().slice(-6)}`,
              type: 'sales',
              party_name: '',
              issue_date: new Date().toISOString().split('T')[0],
              due_date: '',
              notes: '',
              items: [{ description: '', quantity: 1, unit_price: 0 }]
            });
            setActiveModal('invoice');
          }}>
            <Plus className="h-4 w-4 mr-1 ml-1" />
            {t('accounting.create_invoice', 'إنشاء فاتورة')}
          </Button>
        </div>
      </div>

      {loading || !summary ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-5"><TrendingUp className="h-24 w-24" /></div>
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-500 uppercase tracking-wider font-extrabold text-xs">{t('accounting.total_revenue', 'إجمالي الإيرادات')}</CardDescription>
                <CardTitle className="text-3xl font-black text-emerald-600">${Number(summary.total_revenue).toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-5"><TrendingDown className="h-24 w-24" /></div>
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-500 uppercase tracking-wider font-extrabold text-xs">{t('accounting.total_expenses', 'إجمالي المصروفات')}</CardDescription>
                <CardTitle className="text-3xl font-black text-rose-600">${Number(summary.total_expense).toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-5"><DollarSign className="h-24 w-24" /></div>
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-500 uppercase tracking-wider font-extrabold text-xs">{t('accounting.total_salaries', 'الرواتب والأجور')}</CardDescription>
                <CardTitle className="text-3xl font-black text-amber-600">${Number(summary.total_salaries).toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900 border-none shadow-md text-white relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-10"><DollarSign className="h-24 w-24" /></div>
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400 uppercase tracking-wider font-extrabold text-xs">{t('accounting.net_margin', 'صافي الأرباح')}</CardDescription>
                <CardTitle className={`text-3xl font-black ${Number(summary.net) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${Number(summary.net).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Detailed Subsections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Invoices List Panel */}
            <Card className="lg:col-span-2 border border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center pb-4">
                <div>
                  <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-slate-600" />
                    {t('accounting.invoices_list', 'قائمة الفواتير الصادرة والواردة')}
                  </CardTitle>
                  <CardDescription>{t('accounting.invoices_list_desc', 'إدارة ومتابعة فواتير البيع والشراء')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoices.length === 0 ? (
                  <p className="text-slate-400 italic text-center p-8 bg-slate-50 border border-dashed rounded-xl">{t('common.empty', 'لا توجد فواتير حالية')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b">
                        <tr>
                          <th className="py-3 px-4">{t('accounting.invoice_num', 'رقم الفاتورة')}</th>
                          <th className="py-3 px-4">{t('accounting.party', 'الجهة')}</th>
                          <th className="py-3 px-4">{t('accounting.type', 'النوع')}</th>
                          <th className="py-3 px-4">{t('accounting.total', 'الإجمالي')}</th>
                          <th className="py-3 px-4">{t('accounting.status', 'الحالة')}</th>
                          <th className="py-3 px-4 text-center">{t('accounting.actions', 'إجراءات')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{inv.invoice_number}</td>
                            <td className="py-3 px-4 font-semibold">{inv.party_name}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                inv.type === 'sales' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {inv.type === 'sales' ? t('accounting.sales', 'مبيعات') : t('accounting.purchase', 'مشتريات')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-black">${Number(inv.total_amount).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                inv.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {inv.status === 'paid' ? t('accounting.paid', 'مدفوعة') :
                                 inv.status === 'sent' ? t('accounting.sent', 'مرسلة') :
                                 inv.status === 'cancelled' ? t('accounting.cancelled', 'ملغاة') : t('accounting.draft', 'مسودة')}
                              </span>
                            </td>
                            <td className="py-3 px-4 flex justify-center gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-slate-900" onClick={() => {
                                setSelectedInvoice(inv);
                                setActiveModal('details');
                              }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                                <>
                                  <Button size="sm" variant="ghost" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold px-2" onClick={() => handleStatusChange(inv.id, 'paid')}>
                                    {t('accounting.mark_paid', 'سداد')}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 font-bold px-2" onClick={() => handleStatusChange(inv.id, 'cancelled')}>
                                    {t('accounting.cancel_btn', 'إلغاء')}
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Simple Ledger Panel */}
            <div className="space-y-6">
              {/* Revenues List */}
              <Card className="border border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <TrendingUp className="text-emerald-500 h-5 w-5" />
                    {t('accounting.inflow_title', 'المتحصلات النقدية')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                  {revenues.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed text-xs">{t('common.empty', 'لا توجد دفعات إيراد')}</p>
                  ) : (
                    revenues.map(r => (
                      <div key={`rev-${r.id}`} className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{r.source}</p>
                          <span className="text-[10px] text-slate-500 mt-0.5 bg-white px-2 py-0.5 rounded border inline-block">{r.date}</span>
                        </div>
                        <div className="text-emerald-700 font-extrabold text-sm bg-white px-2 py-1 rounded-lg border border-emerald-100">+${r.amount}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Expenses List */}
              <Card className="border border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <TrendingDown className="text-rose-500 h-5 w-5" />
                    {t('accounting.outflow_title', 'المصروفات النقدية')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                  {expenses.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed text-xs">{t('common.empty', 'لا توجد بنود مصروفات')}</p>
                  ) : (
                    expenses.map(e => (
                      <div key={`exp-${e.id}`} className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{e.category}</p>
                          <span className="text-[10px] text-slate-500 mt-0.5 bg-white px-2 py-0.5 rounded border inline-block">{e.date}</span>
                        </div>
                        <div className="text-rose-700 font-extrabold text-sm bg-white px-2 py-1 rounded-lg border border-rose-100">-${e.amount}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Expense / Revenue Create Modal */}
      {(activeModal === 'expense' || activeModal === 'revenue') && (
        <Dialog open={true} onOpenChange={() => setActiveModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className={`text-xl font-black ${activeModal === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {activeModal === 'expense' ? t('accounting.modal_expense_title', 'تسجيل بند مصروفات') : t('accounting.modal_revenue_title', 'تسجيل بند إيرادات')}
              </DialogTitle>
              <DialogDescription>{t('accounting.simple_ledger_desc', 'إدخال عملية نقدية فورية إلى الدفتر المالي.')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSimpleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="date">{t('accounting.date', 'التاريخ')}</Label>
                  <Input id="date" type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">{t('accounting.amount', 'المبلغ')}</Label>
                  <Input id="amount" type="number" step="0.01" required placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="textRef">
                  {activeModal === 'expense' ? t('accounting.expense_category', 'التصنيف / البند') : t('accounting.revenue_source', 'مصدر الإيراد')}
                </Label>
                <Input id="textRef" required placeholder={activeModal === 'expense' ? 'مثال: وقود، صيانة، بذور' : 'مثال: بيع محصول زيتون، تمور'} value={formData.textRef} onChange={(e) => setFormData({...formData, textRef: e.target.value})} />
              </div>
              {activeModal === 'expense' && (
                <div className="space-y-1.5">
                  <Label htmlFor="notes">{t('accounting.notes', 'ملاحظات إضافية')}</Label>
                  <Input id="notes" placeholder="ملاحظات توضيحية..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
              )}
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setActiveModal(null)}>{t('accounting.cancel', 'إلغاء')}</Button>
                <Button type="submit" disabled={formLoading} className={activeModal === 'expense' ? 'bg-rose-600 hover:bg-rose-700 text-white font-bold' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'}>
                  {formLoading ? '...' : t('accounting.commit_btn', 'حفظ وإرسال')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoice Create Modal */}
      {activeModal === 'invoice' && (
        <Dialog open={true} onOpenChange={() => setActiveModal(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-800">{t('accounting.create_invoice', 'إنشاء فاتورة جديدة')}</DialogTitle>
              <DialogDescription>{t('accounting.invoice_desc', 'إنشاء فاتورة مشتريات أو مبيعات وإدخال بنود مفصلة.')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvoiceSubmit} className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inv_num">{t('accounting.invoice_num', 'رقم الفاتورة')}</Label>
                  <Input id="inv_num" required value={invoiceForm.invoice_number} onChange={(e) => setInvoiceForm({...invoiceForm, invoice_number: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv_type">{t('accounting.type', 'النوع')}</Label>
                  <select id="inv_type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={invoiceForm.type} onChange={(e) => setInvoiceForm({...invoiceForm, type: e.target.value})}>
                    <option value="sales">{t('accounting.sales_invoice', 'فاتورة مبيعات')}</option>
                    <option value="purchase">{t('accounting.purchase_invoice', 'فاتورة مشتريات')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="party_name">{t('accounting.party', 'الجهة المتعاقدة')}</Label>
                  <Input id="party_name" required placeholder="مثال: شركة النور للمقاولات" value={invoiceForm.party_name} onChange={(e) => setInvoiceForm({...invoiceForm, party_name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="issue_date">{t('accounting.issue_date', 'تاريخ الإصدار')}</Label>
                  <Input id="issue_date" type="date" required value={invoiceForm.issue_date} onChange={(e) => setInvoiceForm({...invoiceForm, issue_date: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="due_date">{t('accounting.due_date', 'تاريخ الاستحقاق')}</Label>
                  <Input id="due_date" type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({...invoiceForm, due_date: e.target.value})} />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-sm font-extrabold text-slate-700">{t('accounting.items', 'البنود والخدمات')}</h4>
                  <Button type="button" variant="outline" size="sm" className="h-8 font-extrabold border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={addInvoiceItem}>
                    <Plus className="h-4 w-4 mr-1 ml-1" />
                    {t('accounting.add_item', 'إضافة بند')}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-end border p-3 rounded-xl bg-slate-50/50">
                      <div className="flex-grow space-y-1">
                        <Label className="text-xs">{t('accounting.item_desc', 'وصف البند')}</Label>
                        <Input placeholder="وصف البند المالي..." value={item.description} onChange={(e) => updateItemField(idx, 'description', e.target.value)} required />
                      </div>
                      <div className="w-20 space-y-1">
                        <Label className="text-xs">{t('accounting.qty', 'الكمية')}</Label>
                        <Input type="number" value={item.quantity} onChange={(e) => updateItemField(idx, 'quantity', parseFloat(e.target.value) || 0)} required />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">{t('accounting.price', 'السعر')}</Label>
                        <Input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItemField(idx, 'unit_price', parseFloat(e.target.value) || 0)} required />
                      </div>
                      <div className="w-20 py-2 font-black text-sm text-center bg-white border rounded-md shadow-sm h-9 flex items-center justify-center">
                        ${(item.quantity * item.unit_price || 0).toFixed(1)}
                      </div>
                      <Button type="button" size="icon" variant="ghost" className="text-red-500 hover:text-red-700 h-9 w-9" onClick={() => removeInvoiceItem(idx)} disabled={invoiceForm.items.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv_notes">{t('accounting.notes', 'شروط الدفع / ملاحظات')}</Label>
                <Input id="inv_notes" placeholder="ملاحظات تسديد الفاتورة..." value={invoiceForm.notes} onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})} />
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-xl">
                <span className="font-extrabold text-sm">{t('accounting.total_invoice_amount', 'الإجمالي المستحق')}:</span>
                <span className="text-2xl font-black">${getInvoiceFormTotal().toLocaleString()}</span>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setActiveModal(null)}>{t('accounting.cancel', 'إلغاء')}</Button>
                <Button type="submit" disabled={formLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6">
                  {formLoading ? '...' : t('accounting.create_invoice', 'إنشاء الفاتورة')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoice Details Dialog */}
      {activeModal === 'details' && selectedInvoice && (
        <Dialog open={true} onOpenChange={() => setActiveModal(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <FileText className="text-slate-500" />
                {t('accounting.invoice_details_title', 'تفاصيل فاتورة ماليّة')}
              </DialogTitle>
              <DialogDescription>{t('accounting.invoice_details_desc', 'عرض البنود المسجلة وعمليات الدفع.')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-3">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <span className="text-xs text-slate-400 font-extrabold block">{t('accounting.invoice_num', 'رقم الفاتورة')}</span>
                  <span className="font-black text-slate-800 text-base">{selectedInvoice.invoice_number}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-extrabold block">{t('accounting.party', 'الجهة المتعاقدة')}</span>
                  <span className="font-bold text-slate-700">{selectedInvoice.party_name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-extrabold block">{t('accounting.issue_date', 'تاريخ الإصدار')}</span>
                  <span className="font-semibold text-slate-600">{selectedInvoice.issue_date}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-extrabold block">{t('accounting.status', 'الحالة')}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-black inline-block ${
                    selectedInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                    selectedInvoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    selectedInvoice.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {selectedInvoice.status === 'paid' ? t('accounting.paid', 'مدفوعة') :
                     selectedInvoice.status === 'sent' ? t('accounting.sent', 'مرسلة') :
                     selectedInvoice.status === 'cancelled' ? t('accounting.cancelled', 'ملغاة') : t('accounting.draft', 'مسودة')}
                  </span>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-extrabold block">{t('accounting.invoice_items', 'بنود الفاتورة')}</span>
                <div className="border rounded-xl overflow-hidden bg-slate-50/50">
                  <table className="w-full text-xs text-right text-slate-700">
                    <thead className="bg-slate-100 text-slate-500 font-extrabold">
                      <tr>
                        <th className="py-2 px-3">{t('accounting.item_desc', 'الوصف')}</th>
                        <th className="py-2 px-3 text-center">{t('accounting.qty', 'الكمية')}</th>
                        <th className="py-2 px-3 text-center">{t('accounting.price', 'السعر')}</th>
                        <th className="py-2 px-3 text-left">{t('accounting.total', 'الإجمالي')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedInvoice.items && selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 font-semibold">{item.description}</td>
                          <td className="py-2 px-3 text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-center">${item.unit_price}</td>
                          <td className="py-2 px-3 text-left font-bold">${item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-xs text-slate-400 font-extrabold block mb-1">{t('accounting.notes', 'ملاحظات')}</span>
                  <p className="text-xs text-slate-600 font-semibold">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center p-3 bg-slate-900 text-white rounded-xl">
                <span className="font-extrabold text-xs">{t('accounting.total_invoice_amount', 'الإجمالي الكلي')}</span>
                <span className="text-lg font-black">${Number(selectedInvoice.total_amount).toLocaleString()}</span>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="ghost" onClick={() => setActiveModal(null)}>{t('accounting.close', 'إغلاق')}</Button>
              {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => handleStatusChange(selectedInvoice.id, 'paid')}>
                  {t('accounting.mark_paid', 'تسجيل السداد')}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FinanceDashboard;
