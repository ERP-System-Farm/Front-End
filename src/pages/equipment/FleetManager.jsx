import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FleetAlertsFeed from "@/components/fleet/FleetAlertsFeed";
import FleetRegistryTable from "./components/FleetRegistryTable";
import LogTransactionForm from "./components/LogTransactionForm";
import EquipmentProfileView from "./components/EquipmentProfileView";
import { getPendingAlerts, resolveAlert } from "../../features/equipment/services";
import { toast } from "sonner";

export default function FleetManager() {
  const [activeTab, setActiveTab] = useState("registry");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAlerts = async () => {
    try {
      const data = await getPendingAlerts();
      setAlerts(data);
    } catch (err) {
      console.error("Failed to fetch pending maintenance alerts:", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [refreshKey]);

  const viewEquipmentProfile = (id) => {
    setSelectedEquipmentId(id);
    setActiveTab("profile");
  };

  const handleResolveAlert = async (id) => {
    try {
      await resolveAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success("تم تأكيد إجراء الصيانة وحذف التنبيه بنجاح.");
      setRefreshKey(prev => prev + 1); // Refresh table and counters
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء معالجة التنبيه.");
    }
  };

  const handleTabChange = (val) => {
    setActiveTab(val);
    if (val === "registry") {
      setRefreshKey(prev => prev + 1); // Trigger refetch of registry table list
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-4 text-right" dir="rtl">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">منظومة الحركة، الأسطول والمعدات الآلية</h1>
        <p className="text-sm text-slate-500">إدارة الجرارات، المركبات والمولدات وتتبع عدادات الساعات والمسافات وجداول الصيانة الدورية.</p>
      </div>

      {/* Synchronized Twin Notification Display Area */}
      <FleetAlertsFeed alerts={alerts} onResolve={handleResolveAlert} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {activeTab !== "profile" && (
          <TabsList className="grid w-full grid-cols-2 max-w-sm h-10 bg-slate-100 p-1 rounded-xl mb-4">
            <TabsTrigger value="registry" className="rounded-lg text-xs font-semibold">سجل ومراقبة الأسطول</TabsTrigger>
            <TabsTrigger value="add-log" className="rounded-lg text-xs font-semibold">تسجيل حركة (وقود / صيانة)</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="registry" className="mt-0">
          <FleetRegistryTable key={refreshKey} onSelectProfile={viewEquipmentProfile} />
        </TabsContent>

        <TabsContent value="add-log" className="mt-0">
          <LogTransactionForm onSuccess={() => handleTabChange("registry")} />
        </TabsContent>

        <TabsContent value="profile" className="mt-0">
          {selectedEquipmentId && (
            <EquipmentProfileView 
              key={selectedEquipmentId} 
              equipmentId={selectedEquipmentId} 
              onBack={() => handleTabChange("registry")} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
