import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
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
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  // Recovery States
  const [phase, setPhase] = useState('request'); // 'request' | 'code' | 'new_password' | 'success'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Polling for manager approval when in the 'code' phase
  useEffect(() => {
    if (phase !== 'code') return;

    const interval = setInterval(() => {
      checkApprovalStatus(true); // silent check
    }, 4000);

    return () => clearInterval(interval);
  }, [phase, email, code]);

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

  // Phase 1: Submit email to request password reset code
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      const response = await api.post('auth/password-reset/request', { email });
      setCode(response.data.code);
      setPhase('code');
      toast.success(isRTL ? "تم إنشاء طلب الاستعادة بنجاح ✓" : "Password reset request filed successfully ✓");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || (isRTL ? "البريد الإلكتروني المدخل غير مسجل لدينا" : "Email is not registered in our records"));
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Check reset code approval status
  const checkApprovalStatus = async (silent = false) => {
    if (!silent) setStatusLoading(true);
    setError('');
    try {
      const response = await api.post('auth/password-reset/status', { email, code });
      if (response.data.is_approved) {
        setPhase('new_password');
        toast.success(isRTL ? "تم قبول طلبك! تفضل بإدخال كلمة المرور الجديدة" : "Request approved! Set your new password");
      } else if (!silent) {
        toast.info(isRTL ? "الطلب معلق، يرجى انتظار موافقة المدير" : "Request is still pending manager approval");
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        setError(err.response?.data?.error || (isRTL ? "فشل التحقق من حالة الطلب" : "Failed to verify request approval"));
      }
    } finally {
      if (!silent) setStatusLoading(false);
    }
  };

  // Phase 3: Set New Password
  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 8) {
      setError(isRTL ? "كلمة المرور يجب ألا تقل عن 8 أحرف" : "Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post('auth/password-reset/confirm', {
        email,
        code,
        new_password: newPassword
      });
      setPhase('success');
      toast.success(isRTL ? "تم تغيير كلمة المرور بنجاح ✓" : "Password updated successfully ✓");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || (isRTL ? "فشل تحديث كلمة المرور" : "Failed to update password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-400 font-sans selection:bg-emerald-500/30">
      
      {/* ─── LEFT PANEL (DESKTOP FEATURE SHOWCASE - SAAS PREMIUM STYLE) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-muted border-r border-border overflow-hidden select-none items-center justify-center p-12">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] dark:bg-emerald-500/5" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] dark:bg-emerald-600/5" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.012)_1px,transparent_1px)] bg-[size:40px_40px] bg-center [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] z-1" />

        <div className="relative z-10 max-w-lg text-center lg:text-left rtl:text-right">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Leaf className="w-5.5 h-5.5 stroke-[2.5]" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground flex items-center gap-1">
              Atlas <span className="text-emerald-500">Farm</span>
            </span>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight mb-6 leading-tight text-foreground">
            {isRTL ? 'نظام الحماية عالي الكفاءة للمنشآت الزراعية' : 'High Security Infrastructure for Farms'}
          </h2>

          <p className="text-base text-muted-foreground leading-relaxed mb-10 font-semibold">
            {isRTL 
              ? 'تخضع جميع عمليات استرداد الحساب وتغيير كلمات المرور لمراجعة مباشرة من مدير المزرعة أو المسؤول لضمان سلامة البيانات وحماية ملكيتك.' 
              : 'All user credential recovery updates are supervised and authorized by local farm administrators to strictly secure operations data.'}
          </p>

          <div className="space-y-4.5">
            {[
              { icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />, text: isRTL ? 'موافقات إدارية ثنائية لمنع الاختراق' : 'Approved-only recovery flow' },
              { icon: <Trees className="w-5 h-5 text-amber-500" />, text: isRTL ? 'تشفير كامل لكلمات المرور وقواعد البيانات' : 'Enterprise bcrypt credentials hashes' }
            ].map((spec, i) => (
              <div key={i} className="flex items-center gap-3.5 bg-card/40 backdrop-blur-sm border border-border p-4 rounded-2xl">
                <div className="p-2 bg-background border border-border rounded-xl flex items-center justify-center">
                  {spec.icon}
                </div>
                <span className="text-sm font-bold text-foreground">{spec.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (INTERACTIVE PASSWORD RECOVERY FORM) ─── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 relative overflow-y-auto">
        
        {/* Top Navbar Actions */}
        <div className="w-full flex items-center justify-between mb-8 select-none z-10">
          <Link to="/login" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1`} />
            <span>{isRTL ? 'العودة لتسجيل الدخول' : 'Back to login'}</span>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Dark Mode Switcher */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="px-4.5 py-2.5 rounded-2xl bg-card border border-border hover:bg-muted text-sm font-bold text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-2 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>{isRTL ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </div>

        {/* Center Card Container */}
        <div className="w-full max-w-md mx-auto z-10 my-auto">
          
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold rounded-2xl flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PHASE 1: REQUEST CODE */}
          {phase === 'request' && (
            <div className="space-y-6">
              <div className="text-center lg:text-left rtl:text-right">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 mx-auto lg:mx-0">
                  <Key className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-extrabold text-foreground mb-2.5 tracking-tight">
                  {isRTL ? 'استعادة كلمة المرور' : 'Password Recovery'}
                </h1>
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                  {isRTL 
                    ? 'أدخل بريدك الإلكتروني المسجل وسنقوم بإنشاء طلب استعادة آمن لمدير النظام لتأكيد هويتك وتعديل الحساب.' 
                    : 'Enter your registered email and we will initiate a secure recovery request for the farm manager to authorize.'}
                </p>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-4.5 rtl:pl-0 rtl:pr-4.5 text-muted-foreground pointer-events-none">
                      <Mail className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-card border border-border focus:border-emerald-500 focus:ring-emerald-500/20 rounded-2xl pl-12 pr-4 rtl:pl-4 rtl:pr-12 py-3.5 text-sm font-semibold text-foreground placeholder-muted-foreground/60 outline-hidden focus:ring-4 transition-all duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 mt-6"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{isRTL ? 'إرسال طلب استعادة للمدير' : 'Send Recovery Request'}</span>
                      <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* PHASE 2: PENDING APPROVAL & CODE BOX */}
          {phase === 'code' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center lg:text-left rtl:text-right">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4 mx-auto lg:mx-0 animate-pulse">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-extrabold text-foreground mb-2.5 tracking-tight">
                  {isRTL ? 'بانتظار موافقة المدير' : 'Pending Farm Approval'}
                </h1>
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                  {isRTL 
                    ? 'لقد تم تقديم الطلب بنجاح! تفضل بتزويد المدير بالرمز أدناه لاعتماده والموافقة على تغيير كلمة مرورك.' 
                    : 'Your password reset request has been filed! Share the code below with your manager to approve your request.'}
                </p>
              </div>

              {/* Code display card */}
              <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 text-center space-y-4">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  {isRTL ? 'رمز الاسترداد الخاص بك' : 'Your Recovery Code'}
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-[0.3em] text-amber-600 dark:text-amber-400 block pr-[-0.3em] select-all">
                  {code}
                </span>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>{isRTL ? 'سيقوم النظام بالتحديث تلقائياً عند موافقة المدير...' : 'System polls dynamically for approval updates...'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => checkApprovalStatus(false)}
                  disabled={statusLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-card border border-border hover:bg-muted text-foreground font-extrabold text-sm shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-200"
                >
                  {statusLoading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4.5 h-4.5" />
                      <span>{isRTL ? 'تحديث والتحقق الآن' : 'Check Status Now'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPhase('request')}
                  className="w-full py-3.5 px-6 rounded-2xl hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-sm transition-all duration-200 text-center block cursor-pointer"
                >
                  {isRTL ? 'تغيير البريد الإلكتروني' : 'Change Email'}
                </button>
              </div>
            </div>
          )}

          {/* PHASE 3: SET NEW PASSWORD */}
          {phase === 'new_password' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center lg:text-left rtl:text-right">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 mx-auto lg:mx-0">
                  <Lock className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-extrabold text-foreground mb-2.5 tracking-tight">
                  {isRTL ? 'إدخال كلمة المرور الجديدة' : 'Set New Password'}
                </h1>
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                  {isRTL 
                    ? 'تم قبول طلب الاسترداد وتفعيله! يرجى إدخال وتأكيد كلمة المرور الجديدة لحسابك.' 
                    : 'Your recovery request is approved! Enter and confirm your new password.'}
                </p>
              </div>

              <form onSubmit={handleConfirmSubmit} className="space-y-5">
                
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-4.5 rtl:pl-0 rtl:pr-4.5 text-muted-foreground pointer-events-none">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-card border border-border focus:border-emerald-500 focus:ring-emerald-500/20 rounded-2xl pl-12 pr-12 rtl:pl-12 rtl:pr-12 py-3.5 text-sm font-semibold text-foreground placeholder-muted-foreground/60 outline-hidden focus:ring-4 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-4.5 rtl:pr-0 rtl:pl-4.5 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 flex items-center pl-4.5 rtl:pl-0 rtl:pr-4.5 text-muted-foreground pointer-events-none">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-card border border-border focus:border-emerald-500 focus:ring-emerald-500/20 rounded-2xl pl-12 pr-12 rtl:pl-12 rtl:pr-12 py-3.5 text-sm font-semibold text-foreground placeholder-muted-foreground/60 outline-hidden focus:ring-4 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-4.5 rtl:pr-0 rtl:pl-4.5 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 mt-6"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{isRTL ? 'حفظ وتحديث كلمة المرور' : 'Save New Password'}</span>
                      <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* PHASE 4: SUCCESS */}
          {phase === 'success' && (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <h1 className="text-3xl font-extrabold text-foreground mb-2.5 tracking-tight">
                {isRTL ? 'تم التحديث بنجاح!' : 'Successfully Restored!'}
              </h1>
              
              <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-sm mx-auto">
                {isRTL 
                  ? 'تم تغيير كلمة المرور وتحديثها بنجاح تام. يمكنك الآن تسجيل الدخول لحسابك مستخدماً كلمة المرور الجديدة.' 
                  : 'Your account security credentials have been updated. You can now log back in using your new credentials.'}
              </p>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 mt-8"
              >
                <span>{isRTL ? 'تسجيل الدخول الآن' : 'Log In Now'}</span>
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

        </div>

        {/* Footer info text */}
        <div className="w-full text-center text-xs text-muted-foreground/75 mt-12 select-none">
          © {new Date().getFullYear()} Atlas Farm ERP. All rights reserved.
        </div>

      </div>

    </div>
  );
};

export default ForgotPassword;
