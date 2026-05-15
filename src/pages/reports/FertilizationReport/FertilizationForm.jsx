import React, { useState } from 'react';
import { Box, Card, Typography, Button, TextField, CircularProgress, Alert, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { reportsApi } from '../../../services/reportsApi';
import DynamicFieldsRenderer from '../shared/DynamicFieldsRenderer';

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
  custom_fields: z.record(z.any()).optional()
});

const FertilizationForm = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      report_date: new Date().toISOString().split('T')[0],
      variety: '', material_name: '', active_percentage: '', rate_per_feddan: '',
      transfer_number: '', valves: '', area_feddan: '', tree_count: '', total_quantity: '',
      operator: '', notes: '', custom_fields: {}
    }
  });

  const onSubmit = async (data) => {
    setSubmitError('');
    try {
      const { custom_fields, ...mainData } = data;
      const res = await reportsApi.createFertilization(mainData);
      const reportId = res.data.id;

      if (custom_fields && Object.keys(custom_fields).length > 0) {
        const customValuesPayload = Object.entries(custom_fields).map(([fieldId, value]) => ({
          field: parseInt(fieldId),
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
    <Box maxWidth="800px" mx="auto">
      <Typography variant="h5" fontWeight="800" mb={3}>تسجيل تقرير تسميد جديد</Typography>

      <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
        {submitError && <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Controller name="report_date" control={control} render={({ field }) => (
                <TextField {...field} type="date" label="التاريخ" fullWidth error={!!errors.report_date} helperText={errors.report_date?.message} InputLabelProps={{ shrink: true }} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="variety" control={control} render={({ field }) => (
                <TextField {...field} label="الصنف" fullWidth error={!!errors.variety} helperText={errors.variety?.message} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="material_name" control={control} render={({ field }) => (
                <TextField {...field} label="المادة الفعالة" fullWidth error={!!errors.material_name} helperText={errors.material_name?.message} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="active_percentage" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="النسبة المئوية %" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="rate_per_feddan" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="معدل الفدان" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="area_feddan" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="المساحة (فدان)" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="total_quantity" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="الكمية الإجمالية" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="operator" control={control} render={({ field }) => (
                <TextField {...field} label="القائم بالعمل" fullWidth />
              )} />
            </Grid>
          </Grid>

          <DynamicFieldsRenderer modelName="fertilizationreport" control={control} errors={errors} />

          <Box display="flex" justifyContent="flex-end" mt={10} pt={2} borderTop="1px solid #e2e8f0">
            <Button onClick={() => navigate(-1)} sx={{ mr: 2, fontWeight: 700, color: 'text.secondary', mt: 2 }}>إلغاء</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 1, px: 4, fontWeight: 700, mt: 2 }}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'حفظ التقرير'}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default FertilizationForm;
