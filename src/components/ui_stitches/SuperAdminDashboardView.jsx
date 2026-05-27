import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Sliders, 
  Palette, 
  ShieldAlert, 
  Settings2, 
  Coins, 
  Layout, 
  ChevronLeft,
  DollarSign,
  Users,
  Truck,
  Warehouse,
  Sparkles,
  CheckCircle2
} from "lucide-react";

export default function SuperAdminDashboardView({ 
  brandingData = {
    farm_name: "مزرعة أطلس النموذجية",
    currency: "جنيه مصري",
    primary_color: "#1E3A1E",
    accent_color: "#D4AF37",
    font: "Cairo"
  }, 
  featureFlags = {
    accounting: true,
    hr: true,
    fleet: true,
    warehouse: true
  }, 
  onToggleFeature = () => {}, 
  onSaveBranding = () => {},
  onInputChange = () => {},
  isSaving = false
}) {
  // Ensure fallbacks are always defined to prevent runtime exceptions
  const farmName = brandingData?.farm_name ?? "";
  const currency = brandingData?.currency ?? "";
  const primaryColor = brandingData?.primary_color ?? "#1E3A1E";
  const accentColor = brandingData?.accent_color ?? "#D4AF37";
  const activeFont = brandingData?.font ?? brandingData?.active_font ?? "Cairo";

  // Check if standard key exists
  const features = {
    accounting: featureFlags?.accounting ?? true,
    hr: featureFlags?.hr ?? true,
    fleet: featureFlags?.fleet ?? true,
    warehouse: featureFlags?.warehouse ?? true,
  };

  return (
    <div 
      className="w-full min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 text-right font-sans" 
      dir="rtl"
      style={{ fontFamily: `'${activeFont}', sans-serif` }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Banner / Header Section */}
        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-transparent pointer-events-none" />
          
          <div className="relative flex flex-col space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div 
                className="p-2 rounded-xl text-white transition-all duration-300"
                style={{ backgroundColor: primaryColor }}
              >
                <Settings2 className="h-6 w-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                لوحة تحكم وتخصيص السوبر أدمن (SaaS Mode)
              </h1>
              <Badge 
                variant="outline" 
                className="px-2 py-0.5 text-xs font-bold border-emerald-800/20 text-emerald-800 bg-emerald-50/50 flex items-center gap-1"
                style={{ 
                  borderColor: `${primaryColor}20`, 
                  color: primaryColor,
                  backgroundColor: `${primaryColor}08`
                }}
              >
                <Sparkles className="h-3 w-3" />
                وضع السحاب والتحكم الديناميكي
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              تخصيص الهوية البصرية، إعدادات الخطوط والثيمات، والتحكم المطلق في تشغيل وإيقاف وحدات النظام ديناميكياً.
            </p>
          </div>

          <div className="relative flex items-center gap-2 md:self-center self-start">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accentColor }}></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: accentColor }}></span>
            </span>
            <span className="text-xs font-bold text-slate-600">بوابة الإدارة المركزية</span>
          </div>
        </div>

        {/* Main Content Grid (1 col on mobile, 3 cols on large screen) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Branding Card (Col Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
              <CardHeader className="bg-slate-50/50 border-b border-slate-200/60 p-5">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" style={{ color: primaryColor }} />
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      الهوية البصرية المخصصة والسمات الملكية
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-1">
                      تعديل الهوية البصرية وشكل النظام المخصص للمزرعة الحالية بشكل فوري.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Entity name & Currency row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layout className="h-3.5 w-3.5 text-slate-400" />
                      اسم المنشأة / المزرعة
                    </label>
                    <Input 
                      value={farmName} 
                      onChange={(e) => onInputChange('farm_name', e.target.value)}
                      placeholder="أدخل اسم المزرعة أو الشركة"
                      className="text-sm h-11 border-slate-200 bg-slate-50/30 focus-visible:ring-emerald-800 transition-all rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-slate-400" />
                      العملة
                    </label>
                    <Input 
                      value={currency} 
                      onChange={(e) => onInputChange('currency', e.target.value)}
                      placeholder="مثال: جنيه مصري، ريال سعودي"
                      className="text-sm h-11 border-slate-200 bg-slate-50/30 focus-visible:ring-emerald-800 transition-all rounded-xl"
                    />
                  </div>
                </div>

                {/* Color pickers & Fonts row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  
                  {/* Primary Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">
                      اللون الأساسي (Primary)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative w-12 h-11 border border-slate-200 rounded-xl overflow-hidden shrink-0">
                        <Input 
                          type="color" 
                          value={primaryColor} 
                          onChange={(e) => onInputChange('primary_color', e.target.value)}
                          className="absolute inset-0 w-full h-full p-0 cursor-pointer border-0 rounded-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0"
                        />
                      </div>
                      <Input 
                        value={primaryColor} 
                        onChange={(e) => onInputChange('primary_color', e.target.value)}
                        placeholder="#1E3A1E"
                        className="text-xs h-11 border-slate-200 font-mono text-center rounded-xl bg-slate-50/50" 
                      />
                    </div>
                  </div>

                  {/* Secondary Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">
                      اللون الثانوي (Secondary)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative w-12 h-11 border border-slate-200 rounded-xl overflow-hidden shrink-0">
                        <Input 
                          type="color" 
                          value={accentColor} 
                          onChange={(e) => onInputChange('accent_color', e.target.value)}
                          className="absolute inset-0 w-full h-full p-0 cursor-pointer border-0 rounded-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0"
                        />
                      </div>
                      <Input 
                        value={accentColor} 
                        onChange={(e) => onInputChange('accent_color', e.target.value)}
                        placeholder="#D4AF37"
                        className="text-xs h-11 border-slate-200 font-mono text-center rounded-xl bg-slate-50/50" 
                      />
                    </div>
                  </div>

                  {/* Font Family Select */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">
                      نوع خط الكتابة
                    </label>
                    <Select 
                      value={activeFont} 
                      onValueChange={(val) => onInputChange('font', val)}
                    >
                      <SelectTrigger className="h-11 text-xs sm:text-sm border-slate-200 rounded-xl focus:ring-emerald-800">
                        <SelectValue placeholder="اختر نوع الخط" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="Cairo" className="text-right justify-end font-sans">Cairo (خط عربي نقي)</SelectItem>
                        <SelectItem value="Tajawal" className="text-right justify-end font-sans">Tajawal (عصري نحيف)</SelectItem>
                        <SelectItem value="Montserrat" className="text-right justify-end font-sans">Montserrat (للانجليزية)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Theme Visual Preview Panel (Wow Factor!) */}
                <div className="border border-slate-200/70 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">معاينة الهوية المطبقة حالياً (Live Theme Preview)</span>
                    <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-500">مباشر</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Simulated Mini Card */}
                    <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800">{farmName || "اسم المنشأة الافتراضي"}</span>
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: primaryColor }} />
                      </div>
                      <div className="h-1.5 w-2/3 bg-slate-100 rounded-full" />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">الرصيد المالي الحالي</span>
                        <span className="text-xs font-bold" style={{ color: accentColor }}>150,000 {currency || "جنيه"}</span>
                      </div>
                    </div>

                    {/* Simulated Mini UI Action */}
                    <div className="flex flex-col justify-center items-center p-3 rounded-lg border border-dashed border-slate-200 gap-2">
                      <button 
                        className="w-full text-xs font-bold py-2 px-3 rounded-md text-white transition-all"
                        style={{ backgroundColor: primaryColor }}
                      >
                        زر أساسي للنظام
                      </button>
                      <button 
                        className="w-full text-xs font-bold py-1.5 px-3 rounded-md bg-transparent border transition-all"
                        style={{ borderColor: accentColor, color: accentColor }}
                      >
                        زر ثانوي مخصص
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save button row */}
                <div className="border-t border-slate-200/80 pt-4 flex justify-end">
                  <Button 
                    className="text-white text-xs sm:text-sm h-11 px-8 font-black rounded-xl shadow-md transition-all duration-300 hover:shadow-lg active:scale-98 flex items-center gap-2 cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                    onClick={onSaveBranding}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        جاري تطبيق التغييرات...
                      </>
                    ) : (
                      <>
                        حفظ وتطبيق الهوية البصرية 💾
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Feature Toggles Card */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
              <CardHeader className="bg-slate-50/50 border-b border-slate-200/60 p-5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      تفعيل وإيقاف موديولات النظام
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-1">
                      التحكم المطلق في تشغيل وإيقاف وحدات النظام ديناميكياً.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-5 space-y-4">
                {[
                  { 
                    key: 'accounting', 
                    title: 'المنظومة المالية والحسابات', 
                    desc: 'إخفاء شاشات الدفاتر المحاسبية وفواتير المزرعة.',
                    icon: DollarSign,
                    color: 'text-emerald-600 bg-emerald-50'
                  },
                  { 
                    key: 'hr', 
                    title: 'إدارة الموارد البشرية والـ HR', 
                    desc: 'حظر كروت حضور الموظفين ومستندات رواتب العمال.',
                    icon: Users,
                    color: 'text-blue-600 bg-blue-50'
                  },
                  { 
                    key: 'fleet', 
                    title: 'أسطول الحركة والمعدات الآلية', 
                    desc: 'تعطيل عدادات تشغيل الجرارات والسيارات الوقائية.',
                    icon: Truck,
                    color: 'text-amber-600 bg-amber-50'
                  },
                  { 
                    key: 'warehouse', 
                    title: 'المستودعات وحركات المخازن', 
                    desc: 'قفل تتبع المواد والأسمدة الحالية والعهد.',
                    icon: Warehouse,
                    color: 'text-purple-600 bg-purple-50'
                  }
                ].map(item => {
                  const IconComponent = item.icon;
                  const isChecked = features[item.key];
                  
                  return (
                    <div 
                      key={item.key} 
                      className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 hover:shadow-xs group ${
                        isChecked 
                          ? 'border-slate-200 bg-white' 
                          : 'border-slate-100 bg-slate-50/40 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3 ml-4">
                        <div className={`p-2 rounded-xl shrink-0 ${item.color} group-hover:scale-105 transition-transform duration-200`}>
                          <IconComponent className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-slate-900">
                            {item.title}
                          </span>
                          <span className="text-[10px] leading-relaxed text-slate-400 block max-w-[200px]">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center justify-center">
                        <Switch 
                          checked={isChecked} 
                          onCheckedChange={(checked) => onToggleFeature(item.key, checked)}
                          className="data-[state=checked]:bg-emerald-800"
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Informational Notice (Clean & Minimalist Alert) */}
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 flex gap-3 text-right">
              <div className="text-amber-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-800">تنويه هام للسوبر أدمن</h4>
                <p className="text-[10px] text-amber-700/80 leading-relaxed">
                  تغيير حالة التفعيل للوحدات ينسحب فوراً على واجهة كافة المستخدمين للمزرعة المحددة، ويقيد الوصول البرمجي لتلك الموديولات عبر الباك-إند تلقائياً.
                </p>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
