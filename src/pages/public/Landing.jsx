import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { useTranslation } from 'react-i18next';
import { injectCMSTranslations } from '../../i18n/index.js';
import { 
  Leaf, 
  Trees, 
  Droplet, 
  Globe, 
  Sun, 
  Moon, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  Mail, 
  BarChart3, 
  Shield, 
  Cpu, 
  Zap,
  ChevronDown
} from 'lucide-react';

import api from '../../services/api';

// ─── Helper: fetch CMS content (unauthenticated) ───────────────────────────
const fetchCMSContent = async () => {
  const response = await api.get('auth/public/landing');
  return response.data;
};

const Landing = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('atlas_theme') !== 'light';
  });
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const savedLang = localStorage.getItem('atlas_lang') || 'ar';
    if (i18n.language !== savedLang) i18n.changeLanguage(savedLang);
    document.documentElement.dir  = savedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLang;

    // Reacting theme class on document element to coordinate shadcn/tailwind
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    fetchCMSContent()
      .then(data => { if (data) injectCMSTranslations(data); })
      .catch(() => { /* fallback */ })
      .finally(() => setLoading(false));

    return () => window.removeEventListener('scroll', handleScroll);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-400 font-sans selection:bg-emerald-500/30">
      
      {/* ─── SCROLL & FLOATING CUSTOM ANIMATIONS ───────────────── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translate3d(0, 30px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes float {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
        }
        .anim-fade-up {
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-float {
          animation: float 6s ease-in-out infinite;
        }
      `}} />

      {/* ─── NAVBAR (SHADCN SYSTEM COMPATIBLE) ──────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/85 backdrop-blur-md border-b border-border py-3.5' 
          : 'bg-transparent py-6'
      }`}>
        <div className="container mx-auto px-6 flex justify-between items-center max-w-7xl">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 select-none">
            {t('landing.logo_url') ? (
              <img src={t('landing.logo_url')} className="w-10 h-10 rounded-xl object-cover shadow-lg" alt="Logo" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                <Leaf className="w-5.5 h-5.5 stroke-[2.5]" />
              </div>
            )}
            <span className="text-xl font-black tracking-tight text-foreground flex items-center gap-1">
              {t('landing.logo_text') || (isRTL ? 'أطلس سيوة' : 'Atlas Farm')}
            </span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { id: 'about', label: isRTL ? 'من نحن' : 'About' },
              { id: 'palm', label: isRTL ? 'قسم التمور' : 'Palm Unit' },
              { id: 'olive', label: isRTL ? 'قسم الزيتون' : 'Olive Unit' },
              { id: 'features', label: isRTL ? 'المميزات' : 'Features' },
              { id: 'contact', label: isRTL ? 'اتصل بنا' : 'Contact' }
            ].map((link) => (
              <a 
                key={link.id} 
                href={`#${link.id}`} 
                className="text-sm font-bold text-muted-foreground hover:text-emerald-500 hover:-translate-y-0.5 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3.5">
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-emerald-500/10 hover:text-emerald-500 hover:rotate-12 cursor-pointer transition-all duration-200"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-500" />}
            </button>

            {/* Language Switch */}
            <button 
              onClick={toggleLanguage}
              className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer flex items-center gap-2 transition-all duration-200"
            >
              <Globe className="w-4.5 h-4.5 text-emerald-500" />
              <span className="text-xs font-black">{isRTL ? 'EN' : 'العربية'}</span>
            </button>

            {user ? (
              <Link 
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 cursor-pointer transition-all duration-200"
              >
                {isRTL ? 'لوحة التحكم' : 'Go to Dashboard'}
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login"
                  className="text-sm font-bold px-4 py-2.5 text-foreground hover:text-emerald-500 transition-colors"
                >
                  {isRTL ? 'دخول' : 'Sign In'}
                </Link>
                <Link 
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {isRTL ? 'ابدأ الآن' : 'Get Started'}
                </Link>
              </div>
            )}

          </div>

        </div>
      </nav>

      {/* ─── HERO SECTION (PERFECTLY CENTERED, SHADCN / TAILWIND DESIGN) ─── */}
      <section className="relative min-h-screen flex items-center justify-center bg-radial from-emerald-500/8 via-transparent to-transparent dark:from-emerald-500/4 overflow-hidden pt-24">
        
        {/* Modern Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:60px_60px] bg-center [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] z-1" />

        <div className="container mx-auto px-6 max-w-5xl text-center anim-fade-up relative z-10 py-12">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">
              {isRTL ? 'الجيل القادم من ذكاء وإدارة المزارع' : 'Next-Gen Farm Intelligence Engine'}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 text-foreground leading-tight">
            {t('landing.hero_title', 'الزراعة الدقيقة، أعيد تعريفها.')}
          </h1>

          {/* Description Subtext */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-semibold">
            {t('landing.hero_text', 'إدارة مجالات النخيل والزيتون والمحاصيل الزراعية بسلاسة تامة.')}
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="flex gap-4.5 justify-center flex-wrap mb-16">
            <Link 
              to={user ? '/dashboard' : '/register'}
              className="px-8 py-4 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <span>{isRTL ? 'سجل حسابك مجاناً' : 'Get Started Free'}</span>
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
            <a 
              href="#about"
              className="px-8 py-4 rounded-2xl border border-border bg-card hover:bg-muted text-foreground font-bold text-base hover:-translate-y-0.5 transition-all duration-200"
            >
              {isRTL ? 'اقرأ المزيد عنّا' : 'Learn More'}
            </a>
          </div>

          {/* Real-time ERP Mockup Dashboard Widget */}
          <div className="anim-float flex justify-center">
            <div className="w-full max-w-3xl rounded-3xl border border-border bg-card/60 backdrop-blur-md p-6 sm:p-10 shadow-2xl shadow-emerald-950/10 dark:shadow-black/60 text-left">
              
              {/* Window dots */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 rounded-full px-3.5 py-1 text-xs font-black border border-emerald-500/20">
                  {isRTL ? 'إحصائيات حية للمزرعة' : 'Real-time ERP Metrics'}
                </div>
              </div>

              {/* Data modules mockup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="bg-background/80 border border-border rounded-2xl p-6 transition-all hover:border-emerald-500/30">
                  <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
                    {isRTL ? 'إجمالي المحصول المحصود' : 'Total Harvested Crop'}
                  </div>
                  <div className="text-3xl font-black mt-2 text-foreground">
                    142,504 KG
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-emerald-500">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span className="text-xs font-black">+12.4% {isRTL ? 'زيادة في الإنتاج' : 'Growth'}</span>
                  </div>
                </div>

                <div className="bg-background/80 border border-border rounded-2xl p-6 transition-all hover:border-blue-500/30">
                  <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
                    {isRTL ? 'الآليات والجرارات الزراعية النشطة' : 'Active Farming Fleet'}
                  </div>
                  <div className="text-3xl font-black mt-2 text-foreground">
                    38 active
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-blue-500">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span className="text-xs font-black">98.2% {isRTL ? 'كفاءة تشغيل' : 'Operation rate'}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Floating scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground animate-bounce z-10">
          <span className="text-[10px] font-bold tracking-widest uppercase">{isRTL ? 'اسحب لأسفل' : 'Scroll'}</span>
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ─── ABOUT / STATS SECTION (PERFECTLY CENTERED) ─────────── */}
      <section id="about" className="py-32 bg-background border-t border-border">
        <div className="container mx-auto px-6 text-center max-w-6xl">
          
          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">
            {isRTL ? 'التحليلات والرؤية الكلية للمزرعة' : 'Global Farm Analytics'}
          </span>
          
          <h2 className="text-3xl sm:text-5xl font-black mt-3 mb-6 text-foreground tracking-tight max-w-3xl mx-auto">
            {t('landing.about_title') || (isRTL ? 'نظام أطلس لإدارة حقول النخيل والزيتون الدقيقة' : 'Precision Farming Redefined')}
          </h2>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-16 font-semibold">
            {t('landing.about_text') || (isRTL 
              ? 'تم تصميم نظام أطلس الزراعي الموحد ليقود ثورة تكنولوجية في أتمتة وتحليل بيانات المزارع الكبيرة. يساعدك محركنا الذكي على مراقبة الأشجار والإنتاجية وجدولة المهام والأسطول في مكان واحد.' 
              : 'Atlas ERP empowers large-scale agricultural enterprises to register layout elements, tracks trees individually, structures daily engineer reporting sheets, and automates continuous yield metrics.')}
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: '50+', label: isRTL ? 'موقع وقطاع مسجل' : 'Registered Locations', color: 'hover:border-emerald-500' },
              { value: '100K+', label: isRTL ? 'نخلة وشجرة زيتون' : 'Active Registered Trees', color: 'hover:border-amber-500' },
              { value: '10K+', label: isRTL ? 'تقرير تشغيلي يومي' : 'Daily Logs & Sheets', color: 'hover:border-blue-500' },
              { value: '24/7', label: isRTL ? 'تحليلات تشغيلية متكاملة' : 'Continuous AI Monitoring', color: 'hover:border-purple-500' },
            ].map((stat, i) => (
              <div 
                key={i} 
                className={`p-8 rounded-2xl bg-card border border-border shadow-md transition-all duration-300 hover:-translate-y-1.5 ${stat.color}`}
              >
                <div className="text-4xl font-extrabold text-foreground tracking-tight mb-2">{stat.value}</div>
                <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── CROPS SHOWCASE (CENTERED GRIDS & BALANCED CONTENT) ─── */}
      <section className="py-32 bg-muted border-t border-border">
        <div className="container mx-auto px-6 text-center max-w-6xl">
          
          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">
            {isRTL ? 'الأقسام والزراعات المتخصصة' : 'Specialized Crops Units'}
          </span>
          
          <h2 className="text-3xl sm:text-5xl font-black mt-3 mb-16 text-foreground tracking-tight">
            {isRTL ? 'أتمتة وحصاد المحاصيل الرئيسية' : 'Structured Yield Units'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card 1: Palm (النخيل) */}
            <div 
              id="palm"
              className="p-8 sm:p-12 rounded-3xl bg-card border border-border shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-500 rounded-full px-4 py-1.5 text-xs font-black border border-emerald-500/20 mb-6">
                <Trees className="w-4 h-4" />
                <span>{isRTL ? 'قطاع النخيل والفسائل' : 'Palm & Dates Unit'}</span>
              </div>

              <h3 className="text-2xl font-black mb-4 text-foreground text-center">
                {isRTL ? 'إدارة وتتبع النخيل والتمور' : 'Palm & Date Management'}
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm text-center font-semibold">
                {t('landing.palm_text', 'تتبع كل شجرة أم، عمليات الفسيل، وحجم الحصاد المتوقع وتلقيح النخيل بالكامل.')}
              </p>

              <div className="flex flex-col gap-3.5 items-center">
                {[
                  (isRTL ? 'تتبع هرمي متكامل للحوشات والقطاعات' : 'Hierarchical location node management'),
                  (isRTL ? 'تسجيل صنف النخيل وتاريخ الزراعة واللقاح' : 'Register palm varieties, planting dates'),
                  (isRTL ? 'تحليلات الحصاد والفرز والإنتاجية النهائية' : 'Complete yields, grading, and sorting workflows')
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2.5 justify-center">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Olive (الزيتون) */}
            <div 
              id="olive"
              className="p-8 sm:p-12 rounded-3xl bg-card border border-border shadow-xl hover:border-amber-500/40 transition-all duration-300 flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 rounded-full px-4 py-1.5 text-xs font-black border border-amber-500/20 mb-6">
                <Droplet className="w-4 h-4" />
                <span>{isRTL ? 'قطاع الزيتون والزيت' : 'Olive & Oil Unit'}</span>
              </div>

              <h3 className="text-2xl font-black mb-4 text-foreground text-center">
                {isRTL ? 'إدارة حقول وعصر الزيتون' : 'Olive Yield & Processing'}
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm text-center font-semibold">
                {t('landing.olive_text', 'عمليات حصاد وعصر الزيتون متزامنة ومتناسقة، وتتبع استهلاك المعاصر والإنتاج الكلي للزيت.')}
              </p>

              <div className="flex flex-col gap-3.5 items-center">
                {[
                  (isRTL ? 'جدولة ري وتسميد أشجار الزيتون موسميًا' : 'Automated seasonal irrigation and fertilization'),
                  (isRTL ? 'مراقبة خط الإنتاج الكلي ونسبة استخلاص الزيت' : 'Track refinery oil extraction metrics'),
                  (isRTL ? 'تسجيل جودة الزيت والتعبئة والمخزون' : 'Complete packaging integration and stock movement')
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2.5 justify-center">
                    <CheckCircle2 className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── TECHNICAL FEATURES GRID (SHADCN SYSTEM ALIGNED) ─── */}
      <section id="features" className="py-32 bg-background border-t border-border">
        <div className="container mx-auto px-6 text-center max-w-6xl">
          
          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">
            {isRTL ? 'القدرات التشغيلية والتقنية' : 'Unmatched Technical Capabilities'}
          </span>

          <h2 className="text-3xl sm:text-5xl font-black mt-3 mb-16 text-foreground tracking-tight">
            {t('landing.features_title') || (isRTL ? 'ما الذي يجعل أطلس الأفضل لإدارة مزارعك؟' : 'Why Choose Atlas ERP for Your Agriculture?')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <BarChart3 className="w-6 h-6 text-emerald-500" />,
                title: isRTL ? 'تحليلات المزرعة التفاعلية' : 'Stunning Visual Analytics',
                desc: isRTL ? 'رسوم بيانية ومؤشرات أداء متطورة لقياس تكاليف العمالة والتشغيل والإنتاجية أولاً بأول.' : 'Advanced interactive widgets tracking work hours, peak performance sectors, and active financials.'
              },
              {
                icon: <Shield className="w-6 h-6 text-blue-500" />,
                title: isRTL ? 'أمان وعزل متعدد للبيانات' : 'Multi-Tenant Isolation Secure',
                desc: isRTL ? 'أمان بمستويات البنوك وعزل تام لقاعدة البيانات والملفات الخاصة بكل شركة مسجلة بالكامل.' : 'Complete database and layout isolation matching banking scopes for enterprise companies.'
              },
              {
                icon: <Cpu className="w-6 h-6 text-purple-500" />,
                title: isRTL ? 'لوحة تحكم مرنة وسريعة' : 'Glassmorphic Ultra-Speed Web App',
                desc: isRTL ? 'تطبيق ويب فائق السرعة يعمل على مختلف الأجهزة وشاشات المحمول لسهولة رصد البيانات من الميدان.' : 'Premium light/dark themes built on robust APIs, operating fluidly on all mobile and tablets.'
              },
              {
                icon: <Zap className="w-6 h-6 text-amber-500" />,
                title: isRTL ? 'لوحة إدارة وحقن البيانات' : 'Custom Seeding & JSON Injections',
                desc: isRTL ? 'إمكانية رفع وحقن ومسح بيانات الهيكل والتكاليف من ملفات JSON بمرونة وسهولة فائقة للمشرفين.' : 'Comprehensive JSON uploading and purging pipelines with dynamic template outlines for super admins.'
              }
            ].map((feat, i) => (
              <div 
                key={i}
                className="p-8 rounded-3xl bg-card border border-border shadow-md hover:border-foreground/30 transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="p-3 bg-muted rounded-2xl mb-5 flex items-center justify-center border border-border">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-black mb-2 text-foreground">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm font-semibold">{feat.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── CONTACT SECTION (CENTERED) ────────────────────────── */}
      <section id="contact" className="py-32 bg-muted border-t border-border">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          
          <h2 className="text-3xl sm:text-5xl font-black mb-4 text-foreground tracking-tight">
            {t('landing.contact_title') || (isRTL ? 'ابدأ في رقمنة وأتمتة مزارعك اليوم' : 'Ready to Transform Your Operations?')}
          </h2>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-16 font-semibold">
            {t('landing.contact_text') || (isRTL 
              ? 'تواصل معنا الآن للحصول على استشارة كاملة لربط مزارعك وهيكلها وتجهيز لوحة التحكم المخصصة لشركتك.' 
              : 'Sign up today to configure your companies, isolate records, and launch dynamic daily reporting tools.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            <div className="p-8 bg-card border border-border rounded-2xl shadow-sm text-center flex flex-col items-center">
              <Mail className="w-8 h-8 text-emerald-500 mb-4" />
              <div className="text-lg font-black text-foreground">{t('landing.contact_email') || 'info@atlasfarm.dz'}</div>
              <span className="text-xs font-bold text-muted-foreground mt-1">
                {isRTL ? 'البريد الإلكتروني المباشر' : 'Direct Email Channel'}
              </span>
            </div>

            <div className="p-8 bg-card border border-border rounded-2xl shadow-sm text-center flex flex-col items-center">
              <Phone className="w-8 h-8 text-emerald-500 mb-4" />
              <div className="text-lg font-black text-foreground">{t('landing.contact_phone') || '+213 (0) 5XX XXX XXX'}</div>
              <span className="text-xs font-bold text-muted-foreground mt-1">
                {isRTL ? 'الهاتف المباشر وعلاقات العملاء' : 'Call center direct support'}
              </span>
            </div>
          </div>

          <Link 
            to="/register"
            className="px-10 py-4.5 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-lg shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/35 hover:-translate-y-0.5 transition-all duration-200 inline-block cursor-pointer"
          >
            {isRTL ? 'سجل معنا وابدأ الآن' : 'Get Started Free'}
          </Link>

        </div>
      </section>

      {/* ─── FOOTER (SHADCN ALIGNED) ──────────────────────────── */}
      <footer className="py-16 border-t border-border bg-background text-center">
        <div className="container mx-auto px-6 max-w-5xl">
          
          <div className="flex items-center justify-center gap-3 mb-6 select-none">
            {t('landing.logo_url') ? (
              <img src={t('landing.logo_url')} className="w-8 h-8 rounded-lg object-cover" alt="Logo" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white">
                <Leaf className="w-4 h-4" />
              </div>
            )}
            <span className="text-base font-black text-foreground">
              {t('landing.logo_text') || (isRTL ? 'أطلس سيوة' : 'Atlas Farm')}
            </span>
          </div>

          <p className="text-xs font-bold text-muted-foreground mb-2">
            © {new Date().getFullYear()} {t('landing.logo_text') || (isRTL ? 'أطلس سيوة' : 'Atlas Farm')}. All rights reserved.
          </p>
          
          <p className="text-[11px] font-semibold text-muted-foreground/70 max-w-sm mx-auto">
            {isRTL ? 'نظام متطور موثوق ومعتمد لإدارة أصول وهياكل الزراعة الذكية.' : 'Advanced architecture engineered for smart farming workflows.'}
          </p>

        </div>
      </footer>

    </div>
  );
};

export default Landing;
