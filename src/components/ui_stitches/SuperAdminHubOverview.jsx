import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Database, 
  BellRing, 
  Activity, 
  HardDriveDownload, 
  Users, 
  CheckCircle2, 
  Server, 
  Clock, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  ChevronLeft
} from "lucide-react";

export default function SuperAdminHubOverview({
  onNavigatePortal = () => {},
  stats = {
    activeUsers: 42,
    maxUsers: 50,
    dbStoragePercent: 45,
    dbStorageGB: "4.5 / 10 GB",
    backupStatus: "secure" // secure, warning, error
  }
}) {
  return (
    <div 
      className="w-full min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 text-right font-sans" 
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header Section */}
        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-transparent pointer-events-none" />
          
          <div className="relative flex flex-col space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-2 rounded-xl text-white bg-[#1E3A1E]">
                <Server className="h-6 w-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                مركز إدارة السوبر أدمن المركزية
              </h1>
              <Badge 
                variant="outline" 
                className="px-2 py-0.5 text-xs font-bold border-[#1E3A1E]/20 text-[#1E3A1E] bg-[#1E3A1E]/5 flex items-center gap-1"
              >
                بوابة المطور الأساسية
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              شاشة التحكم في إعدادات المنظومة الشاملة، تخصيص الهوية البصرية، النسخ الاحتياطي وإدارة البيانات الأساسية.
            </p>
          </div>

          <div className="relative flex items-center gap-2 md:self-center self-start bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Clock className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-[11px] font-bold text-slate-600">آخر فحص للنظام: منذ دقيقتين</span>
          </div>
        </div>

        {/* Section 1: System Health Overview */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardHeader className="bg-slate-50/60 border-b border-slate-200/60 p-5">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#1E3A1E]" />
              <CardTitle className="text-base font-bold text-slate-900">
                نظرة عامة وصحة النظام (System Health)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Stat 1: Active Users */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 block">المستخدمين النشطين</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-950">
                    {stats.activeUsers} <span className="text-xs text-slate-400 font-normal">/ {stats.maxUsers}</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              {/* Stat 2: DB Storage */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">استهلاك قاعدة البيانات</span>
                  <span className="text-xs font-bold text-slate-700">{stats.dbStoragePercent}%</span>
                </div>
                
                {/* Custom Progress Bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-[#1E3A1E] rounded-full transition-all duration-500" 
                    style={{ width: `${stats.dbStoragePercent}%` }}
                  />
                </div>
                
                <span className="text-[10px] text-slate-400 font-bold block">{stats.dbStorageGB} مستخدم حالياً</span>
              </div>

              {/* Stat 3: Backup Status */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 block">حالة الأرشيف والنسخ الاحتياطي</span>
                  <div className="pt-0.5">
                    {stats.backupStatus === "secure" ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-0.5 px-2 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3" />
                        آمن ومحدث
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-0.5 px-2 flex items-center gap-1 w-fit">
                        تنبيه معلق
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800">
                  <HardDriveDownload className="h-5 w-5" />
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Section 2: The Control Portals (Grid of 5 Cards) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#1E3A1E]" />
            <h2 className="text-lg font-black text-slate-900">بوابات التحكم والإعدادات المركزية</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <Card 
              onClick={() => onNavigatePortal("branding")}
              className="border-slate-200 shadow-2xs hover:shadow-md hover:border-[#1E3A1E]/40 transition-all duration-300 bg-white cursor-pointer group rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#1E3A1E]/5 text-[#1E3A1E] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Palette className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-950 group-hover:text-[#1E3A1E] transition-colors">
                    الهوية وتفعيل الموديولات
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    تخصيص الألوان، اسم المزرعة، وتشغيل/إيقاف أنظمة الـ HR والحسابات والأسطول.
                  </p>
                </div>
              </CardContent>
              <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold group-hover:bg-[#1E3A1E]/5 group-hover:text-[#1E3A1E] transition-all">
                <span>فتح شاشة التخصيص</span>
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Card 2 */}
            <Card 
              onClick={() => onNavigatePortal("master_data")}
              className="border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-500/40 transition-all duration-300 bg-white cursor-pointer group rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Database className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-950 group-hover:text-blue-600 transition-colors">
                    البيانات الأساسية (Master Data)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    إدارة القوائم المنسدلة، فئات العمالة، المواد، المحاصيل، والقطاعات الجغرافية.
                  </p>
                </div>
              </CardContent>
              <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <span>إدارة الجداول الرئيسية</span>
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Card 3 */}
            <Card 
              onClick={() => onNavigatePortal("permissions")}
              className="border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-500/40 transition-all duration-300 bg-white cursor-pointer group rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-55/5 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BellRing className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-950 group-hover:text-amber-600 transition-colors">
                    مصفوفة الصلاحيات والإشعارات
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    التحكم في أدوار المستخدمين وتخصيص من يتلقى إشعارات النظام.
                  </p>
                </div>
              </CardContent>
              <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                <span>تعديل الصلاحيات والمصفوفة</span>
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Card 4 */}
            <Card 
              onClick={() => onNavigatePortal("audit")}
              className="border-slate-200 shadow-2xs hover:shadow-md hover:border-purple-500/40 transition-all duration-300 bg-white cursor-pointer group rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-950 group-hover:text-purple-600 transition-colors">
                    سجل المراقبة والعمليات (Audit Trail)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    مراقبة كل الحركات، الفواتير، والعمليات الميدانية مع نظام أرشفة متقدم.
                  </p>
                </div>
              </CardContent>
              <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold group-hover:bg-purple-50 group-hover:text-purple-600 transition-all">
                <span>استعراض سجلات المراقبة</span>
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Card 5 */}
            <Card 
              onClick={() => onNavigatePortal("backup")}
              className="border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 bg-white cursor-pointer group rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <HardDriveDownload className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-950 group-hover:text-emerald-600 transition-colors">
                    النسخ الاحتياطي والأرشفة
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    تصدير قاعدة البيانات (Excel/JSON) وأرشفة البيانات القديمة يدوياً أو تلقائياً.
                  </p>
                </div>
              </CardContent>
              <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                <span>إجراء نسخ احتياطي</span>
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}
