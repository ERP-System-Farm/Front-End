import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { TextField, MenuItem, CircularProgress, Typography, Box, Switch, FormControlLabel } from '@mui/material';
import { reportsApi } from '../../../services/reportsApi';

const DynamicFieldsRenderer = ({ modelName, control, errors }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await reportsApi.getCustomFields(modelName);
        setFields(res.data.results || res.data);
      } catch (err) {
        console.error('Failed to load dynamic fields', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFields();
  }, [modelName]);

  if (loading) return <CircularProgress size={24} sx={{ my: 2, display: 'block' }} />;
  if (fields.length === 0) return null;

  return (
    <Box mt={3}>
      <Typography variant="h6" fontWeight="700" mb={2}>الحقول المخصصة الإضافية</Typography>
      <Box display="flex" flexDirection="column" gap={3}>
        {fields.map(field => {
          // Dynamic input rendering based on field_type
          return (
            <Controller
              key={field.id}
              name={`custom_fields.${field.id}`}
              control={control}
              rules={{ required: field.is_required ? 'هذا الحقل مطلوب' : false }}
              render={({ field: controllerField }) => {
                
                if (field.field_type === 'boolean') {
                  return (
                    <FormControlLabel 
                      control={<Switch checked={!!controllerField.value} onChange={(e) => controllerField.onChange(e.target.checked)} color="primary" />} 
                      label={field.name + (field.is_required ? ' *' : '')} 
                    />
                  );
                }

                if (field.field_type === 'date') {
                  return (
                    <TextField 
                      {...controllerField} 
                      type="date" 
                      label={field.name} 
                      fullWidth 
                      InputLabelProps={{ shrink: true }}
                      error={!!errors?.custom_fields?.[field.id]}
                      helperText={errors?.custom_fields?.[field.id]?.message}
                      required={field.is_required}
                    />
                  );
                }

                if (field.field_type === 'dropdown') {
                  // If dropdown choices are not stored in the DB yet, we just render a simple text input for MVP or a generic placeholder
                  // Assuming "Dropdown" might just be a select in the future. For now, render as text.
                  return (
                    <TextField 
                      {...controllerField} 
                      label={field.name + ' (اختر أو اكتب)'} 
                      fullWidth 
                      error={!!errors?.custom_fields?.[field.id]}
                      helperText={errors?.custom_fields?.[field.id]?.message}
                      required={field.is_required}
                    />
                  );
                }

                // Default text/number
                return (
                  <TextField 
                    {...controllerField} 
                    type={field.field_type === 'number' ? 'number' : 'text'}
                    label={field.name} 
                    fullWidth 
                    error={!!errors?.custom_fields?.[field.id]}
                    helperText={errors?.custom_fields?.[field.id]?.message}
                    required={field.is_required}
                  />
                );
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default DynamicFieldsRenderer;
