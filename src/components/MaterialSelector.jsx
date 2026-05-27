import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Info } from 'lucide-react';

export default function MaterialSelector({ materials = [], label, onMaterialChange }) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");

  const handleSelectChange = (value) => {
    setSelectedValue(value);
    if (value === "custom_alternative") {
      setShowCustomInput(true);
      if (onMaterialChange) {
        onMaterialChange({ material_id: null, is_custom: true, name: "" });
      }
    } else {
      setShowCustomInput(false);
      const selected = materials.find(m => m.id === value);
      if (onMaterialChange) {
        onMaterialChange({ material_id: value, is_custom: false, name: selected?.name || "" });
      }
    }
  };

  const handleCustomInputChange = (name) => {
    if (onMaterialChange) {
      onMaterialChange({ material_id: null, is_custom: true, name });
    }
  };

  return (
    <div className="space-y-2 text-right" dir="rtl">
      <Label className="text-xs font-bold text-slate-700">{label}</Label>
      <Select onValueChange={handleSelectChange} value={selectedValue}>
        <SelectTrigger className="w-full h-10 border-slate-200 focus:ring-emerald-500 bg-white rounded-xl text-xs sm:text-sm">
          <SelectValue placeholder="اختر المادة من القائمة..." />
        </SelectTrigger>
        <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-lg">
          {materials.map(mat => (
            <SelectItem key={mat.id} value={mat.id} className="text-right text-xs sm:text-sm hover:bg-slate-50 cursor-pointer">
              {mat.name} ({mat.unit || "وحدة"})
            </SelectItem>
          ))}
          <SelectItem value="custom_alternative" className="text-amber-600 font-bold text-right text-xs sm:text-sm hover:bg-amber-50 cursor-pointer">
            <span className="flex items-center gap-1.5 justify-end">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              مادة أخرى (غير مسجلة بالمخزن)...
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {showCustomInput && (
        <div className="mt-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Input 
            type="text" 
            placeholder="اكتب اسم السماد أو المبيد الجديد بدقة..." 
            className="border-amber-300 focus-visible:ring-amber-500 focus-visible:border-amber-500 text-xs h-10 rounded-xl bg-amber-50/10 placeholder-amber-400/70"
            onChange={(e) => handleCustomInputChange(e.target.value)}
          />
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 flex gap-2.5 items-start">
            <Info className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] sm:text-xs text-amber-700 font-semibold leading-relaxed">
              سيتم إشعار مدير المخازن فوراً للتحقق من هذه المادة وربطها بالمستندات الرسمية، وتأكيد صرفها ميدانياً.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
