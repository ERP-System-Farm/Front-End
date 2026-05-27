import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, AlertCircle, TestTubes, ArrowRight } from 'lucide-react';

import { reportsApi } from '../../../services/reportsApi';
import DynamicFieldsRenderer from '../shared/DynamicFieldsRenderer';
import { Field } from '../shared/FormControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  report_date: z.string().min(1, 'التاريخ مطلوب'),
  variety: z.string().min(1, 'الصنف مطلوب'),
  material_name: z.string().min(1, 'اسم المادة مطلوب'),
  active_percentage: z.coerce.number().optional(),
  rate_per_feddan: z.coerce.number().optional(),
  transfer_number: z.coerce.number().optional(),
  valves: z.string().optional(),
  area_feddan: z.coerce.number().optional(),
  tree_count: z.coerce.number().optional(),
  total_quantity: z.coerce.number().optional(),
  operator: z.string().optional(),
  notes: z.string().optional(),
  enclosure: z.string().nullable().optional(),
  custom_fields: z.record(z.any()).optional()
});

const FertilizationForm = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [enclosures, setEnclosures] = useState([]);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      report_date: new Date().toISOString().split('T')[0],
      variety: '', material_name: '', active_percentage: '', rate_per_feddan: '',
      transfer_number: '', valves: '', area_feddan: '', tree_count: '', total_quantity: '',
      operator: '', notes: '', enclosure: '', custom_fields: {}
    }
  });

  useEffect(() => {
    const fetchEnclosures = async () => {
      try {
        const res = await reportsApi.getLocationNodes("ENCLOSURE");
        setEnclosures(res.data.results || res.data || []);
      } catch (err) {
        console.error("Failed to load enclosures", err);
      }
    };
    fetchEnclosures();
  }, []);

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      const { custom_fields, ...mainData } = data;
      // Convert empty string enclosure to null
      if (mainData.enclosure === '') {
        mainData.enclosure = null;
      }
      const res = await reportsApi.createFertilization(mainData);
      const reportId = res.data.id;

      if (custom_fields && Object.keys(custom_fields).length > 0) {
        const customValuesPayload = Object.entries(custom_fields).map(([fieldId, value]) => ({
          field: fieldId,
          value: value.toString(),
          content_type_model: 'fertilizationreport',
          object_id: reportId
        }));
        await Promise.all(customValuesPayload.map(cv => reportsApi.saveCustomFieldValues(cv)));
      }

      navigate('/reports/fertilization');
    } catch (err) {
      setSubmitError('حدث خطأ أثناء حفظ تقرير التسميد.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-32 bg-slate-50 min-h-screen" dir="rtl">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-4xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <TestTubes className="w-6 h-6 text-purple-600" />
              تسجيل تقرير تسميد جديد
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              يرجى إدخال تفاصيل المواد السمادية بدقة.
            </p>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-10">
            <div className="flex flex-col gap-8">
              
              {/* Section: Basic Data */}
              <div>
                <p className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-5 border-b border-slate-100 pb-2">
                  بيانات المادة
                </p>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-6">
                    <Controller name="report_date" control={control} render={({ field }) => (
                      <Field label="التاريخ *">
                        <Input 
                          {...field} 
                          type="date" 
                          className={errors.report_date ? 'border-red-500' : ''} 
                        />
                        {errors.report_date && <span className="text-xs text-red-500 mt-1">{errors.report_date.message}</span>}
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <Controller name="variety" control={control} render={({ field }) => (
                      <Field label="الصنف *">
                        <Input 
                          {...field} 
                          className={errors.variety ? 'border-red-500' : ''} 
                        />
                        {errors.variety && <span className="text-xs text-red-500 mt-1">{errors.variety.message}</span>}
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <Controller name="material_name" control={control} render={({ field }) => (
                      <Field label="اسم المادة الفعالة *">
                        <Input 
                          {...field} 
                          className={errors.material_name ? 'border-red-500' : ''} 
                        />
                        {errors.material_name && <span className="text-xs text-red-500 mt-1">{errors.material_name.message}</span>}
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <Controller name="active_percentage" control={control} render={({ field }) => (
                      <Field label="النسبة المئوية %">
                        <Input {...field} type="number" />
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <Controller name="enclosure" control={control} render={({ field }) => (
                      <Field label="الحوشة المستهدفة">
                        <select 
                          {...field}
                          value={field.value || ''}
                          className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs sm:text-sm bg-white focus:ring-emerald-500 shadow-sm"
                        >
                          <option value="">اختر الحوشة...</option>
                          {enclosures.map(enc => (
                            <option key={enc.id} value={enc.id}>{enc.name}</option>
                          ))}
                        </select>
                      </Field>
                    )} />
                  </div>
                </div>
              </div>

              {/* Section: Rates & Areas */}
              <div>
                <p className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-5 border-b border-slate-100 pb-2">
                  الكميات والمعدلات
                </p>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-4">
                    <Controller name="rate_per_feddan" control={control} render={({ field }) => (
                      <Field label="معدل الفدان">
                        <Input {...field} type="number" />
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Controller name="area_feddan" control={control} render={({ field }) => (
                      <Field label="المساحة (فدان)">
                        <Input {...field} type="number" />
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Controller name="total_quantity" control={control} render={({ field }) => (
                      <Field label="الكمية الإجمالية">
                        <Input {...field} type="number" />
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12">
                    <Controller name="operator" control={control} render={({ field }) => (
                      <Field label="القائم بالعمل">
                        <Input {...field} />
                      </Field>
                    )} />
                  </div>
                </div>
              </div>

              {/* Dynamic Fields */}
              <DynamicFieldsRenderer modelName="fertilizationreport" control={control} errors={errors} />

            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 py-4 px-6 md:px-12 flex justify-end items-center shadow-lg gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="h-11 px-8 rounded-xl font-bold border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          إلغاء
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 px-8 rounded-xl shadow-md"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ التقرير'}
        </Button>
      </div>
    </form>
  );
};

export default FertilizationForm;
