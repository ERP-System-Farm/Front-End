import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/AuthContext';
import { loginUser } from '../../features/auth/services';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Leaf, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Trees,
  CheckCircle2,
  Droplet,
  Globe,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('atlas_theme') !== 'light';
  });

  useEffect(() => {
    const savedLang = localStorage.getItem('atlas_lang') || 'ar';
    if (i18n.language !== savedLang) i18n.changeLanguage(savedLang);
    document.documentElement.dir  = savedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLang;

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [i18n, darkMode]);

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('atlas_lang', next);
    document.documentElement.dir  = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem('atlas_theme', nextTheme ? 'dark' : 'light');
  };

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
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-400 font-sans selection:bg-emerald-500/30">
      
      {/* ─── LEFT PANEL (DESKTOP FEATURE SHOWCASE - SAAS PREMIUM STYLE) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-muted border-r border-border overflow-hidden select-none items-center justify-center p-12">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] dark:bg-emerald-500/5" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] dark:bg-emerald-600/5" />

        {/* Modern Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.012)_1px,transparent_1px)] bg-[size:40px_40px] bg-center [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] z-1" />

        <div className="relative z-10 max-w-lg text-center lg:text-left rtl:text-right">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Leaf className="w-5.5 h-5.5 stroke-[2.5]" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground flex items-center gap-1">
              Atlas <span className="text-emerald-500">Farm</span>
            </span>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight mb-6 leading-tight text-foreground">
            {isRTL ? 'تحليلات وإدارة زراعية متكاملة ومؤمنة' : 'Precision Farming ERP Reimagined'}
          </h2>

          <p className="text-base text-muted-foreground leading-relaxed mb-10 font-semibold">
            {isRTL 
              ? 'سجل دخولك الآن لمراقبة الإنتاجية، وإدخال تقارير الحصاد، وجدولة مهام المهندسين والآليات الزراعية بشكل متكامل.' 
              : 'Log in to track yield, manage operational reports, schedule daily worker entries, and audit fleet activities.'}
          </p>

          {/* Quick list specs */}
          <div className="space-y-4.5">
            {[
              { icon: <Trees className="w-5 h-5 text-emerald-500" />, text: isRTL ? 'إدارة حقول وعصائر الزيتون والنخيل' : 'Palm & olive structured modules' },
              { icon: <Droplet className="w-5 h-5 text-amber-500" />, text: isRTL ? 'لوحة تحكم إحصائية للآلات والأسطول' : 'Active fleet tracking & operational logs' },
              { icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />, text: isRTL ? 'أمن بيانات وعزل كامل للشركات' : 'Strict multi-tenant security architecture' }
            ].map((spec, i) => (
              <div key={i} className="flex items-center gap-3.5 bg-card/40 backdrop-blur-sm border border-border p-4 rounded-2xl transition-all hover:border-emerald-500/20">
                <div className="p-2 bg-background border border-border rounded-xl flex items-center justify-center">
                  {spec.icon}
                </div>
                <span className="text-sm font-bold text-foreground">{spec.text}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ─── RIGHT PANEL (AUTHENTICATION FORM PANEL) ────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
        
        {/* Ambient Glows for Mobile */}
        <div className="absolute top-[-10%] right-[-10%] w-[320px] h-[320px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none lg:hidden" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[320px] h-[320px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none lg:hidden" />

        {/* Top bar controllers */}
        <div className="flex justify-between items-center z-10 w-full mb-12">
          
          {/* Brand Logo for small screen */}
          <Link to="/" className="flex items-center gap-2 select-none lg:hidden">
            <div className="w-8 h-8 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Leaf className="w-4.5 h-4.5" />
            </div>
            <span className="text-base font-black tracking-tight">Atlas</span>
          </Link>

          <div className="flex items-center gap-2.5 ms-auto">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition-all duration-200 cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Language Switch */}
            <button 
              onClick={toggleLanguage}
              className="px-3.5 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black">{isRTL ? 'EN' : 'العربية'}</span>
            </button>
          </div>

        </div>

        {/* Center Card Container */}
        <div className="w-full max-w-md mx-auto z-10 my-auto">
          
          <div className="text-center lg:text-left rtl:text-right mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2.5 tracking-tight leading-tight">
              {t('auth.welcome_back', 'مرحباً بعودتك')}
            </h1>
            <p className="text-sm font-semibold text-muted-foreground">
              {t('auth.login_subtitle', 'قم بتسجيل الدخول للوصول إلى النظام')}
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('auth.email', 'البريد الإلكتروني')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-4.5 rtl:pl-0 rtl:pr-4.5 text-muted-foreground pointer-events-none">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      placeholder="admin@example.com"
                      className={`w-full bg-card border ${errors.email ? 'border-destructive focus:ring-destructive/30' : 'border-border focus:border-emerald-500 focus:ring-emerald-500/20'} rounded-2xl pl-12 pr-4 rtl:pl-4 rtl:pr-12 py-3.5 text-sm font-semibold text-foreground placeholder-muted-foreground/60 outline-hidden focus:ring-4 transition-all duration-200`}
                    />
                  )}
                />
              </div>
              {errors.email && (
                <span className="text-xs font-bold text-destructive flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('auth.password', 'كلمة المرور')}
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors">
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-4.5 rtl:pl-0 rtl:pr-4.5 text-muted-foreground pointer-events-none">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`w-full bg-card border ${errors.password ? 'border-destructive focus:ring-destructive/30' : 'border-border focus:border-emerald-500 focus:ring-emerald-500/20'} rounded-2xl pl-12 pr-12 rtl:pl-12 rtl:pr-12 py-3.5 text-sm font-semibold text-foreground placeholder-muted-foreground/60 outline-hidden focus:ring-4 transition-all duration-200`}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-4.5 rtl:pr-0 rtl:pl-4.5 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs font-bold text-destructive flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 mt-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{t('auth.login_btn', 'دخول')}</span>
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

          </form>

          <p className="text-center text-sm font-bold text-muted-foreground mt-8">
            {t('auth.no_account', 'ليس لديك حساب؟')}{' '}
            <Link to="/register" className="text-emerald-500 hover:text-emerald-600 transition-colors mx-1">
              {t('auth.request_access', 'طلب انضمام')}
            </Link>
          </p>

        </div>

        {/* Footer info text */}
        <div className="w-full text-center text-xs text-muted-foreground/75 mt-12 select-none">
          © {new Date().getFullYear()} Atlas Farm ERP. All rights reserved.
        </div>

      </div>

    </div>
  );
};

export default Login;
