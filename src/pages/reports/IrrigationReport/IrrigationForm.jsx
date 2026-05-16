import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, AlertCircle, Droplets, ArrowRight } from 'lucide-react';

import { reportsApi } from '../../../services/reportsApi';
import DynamicFieldsRenderer from '../shared/DynamicFieldsRenderer';
import { Field } from '../shared/FormControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  report_date: z.string().min(1, 'التاريخ مطلوب'),
  sector_number: z.coerce.number().min(1, 'رقم القطاع مطلوب'),
  transfer_number: z.coerce.number().min(1, 'رقم التحويلة مطلوب'),
  area_feddan: z.coerce.number().optional(),
  tree_count: z.coerce.number().optional(),
  well_flow_m3: z.coerce.number().optional(),
  water_per_tree: z.coerce.number().optional(),
  irrigation_hours: z.coerce.number().optional(),
  irrigation_cycles: z.coerce.number().optional(),
  notes: z.string().optional(),
  custom_fields: z.record(z.any()).optional()
});

const IrrigationForm = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      report_date: new Date().toISOString().split('T')[0],
      sector_number: '', transfer_number: '', area_feddan: '', tree_count: '',
      well_flow_m3: '', water_per_tree: '', irrigation_hours: '', irrigation_cycles: '',
      notes: '', custom_fields: {}
    }
  });

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      const { custom_fields, ...mainData } = data;
      const res = await reportsApi.createIrrigation(mainData);
      const reportId = res.data.id;

      if (custom_fields && Object.keys(custom_fields).length > 0) {
        const customValuesPayload = Object.entries(custom_fields).map(([fieldId, value]) => ({
          field: fieldId,
          value: value.toString(),
          content_type_model: 'irrigationreport',
          object_id: reportId
        }));
        await Promise.all(customValuesPayload.map(cv => reportsApi.saveCustomFieldValues(cv)));
      }

      navigate('/reports/irrigation');
    } catch (err) {
      setSubmitError('حدث خطأ أثناء حفظ تقرير الري.');
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
              <Droplets className="w-6 h-6 text-blue-600" />
              تسجيل تقرير ري جديد
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              يرجى إدخال تفاصيل دورة الري بدقة.
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
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-5 border-b border-slate-100 pb-2">
                  معلومات الموقع
                </p>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-4">
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
                  <div className="col-span-12 md:col-span-4">
                    <Controller name="sector_number" control={control} render={({ field }) => (
                      <Field label="رقم القطاع *">
                        <Input 
                          {...field} 
                          type="number" 
                          className={errors.sector_number ? 'border-red-500' : ''} 
                        />
                        {errors.sector_number && <span className="text-xs text-red-500 mt-1">{errors.sector_number.message}</span>}
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Controller name="transfer_number" control={control} render={({ field }) => (
                      <Field label="رقم التحويلة *">
                        <Input 
                          {...field} 
                          type="number" 
                          className={errors.transfer_number ? 'border-red-500' : ''} 
                        />
                        {errors.transfer_number && <span className="text-xs text-red-500 mt-1">{errors.transfer_number.message}</span>}
                      </Field>
                    )} />
                  </div>
                </div>
              </div>

              {/* Section: Technical Details */}
              <div>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-5 border-b border-slate-100 pb-2">
                  التفاصيل الفنية
                </p>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-6 lg:col-span-4">
                    <Controller name="area_feddan" control={control} render={({ field }) => (
                      <Field label="المساحة (فدان)">
                        <Input {...field} type="number" />
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-6 lg:col-span-4">
                    <Controller name="tree_count" control={control} render={({ field }) => (
                      <Field label="عدد النخيل">
                        <Input {...field} type="number" />
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-6 lg:col-span-4">
                    <Controller name="well_flow_m3" control={control} render={({ field }) => (
                      <Field label="تصرف البئر م³/ساعة">
                        <Input {...field} type="number" />
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-6 lg:col-span-4">
                    <Controller name="water_per_tree" control={control} render={({ field }) => (
                      <Field label="كمية المياه للنخلة">
                        <Input {...field} type="number" />
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-6 lg:col-span-4">
                    <Controller name="irrigation_hours" control={control} render={({ field }) => (
                      <Field label="ساعات الري">
                        <Input {...field} type="number" />
                      </Field>
                    )} />
                  </div>
                  <div className="col-span-12 md:col-span-6 lg:col-span-4">
                    <Controller name="irrigation_cycles" control={control} render={({ field }) => (
                      <Field label="مرات الري">
                        <Input {...field} type="number" />
                      </Field>
                    )} />
                  </div>
                </div>
              </div>

              {/* Section: Notes */}
              <div>
                <Controller name="notes" control={control} render={({ field }) => (
                  <Field label="ملاحظات / مشاهدات">
                    <Textarea {...field} rows={3} placeholder="أضف أي ملاحظات هامة هنا..." />
                  </Field>
                )} />
              </div>

              {/* Dynamic Fields */}
              <DynamicFieldsRenderer modelName="irrigationreport" control={control} errors={errors} />

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
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-xl shadow-md"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ التقرير'}
        </Button>
      </div>
    </form>
  );
};

export default IrrigationForm;
