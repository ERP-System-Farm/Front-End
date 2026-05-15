import React, { useState } from 'react';
import { TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../app/AuthContext';
import { loginUser } from '../../features/auth/services';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

const Login = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const response = await loginUser(data);
      login(response.access, response.user);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.detail || t('auth.login_failed', 'فشل تسجيل الدخول. تأكد من بياناتك.'));
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-green-950 to-emerald-950 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/30 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-10 m-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2 tracking-tight">
            {t('auth.welcome_back', 'مرحباً بعودتك')}
          </h1>
          <p className="text-slate-400">{t('auth.login_subtitle', 'قم بتسجيل الدخول للوصول إلى النظام')}</p>
        </div>

        {serverError && (
          <Alert severity="error" className="mb-6 bg-red-500/10 text-red-400 border border-red-500/20" icon={false}>
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('auth.email', 'البريد الإلكتروني')}
                type="email"
                variant="filled"
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{
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
                }}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('auth.password', 'كلمة المرور')}
                type="password"
                variant="filled"
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{
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
                }}
              />
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting}
            sx={{
              py: 1.5,
              mt: 2,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(to right, #16a34a, #10b981)',
              boxShadow: '0 4px 14px 0 rgba(22, 163, 74, 0.39)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(22, 163, 74, 0.23)',
              }
            }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('auth.login_btn', 'دخول')}
          </Button>
        </form>

        <p className="text-center text-slate-400 mt-8">
          {t('auth.no_account', 'ليس لديك حساب؟')}{' '}
          <Link to="/register" className="text-green-400 hover:text-green-300 font-semibold transition-colors mx-1">
            {t('auth.request_access', 'طلب انضمام')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
