import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wrench, ShieldAlert } from "lucide-react";

export default function FleetAlertsFeed({ alerts, onResolve }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-3 duration-300" dir="rtl">
      <div className="flex items-center space-x-reverse space-x-2 text-amber-800 font-bold text-sm mb-1 px-1">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <span>تنبيهات الصيانة الوقائية العاجلة والأسطول</span>
      </div>
      {alerts.map(alert => (
        <Alert key={alert.id} variant="destructive" className="bg-amber-50/90 border-amber-200 text-amber-900 flex justify-between items-center p-3.5 rounded-xl shadow-sm">
          <div className="flex items-start space-x-reverse space-x-3">
            <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg mt-0.5"><Wrench className="h-4 w-4" /></div>
            <div>
              <AlertTitle className="text-xs font-bold text-amber-950">تجاوز حد التشغيل المسموح</AlertTitle>
              <AlertDescription className="text-[11px] text-amber-800 mt-0.5 font-medium">{alert.alert_message}</AlertDescription>
            </div>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium h-8 rounded-lg" onClick={() => onResolve(alert.id)}>
            تأكيد إجراء الصيانة 🛠️
          </Button>
        </Alert>
      ))}
    </div>
  );
}
