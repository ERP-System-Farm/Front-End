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
          field: parseInt(fieldId),
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
    <Box maxWidth="800px" mx="auto">
      <Typography variant="h5" fontWeight="800" mb={3}>تسجيل تقرير ري جديد</Typography>
      
      <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
        {submitError && <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Controller name="report_date" control={control} render={({ field }) => (
                <TextField {...field} type="date" label="التاريخ" fullWidth error={!!errors.report_date} helperText={errors.report_date?.message} InputLabelProps={{ shrink: true }} />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="sector_number" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="رقم القطاع" fullWidth error={!!errors.sector_number} helperText={errors.sector_number?.message} />
              )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="transfer_number" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="رقم التحويلة" fullWidth error={!!errors.transfer_number} helperText={errors.transfer_number?.message} />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="area_feddan" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="المساحة (فدان)" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="tree_count" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="عدد النخيل" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="well_flow_m3" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="تصرف البئر م³/ساعة" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="water_per_tree" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="كمية المياه للنخلة" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="irrigation_hours" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="ساعات الري" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="irrigation_cycles" control={control} render={({ field }) => (
                <TextField {...field} type="number" label="مرات الري" fullWidth />
              )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="notes" control={control} render={({ field }) => (
                <TextField {...field} multiline rows={3} label="ملاحظات" fullWidth />
              )} />
            </Grid>
          </Grid>

          <DynamicFieldsRenderer modelName="irrigationreport" control={control} errors={errors} />

          <Box display="flex" justifyContent="flex-end" mt={4} pt={2} borderTop="1px solid #e2e8f0">
            <Button onClick={() => navigate(-1)} sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}>إلغاء</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'حفظ التقرير'}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default IrrigationForm;
