import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { reportsApi } from '../../../services/reportsApi';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink } from 'lucide-react';
import { Field } from './FormControls';

// ─── ApplicationMethod Dropdown ───────────────────────────────────────────────
// A self-contained select that fetches options from API
const ApplicationMethodSelect = ({ value, onChange, isError, required }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.getApplicationMethods()
      .then(res => setOptions(res.data.results || res.data))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      <select
        className={`
          w-full h-10 rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500
          ${isError ? 'border-red-400' : 'border-slate-200'}
          ${loading ? 'text-slate-400' : 'text-slate-800'}
        `}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={loading}
        required={required}
        dir="rtl"
      >
        <option value="">{loading ? 'جاري التحميل...' : '-- اختر الطريقة --'}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.name}>{opt.name}</option>
        ))}
      </select>
      {loading && (
        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
      )}
      {!loading && options.length === 0 && (
        <a
          href="/reports/master-data"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-1"
        >
          <ExternalLink className="w-3 h-3" />
          أضف طرق إضافة من البيانات الأساسية
        </a>
      )}
    </div>
  );
};


// ─── DynamicFieldsRenderer ────────────────────────────────────────────────────
const DynamicFieldsRenderer = ({ fields: explicitFields, modelName, control, errors, basePath = 'custom_fields', getProfileError }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (explicitFields) {
      setFields(explicitFields);
      return;
    }
    if (modelName) {
      setLoading(true);
      reportsApi.getCustomFields({ content_type_model: modelName })
        .then(res => setFields(res.data.results || res.data))
        .catch(err => console.error('Failed to load dynamic fields', err))
        .finally(() => setLoading(false));
    }
  }, [modelName, explicitFields]);

  if (loading) return (
    <div className="flex justify-center p-4">
      <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
    </div>
  );
  if (fields.length === 0) return null;

  return (
    <div className="col-span-12 mt-4">
      <div className="grid grid-cols-12 gap-6">
        {fields.map(field => {
          const fieldId   = field.id   || field.name;
          const fieldLabel = field.label || field.name;
          const fieldType  = field.field_type || field.type;
          const isRequired = field.is_required ?? field.required;

          const fieldPath = `${basePath}.${fieldId}`;
          const isError   = getProfileError ? !!getProfileError(fieldId) : !!errors?.[basePath]?.[fieldId];
          const errorMsg  = getProfileError ? getProfileError(fieldId)?.message : errors?.[basePath]?.[fieldId]?.message;

          return (
            <div key={fieldId} className="col-span-12 md:col-span-6 lg:col-span-4">
              <Controller
                name={fieldPath}
                control={control}
                rules={{ required: isRequired ? 'هذا الحقل مطلوب' : false }}
                render={({ field: cf }) => {

                  // ── Boolean ──────────────────────────────────────────────
                  if (fieldType === 'boolean') {
                    return (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-7">
                        <Switch
                          checked={!!cf.value}
                          onCheckedChange={cf.onChange}
                          id={`switch-${fieldId}`}
                        />
                        <Label htmlFor={`switch-${fieldId}`} className="font-medium text-slate-700">
                          {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
                        </Label>
                        {isError && <span className="text-xs text-red-500">{errorMsg}</span>}
                      </div>
                    );
                  }

                  // ── Date ─────────────────────────────────────────────────
                  if (fieldType === 'date') {
                    return (
                      <Field label={fieldLabel} required={isRequired}>
                        <Input
                          {...cf}
                          type="date"
                          className={isError ? 'border-red-500' : ''}
                          value={cf.value || ''}
                        />
                        {isError && <span className="text-xs text-red-500 mt-1">{errorMsg}</span>}
                      </Field>
                    );
                  }

                  // ── Application Method (dynamic API dropdown) ─────────────
                  if (fieldType === 'application_method') {
                    return (
                      <Field label={fieldLabel} required={isRequired}>
                        <ApplicationMethodSelect
                          value={cf.value}
                          onChange={cf.onChange}
                          isError={isError}
                          required={isRequired}
                        />
                        {isError && <span className="text-xs text-red-500 mt-1">{errorMsg}</span>}
                      </Field>
                    );
                  }

                  // ── Static select (legacy) ────────────────────────────────
                  if (fieldType === 'select' || fieldType === 'dropdown') {
                    const opts = field.options || [];
                    return (
                      <Field label={fieldLabel} required={isRequired}>
                        <select
                          className={`w-full h-10 rounded-lg border px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isError ? 'border-red-400' : 'border-slate-200'}`}
                          value={cf.value || ''}
                          onChange={e => cf.onChange(e.target.value)}
                          required={isRequired}
                          dir="rtl"
                        >
                          <option value="">-- اختر --</option>
                          {opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        {isError && <span className="text-xs text-red-500 mt-1">{errorMsg}</span>}
                      </Field>
                    );
                  }

                  // ── Default: text / number ────────────────────────────────
                  return (
                    <Field label={fieldLabel} required={isRequired}>
                      <Input
                        {...cf}
                        type={fieldType === 'number' ? 'number' : 'text'}
                        className={isError ? 'border-red-500' : ''}
                        value={cf.value || ''}
                      />
                      {isError && <span className="text-xs text-red-500 mt-1">{errorMsg}</span>}
                    </Field>
                  );
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicFieldsRenderer;
