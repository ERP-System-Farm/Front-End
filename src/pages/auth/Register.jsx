import React, { useState } from 'react';
import { TextField, Button, CircularProgress, Alert, MenuItem } from '@mui/material';
import { registerUser } from '../../features/auth/services';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const roles = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ENGINEER', label: 'Engineer' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'HR', label: 'HR' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
];

const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  role: z.string().min(1, 'يرجى اختيار الدور'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

const darkFieldSx = {
  input: { color: 'white' },
  label: { color: '#94a3b8' },
  '& .MuiFilledInput-root': { 
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    '&::before, &::after': { display: 'none' },
    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
    '&.Mui-focused': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
  },
  '& .MuiFormHelperText-root': { color: '#f87171', ml: 0 },
};

const Register = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', name: '', role: 'ENGINEER' },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setSuccess('');
    try {
      await registerUser(data);
      setSuccess('Registration successful! Your account is pending admin approval.');
      setTimeout(() => navigate('/pending-approval'), 4000);
    } catch (err) {
      if (err.response?.data) {
        const errorMsg = Object.values(err.response.data).flat().join(', ');
        setServerError(errorMsg || 'Registration failed.');
      } else {
        setServerError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-green-950 to-emerald-950 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-green-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-600/30 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-10 m-4 mt-10 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2 tracking-tight">
            {t('auth.register_title', 'مستخدم جديد')}
          </h1>
          <p className="text-slate-400">{t('auth.register_subtitle', 'انضم لمساحة عمل النظام الزراعي')}</p>
        </div>

        {serverError && (
          <Alert severity="error" className="mb-6 bg-red-500/10 text-red-400 border border-red-500/20" icon={false}>
            {serverError}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" className="mb-6 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" icon={false}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth label={t('auth.full_name', 'الاسم الكامل')} variant="filled"
                error={!!errors.name}
                helperText={errors.name?.message}
                sx={darkFieldSx}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth label={t('auth.email', 'البريد الإلكتروني')} type="email" variant="filled"
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={darkFieldSx}
              />
            )}
          />
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth select label={t('auth.role', 'تحديد الدور')} variant="filled"
                error={!!errors.role}
                helperText={errors.role?.message}
                sx={{ 
                  ...darkFieldSx,
                  '& .MuiSelect-select': { color: 'white' }, 
                  '& .MuiSvgIcon-root': { color: 'white' }
                }}
              >
                {roles.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth label={t('auth.password', 'كلمة المرور')} type="password" variant="filled"
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={darkFieldSx}
              />
            )}
          />

          <Button
            type="submit" fullWidth variant="contained" disabled={isSubmitting || !!success}
            sx={{ py: 1.5, mt: 4, borderRadius: '12px', textTransform: 'none', fontSize: '1.1rem', fontWeight: 600, background: 'linear-gradient(to right, #16a34a, #10b981)', boxShadow: '0 4px 14px 0 rgba(22, 163, 74, 0.39)', '&:hover': { boxShadow: '0 6px 20px rgba(22, 163, 74, 0.23)' } }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('auth.register_btn', 'تسجيل الحساب')}
          </Button>
        </form>

        <p className="text-center text-slate-400 mt-8">
          {t('auth.has_account', 'لديك حساب بالفعل؟')}{' '}
          <Link to="/login" className="text-green-400 hover:text-green-300 font-semibold transition-colors mx-1">
            {t('auth.login_link', 'تسجيل الدخول')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
