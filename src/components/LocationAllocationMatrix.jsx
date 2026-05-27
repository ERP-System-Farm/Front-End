import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, UserCheck, Users, Briefcase } from 'lucide-react';

export default function LocationAllocationMatrix({ enclosures, contractors = [], onChange, hideProductivity = false }) {
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [expandedLocations, setExpandedLocations] = useState({});

  // Sort contractors by name to match backend services.py sorting order
  const sortedContractors = useMemo(() => {
    return [...contractors].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [contractors]);

  const contractorAName = sortedContractors[0]?.name || 'مقاول أ';
  const contractorBName = sortedContractors[1]?.name || 'مقاول ب';

  const toggleLocation = (loc) => {
    const exists = selectedLocations.find(item => item.id === loc.id);
    let updated;
    if (exists) {
      updated = selectedLocations.filter(item => item.id !== loc.id);
      const newExpanded = { ...expandedLocations };
      delete newExpanded[loc.id];
      setExpandedLocations(newExpanded);
    } else {
      updated = [...selectedLocations, {
        id: loc.id, 
        name: loc.name, 
        phase: loc.phase || loc.parent_name || 'الأولى',
        workers_company: 0, 
        workers_contractor_a: 0, 
        workers_contractor_b: 0,
        show_contractor_a: false,
        show_contractor_b: false,
        productivity: 0,
        notes: ''
      }];
      setExpandedLocations({ ...expandedLocations, [loc.id]: true });
    }
    setSelectedLocations(updated);
    if (onChangeRef.current) {
      const totalProd = updated.reduce((sum, item) => sum + (parseFloat(item.productivity) || 0), 0);
      onChangeRef.current(updated, totalProd);
    }
  };

  const toggleExpand = (id) => {
    setExpandedLocations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const updateAllocation = (id, field, value) => {
    const updated = selectedLocations.map(loc => {
      if (loc.id === id) {
        return { ...loc, [field]: field === 'notes' ? value : (parseFloat(value) || 0) };
      }
      return loc;
    });
    setSelectedLocations(updated);
    if (onChangeRef.current) {
      const totalProd = updated.reduce((sum, item) => sum + (parseFloat(item.productivity) || 0), 0);
      onChangeRef.current(updated, totalProd);
    }
  };

  const toggleContractorVisibility = (id, type, show) => {
    const updated = selectedLocations.map(loc => {
      if (loc.id === id) {
        if (type === 'a') {
          return { 
            ...loc, 
            show_contractor_a: show, 
            workers_contractor_a: show ? loc.workers_contractor_a : 0 
          };
        } else if (type === 'b') {
          return { 
            ...loc, 
            show_contractor_b: show, 
            workers_contractor_b: show ? loc.workers_contractor_b : 0 
          };
        }
      }
      return loc;
    });
    setSelectedLocations(updated);
    if (onChangeRef.current) {
      const totalProd = updated.reduce((sum, item) => sum + (parseFloat(item.productivity) || 0), 0);
      onChangeRef.current(updated, totalProd);
    }
  };

  // Compute absolute dynamic productivity accumulation
  const totalProductivity = selectedLocations.reduce((sum, loc) => sum + loc.productivity, 0);

  // Sync onChange handler in a ref to avoid infinite rendering loops
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync selected locations with available enclosures prop
  useEffect(() => {
    const availableIds = new Set(enclosures.map(enc => String(enc.id)));
    setSelectedLocations(prev => {
      const valid = prev.filter(loc => availableIds.has(String(loc.id)));
      if (valid.length !== prev.length) {
        if (onChangeRef.current) {
          const totalProd = valid.reduce((sum, item) => sum + (parseFloat(item.productivity) || 0), 0);
          onChangeRef.current(valid, totalProd);
        }
        return valid;
      }
      return prev;
    });
  }, [enclosures]);

  return (
    <Card className="w-full border-slate-200/80 shadow-md bg-white rounded-2xl overflow-hidden" dir="rtl">
      <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-b border-slate-100 p-4">
        <CardTitle className="text-base font-bold text-slate-800 flex justify-between items-center flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            توزيع الموارد والعمالة والإنتاجية للمواقع (الأحواش)
          </span>
          {!hideProductivity && (
            <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 font-extrabold shadow-sm">
              إجمالي الإنتاجية: {totalProductivity}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        
        {/* Enclosure Selection Grid */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-600 block mb-2">اختر الأحواش المشمولة في العملية:</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {enclosures.map(enc => {
              const isChecked = selectedLocations.some(item => item.id === enc.id);
              return (
                <div 
                  key={enc.id} 
                  className={`flex items-center space-x-reverse space-x-3 border p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isChecked 
                      ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' 
                      : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  onClick={() => toggleLocation(enc)}
                >
                  <input 
                    type="checkbox"
                    id={`enc-${enc.id}`} 
                    checked={isChecked} 
                    onChange={() => toggleLocation(enc)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4.5 w-4.5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-2 accent-emerald-600 cursor-pointer"
                  />
                  <Label 
                    className="text-xs cursor-pointer font-bold text-slate-700 select-none flex flex-col gap-0.5"
                  >
                    <span>{enc.name}</span>
                    {enc.parent_name && <span className="text-[10px] text-slate-400 font-normal">({enc.parent_name})</span>}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsible Forms for Selected Enclosures */}
        {selectedLocations.length > 0 && (
          <div className="space-y-3 mt-4">
            <Label className="text-xs font-bold text-slate-600 block mb-2">تفاصيل توزيع العمالة والإنتاجية للمواقع المختارة:</Label>
            
            {selectedLocations.map(loc => {
              const isExpanded = !!expandedLocations[loc.id];
              const showContractorA = !!(loc.show_contractor_a || loc.workers_contractor_a > 0);
              const showContractorB = !!(loc.show_contractor_b || loc.workers_contractor_b > 0);
              return (
                <div key={loc.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  
                  {/* Collapsible Header */}
                  <div 
                    onClick={() => toggleExpand(loc.id)}
                    className="flex justify-between items-center p-3.5 bg-slate-50/70 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">{loc.name}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium">مرحلة {loc.phase}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Summary Badges */}
                      <span className="text-[10px] text-slate-500 font-medium hidden sm:inline-flex gap-1.5 items-center">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        العمالة: {(loc.workers_company + loc.workers_contractor_a + loc.workers_contractor_b)}
                      </span>
                      {!hideProductivity && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                          الإنتاجية: {loc.productivity}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Collapsible Body */}
                  {isExpanded && (
                    <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
                      
                      {/* Company Workers */}
                      <div className="flex flex-col gap-1.5 justify-end w-full">
                        <Label className="text-[11px] font-bold text-slate-500 h-5 flex items-center gap-1 w-full select-none" title="عدد عمال الشركة">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">عدد عمال الشركة</span>
                        </Label>
                        <Input 
                          type="number" 
                          className="text-xs h-9 w-full" 
                          min="0"
                          value={loc.workers_company || ''} 
                          placeholder="0"
                          onChange={(e) => updateAllocation(loc.id, 'workers_company', e.target.value)} 
                        />
                      </div>

                      {/* Contractor A Workers */}
                      {showContractorA && (
                        <div className="flex flex-col gap-1.5 justify-end w-full">
                          <Label className="text-[11px] font-bold text-slate-500 h-5 flex items-center justify-between w-full select-none" title={`عمال مقاول: ${contractorAName}`}>
                            <span className="flex items-center gap-1 truncate">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">عمال مقاول: {contractorAName}</span>
                            </span>
                            <button 
                              type="button"
                              onClick={() => toggleContractorVisibility(loc.id, 'a', false)}
                              className="text-red-500 hover:text-red-700 transition-colors text-[10px] font-bold px-1"
                              title="إزالة المقاول"
                            >
                              إزالة
                            </button>
                          </Label>
                          <Input 
                            type="number" 
                            className="text-xs h-9 w-full" 
                            min="0"
                            value={loc.workers_contractor_a || ''} 
                            placeholder="0"
                            onChange={(e) => updateAllocation(loc.id, 'workers_contractor_a', e.target.value)} 
                          />
                        </div>
                      )}

                      {/* Contractor B Workers */}
                      {showContractorB && (
                        <div className="flex flex-col gap-1.5 justify-end w-full">
                          <Label className="text-[11px] font-bold text-slate-500 h-5 flex items-center justify-between w-full select-none" title={`عمال مقاول: ${contractorBName}`}>
                            <span className="flex items-center gap-1 truncate">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">عمال مقاول: {contractorBName}</span>
                            </span>
                            <button 
                              type="button"
                              onClick={() => toggleContractorVisibility(loc.id, 'b', false)}
                              className="text-red-500 hover:text-red-700 transition-colors text-[10px] font-bold px-1"
                              title="إزالة المقاول"
                            >
                              إزالة
                            </button>
                          </Label>
                          <Input 
                            type="number" 
                            className="text-xs h-9 w-full" 
                            min="0"
                            value={loc.workers_contractor_b || ''} 
                            placeholder="0"
                            onChange={(e) => updateAllocation(loc.id, 'workers_contractor_b', e.target.value)} 
                          />
                        </div>
                      )}

                      {/* Dropdown to assign contractor */}
                      {(!showContractorA || !showContractorB) && (
                        <div className="flex flex-col gap-1.5 justify-end w-full">
                          <Label className="text-[11px] font-bold text-slate-500 h-5 flex items-center gap-1 w-full select-none">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>إسناد مقاول عمالة</span>
                          </Label>
                          <select
                            onChange={(e) => {
                              toggleContractorVisibility(loc.id, e.target.value, true);
                              e.target.value = ""; // Reset dropdown selection
                            }}
                            defaultValue=""
                            className="text-xs h-9 w-full border border-slate-200 rounded-xl px-2 bg-white focus:ring-emerald-500 focus:border-emerald-500 shadow-sm text-slate-500 font-bold"
                          >
                            <option value="" disabled>+ اختر مقاول لإضافته...</option>
                            {!showContractorA && sortedContractors[0] && (
                              <option value="a">{sortedContractors[0].name}</option>
                            )}
                            {!showContractorB && sortedContractors[1] && (
                              <option value="b">{sortedContractors[1].name}</option>
                            )}
                          </select>
                        </div>
                      )}

                      {/* Enclosure Productivity */}
                      {!hideProductivity && (
                        <div className="flex flex-col gap-1.5 justify-end w-full">
                          <Label className="text-[11px] font-bold text-emerald-600 h-5 flex items-center gap-1 w-full select-none" title="الإنتاجية للموقع">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="truncate">الإنتاجية للموقع</span>
                          </Label>
                          <Input 
                            type="number" 
                            className="text-xs h-9 w-full border-emerald-200 focus-visible:ring-emerald-400" 
                            min="0.0"
                            step="0.1"
                            value={loc.productivity || ''} 
                            placeholder="0.0"
                            onChange={(e) => updateAllocation(loc.id, 'productivity', e.target.value)} 
                          />
                        </div>
                      )}

                      {/* Notes / Comments for Enclosure */}
                      <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 mt-2">
                        <Input 
                          type="text" 
                          className="text-xs h-9" 
                          placeholder="ملاحظات تشغيلية خاصة بهذا الحوش..."
                          value={loc.notes || ''} 
                          onChange={(e) => updateAllocation(loc.id, 'notes', e.target.value)} 
                        />
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
