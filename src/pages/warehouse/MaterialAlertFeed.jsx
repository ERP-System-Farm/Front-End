import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BellRing, Check, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";

export default function MaterialAlertFeed() {
  const [alerts, setAlerts] = useState([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState([]); // System catalog
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMappings, setSelectedMappings] = useState({});
  const [actioningId, setActioningId] = useState(null);

  const fetchAlertsAndMaterials = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch alerts
      const alertsRes = await api.get('/warehouse/alerts/');
      const alertsData = alertsRes.data.results || alertsRes.data;
      setAlerts(Array.isArray(alertsData) ? alertsData : []);

      // 2. Fetch warehouse items catalog
      const itemsRes = await api.get('/warehouse/items/');
      const itemsData = itemsRes.data.results || itemsRes.data;
      setWarehouseMaterials(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      console.error("Error fetching alert feed data:", err);
      setAlerts([]);
      setWarehouseMaterials([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsAndMaterials();
  }, []);

  const resolveAlert = async (alertId) => {
    const mappedMaterialId = selectedMappings[alertId];
    if (!mappedMaterialId) return;

    setActioningId(alertId);
    try {
      await api.patch(`/warehouse/alerts/${alertId}/resolve/`, {
        mapped_material: mappedMaterialId
      });

      // Remove resolved alert from local state
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error("Error resolving material alert:", err);
    } finally {
      setActioningId(null);
    }
  };

  const handleSelectChange = (alertId, itemId) => {
    setSelectedMappings(prev => ({
      ...prev,
      [alertId]: itemId
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-slate-200 shadow-md bg-white rounded-2xl overflow-hidden" dir="rtl">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-reverse space-x-3">
            <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl shadow-sm">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-800">إشارات وتنبيهات المواد الميدانية</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                التحقق الفوري وربط الأسمدة والمبيدات المدخلة يدوياً بالمواد المعتمدة في المستودعات.
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAlertsAndMaterials} 
            disabled={isLoading}
            className="rounded-xl border-slate-200 text-slate-700 font-bold bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ml-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-sm text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <span>جاري تحميل طلبات الربط والمعاينة...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <div className="bg-slate-100 text-slate-400 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-slate-500" />
            </div>
            <span className="font-semibold text-slate-500">لا توجد طلبات ربط معلقة حالياً في المزرعة.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => {
              const isResolved = alert.is_resolved;
              const isSelected = !!selectedMappings[alert.id];
              const isButtonLoading = actioningId === alert.id;

              return (
                <div 
                  key={alert.id} 
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border rounded-2xl bg-amber-50/20 border-amber-100 hover:border-amber-200 transition-colors gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span className="font-extrabold text-slate-800 text-sm sm:text-base">{alert.suggested_name}</span>
                      <Badge variant="outline" className="text-[10px] sm:text-xs bg-white text-amber-700 border-amber-200 font-bold px-2 py-0.5 rounded-lg">
                        {alert.source_report_type === 'irrigation' ? 'تقرير ري' : 'تقرير مكافحة'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <span>بواسطة: <strong className="text-slate-600">{alert.engineer_name || 'مهندس ميداني'}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>تاريخ الطلب: {alert.created_at ? new Date(alert.created_at).toLocaleDateString('ar-EG') : '-'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <Select onValueChange={(val) => handleSelectChange(alert.id, val)} value={selectedMappings[alert.id] || ""}>
                      <SelectTrigger className="w-64 h-10 bg-white text-xs sm:text-sm border-slate-200 rounded-xl focus:ring-emerald-500">
                        <SelectValue placeholder="ربط مع مادة معتمدة في المخزن..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-lg">
                        {warehouseMaterials.map(m => (
                          <SelectItem key={m.id} value={m.id} className="text-right text-xs sm:text-sm cursor-pointer hover:bg-slate-50">
                            {m.name} ({m.category === 'pesticides' ? 'مبيد' : m.category === 'fertilizers' ? 'سماد' : 'آخر'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button 
                      onClick={() => resolveAlert(alert.id)}
                      disabled={!isSelected || isButtonLoading}
                      className={`h-10 rounded-xl font-bold px-5 text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm ${
                        isSelected 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      {isButtonLoading ? 'جاري الربط...' : 'اعتماد وربط'}
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
