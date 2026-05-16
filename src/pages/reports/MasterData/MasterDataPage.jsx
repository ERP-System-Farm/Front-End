import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, Check, X, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { reportsApi } from '../../../services/reportsApi';

// ─── Generic CRUD Table for a master data resource ───────────────────────────
const MasterDataTable = ({ title, description, color, fetchFn, createFn, updateFn, deleteFn, fields }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);     // null = closed, {} = new
  const [deleteItem, setDeleteItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn();
      setItems(res.data.results || res.data);
    } catch {
      setError('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setFormData({});
    setEditItem({});
    setError('');
  };

  const openEdit = (item) => {
    setFormData({ ...item });
    setEditItem(item);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editItem?.id) {
        await updateFn(editItem.id, formData);
      } else {
        await createFn(formData);
      }
      setEditItem(null);
      load();
    } catch (e) {
      const msg = e?.response?.data;
      if (typeof msg === 'object') {
        const firstErr = Object.values(msg)[0];
        setError(Array.isArray(firstErr) ? firstErr[0] : String(firstErr));
      } else {
        setError('حدث خطأ أثناء الحفظ.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFn(deleteItem.id);
      setDeleteItem(null);
      load();
    } catch {
      setError('فشل في الحذف.');
    }
  };

  const colorMap = {
    emerald: { badge: 'bg-emerald-100 text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700', icon: 'text-emerald-600' },
    blue:    { badge: 'bg-blue-100 text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700', icon: 'text-blue-600' },
    purple:  { badge: 'bg-purple-100 text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700', icon: 'text-purple-600' },
    amber:   { badge: 'bg-amber-100 text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700', icon: 'text-amber-600' },
    slate:   { badge: 'bg-slate-100 text-slate-700', btn: 'bg-slate-700 hover:bg-slate-800', icon: 'text-slate-600' },
  };
  const c = colorMap[color] || colorMap.slate;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        <Button onClick={openCreate} className={`${c.btn} text-white h-9 px-4 rounded-lg font-bold text-sm`}>
          <Plus className="w-4 h-4 ml-1.5" />
          إضافة
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className={`w-6 h-6 animate-spin ${c.icon}`} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 text-sm">لا توجد بيانات بعد. ابدأ بالإضافة.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {fields.map(f => (
                  <th key={f.key} className="text-right font-semibold text-slate-600 px-5 py-3">{f.label}</th>
                ))}
                <th className="text-right font-semibold text-slate-600 px-5 py-3 w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  {fields.map(f => (
                    <td key={f.key} className="px-5 py-3.5 text-slate-700">
                      {f.render ? f.render(item[f.key], item) : (item[f.key] ?? '—')}
                    </td>
                  ))}
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => openEdit(item)}
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setDeleteItem(item)}
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={editItem !== null} onOpenChange={(v) => !v && setEditItem(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem?.id ? `تعديل: ${editItem.name || ''}` : `إضافة ${title} جديد`}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {fields.filter(f => !f.readOnly).map(f => (
              <div key={f.key}>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </Label>
                {f.type === 'textarea' ? (
                  <textarea
                    className="w-full min-h-[80px] border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    value={formData[f.key] || ''}
                    onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder || ''}
                  />
                ) : (
                  <Input
                    type={f.type || 'text'}
                    className="h-10 border-slate-200 focus-visible:ring-emerald-500"
                    value={formData[f.key] || ''}
                    onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder || ''}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="border-slate-300">إلغاء</Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`${c.btn} text-white font-bold`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Check className="w-4 h-4 ml-1" />}
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(v) => !v && setDeleteItem(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف <strong>"{deleteItem?.name}"</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


// ─── Master Data Page ────────────────────────────────────────────────────────
const MasterDataPage = () => {
  const sections = [
    {
      key: 'operations',
      label: 'العمليات',
      title: 'العمليات الزراعية',
      description: 'تعريف أنواع العمليات والأنشطة الزراعية (تسميد، ري، حصاد، إلخ)',
      color: 'emerald',
      fetchFn: () => reportsApi.getOperations(),
      createFn: (d) => reportsApi.createOperation(d),
      updateFn: (id, d) => reportsApi.updateOperation(id, d),
      deleteFn: (id) => reportsApi.deleteOperation(id),
      fields: [
        { key: 'name', label: 'اسم العملية', required: true, placeholder: 'مثال: تسميد ورقي، مكافحة سوسة' },
        { key: 'category', label: 'التصنيف', placeholder: 'مثال: وقاية، تغذية' },
        { key: 'description', label: 'وصف العملية', type: 'textarea' },
      ],
    },
    {
      key: 'application-methods',
      label: 'طرق الإضافة',
      title: 'طرق الإضافة / التطبيق',
      description: 'أنواع طرق الإضافة المستخدمة في التسميد والمكافحة (رش، تسميد أرضي، حقن، إلخ)',
      color: 'purple',
      fetchFn: () => reportsApi.getApplicationMethods(),
      createFn: (d) => reportsApi.createApplicationMethod(d),
      updateFn: (id, d) => reportsApi.updateApplicationMethod(id, d),
      deleteFn: (id) => reportsApi.deleteApplicationMethod(id),
      fields: [
        { key: 'name', label: 'الاسم', required: true, placeholder: 'مثال: رش على الأوراق' },
        { key: 'description', label: 'الوصف', type: 'textarea', placeholder: 'وصف اختياري لطريقة الإضافة' },
      ],
    },
    {
      key: 'varieties',
      label: 'الأصناف',
      title: 'الأصناف الزراعية',
      description: 'قائمة أصناف النخيل والمحاصيل المتاحة في العمليات',
      color: 'emerald',
      fetchFn: () => reportsApi.getVarieties(),
      createFn: (d) => reportsApi.createVariety(d),
      updateFn: (id, d) => reportsApi.updateVariety(id, d),
      deleteFn: (id) => reportsApi.deleteVariety(id),
      fields: [
        { key: 'name', label: 'اسم الصنف', required: true, placeholder: 'مثال: صقعي، برحي' },
      ],
    },
    {
      key: 'units',
      label: 'الوحدات',
      title: 'وحدات القياس',
      description: 'وحدات القياس المستخدمة في تسجيل الإنتاجية والكميات',
      color: 'blue',
      fetchFn: () => reportsApi.getUnits(),
      createFn: (d) => reportsApi.createUnit(d),
      updateFn: (id, d) => reportsApi.updateUnit(id, d),
      deleteFn: (id) => reportsApi.deleteUnit(id),
      fields: [
        { key: 'name', label: 'اسم الوحدة', required: true, placeholder: 'مثال: كجم، طن، عذق' },
      ],
    },
    {
      key: 'contractors',
      label: 'المقاولون',
      title: 'المقاولون والعمالة الخارجية',
      description: 'قائمة المقاولين وشركات العمالة المتعاقد معها',
      color: 'amber',
      fetchFn: () => reportsApi.getContractors(),
      createFn: (d) => reportsApi.createContractor(d),
      updateFn: (id, d) => reportsApi.updateContractor(id, d),
      deleteFn: (id) => reportsApi.deleteContractor(id),
      fields: [
        { key: 'name', label: 'اسم المقاول', required: true, placeholder: 'اسم الشركة أو المقاول' },
        { key: 'rate_per_hour', label: 'السعر / ساعة', type: 'number', placeholder: '0.00' },
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12 px-4 md:px-6" dir="rtl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-emerald-700" />
          </div>
          البيانات الأساسية
        </h1>
        <p className="text-sm text-slate-500 mt-2 mr-[3.25rem]">
          إدارة قوائم البيانات المرجعية المستخدمة في جميع تقارير المزرعة
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="operations" dir="rtl">
        <TabsList className="h-auto flex-wrap gap-1 bg-slate-100 p-1 rounded-xl mb-8">
          {sections.map(s => (
            <TabsTrigger
              key={s.key}
              value={s.key}
              className="rounded-lg font-semibold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map(s => (
          <TabsContent key={s.key} value={s.key}>
            <MasterDataTable
              title={s.title}
              description={s.description}
              color={s.color}
              fetchFn={s.fetchFn}
              createFn={s.createFn}
              updateFn={s.updateFn}
              deleteFn={s.deleteFn}
              fields={s.fields}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MasterDataPage;
