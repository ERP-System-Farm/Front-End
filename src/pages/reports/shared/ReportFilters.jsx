import React from 'react';
import { FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ReportFilters = ({ filters, onFilterChange, options = {} }) => {
  const operations = options.operations || [];
  const engineers = options.engineers || [];
  const locations = options.locations || [];

  const handleChange = (name, value) => {
    onFilterChange({ ...filters, [name]: value });
  };

  const handleClear = () => {
    onFilterChange({
      start_date: '',
      end_date: '',
      operation: '',
      engineer: '',
      location: '',
      sector: '',
      engineer_name: '',
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-xl p-5 mb-8" dir="rtl">
      <h3 className="font-bold text-slate-800 mb-4">فلاتر التقارير</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-end">
        
        {/* تاريخ البدء */}
        <div>
          <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">تاريخ البدء</Label>
          <Input
            type="date"
            className="h-10 border-slate-200 focus-visible:ring-emerald-600"
            value={filters.start_date || ''}
            onChange={(e) => handleChange('start_date', e.target.value)}
          />
        </div>

        {/* تاريخ الانتهاء */}
        <div>
          <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">تاريخ الانتهاء</Label>
          <Input
            type="date"
            className="h-10 border-slate-200 focus-visible:ring-emerald-600"
            value={filters.end_date || ''}
            onChange={(e) => handleChange('end_date', e.target.value)}
          />
        </div>

        {/* العملية */}
        {operations.length > 0 && (
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">العملية</Label>
            <Select value={filters.operation?.toString() || 'all'} onValueChange={(val) => handleChange('operation', val === 'all' ? '' : val)}>
              <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-600 bg-white" dir="rtl">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">الكل</SelectItem>
                {operations.map((op) => (
                  <SelectItem key={op.id} value={op.id.toString()}>{op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* المهندس (Dropdown) */}
        {engineers.length > 0 && (
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">المهندس</Label>
            <Select value={filters.engineer?.toString() || 'all'} onValueChange={(val) => handleChange('engineer', val === 'all' ? '' : val)}>
              <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-600 bg-white" dir="rtl">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">الكل</SelectItem>
                {engineers.map((eng) => (
                  <SelectItem key={eng.id} value={eng.id.toString()}>{eng.name || eng.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* المهندس (Text) - For Irrigation/Fertilization */}
        {(!engineers || engineers.length === 0) && Object.prototype.hasOwnProperty.call(filters, 'engineer_name') && (
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">اسم المهندس</Label>
            <Input
              type="text"
              placeholder="ابحث بالاسم"
              className="h-10 border-slate-200 focus-visible:ring-emerald-600"
              value={filters.engineer_name || ''}
              onChange={(e) => handleChange('engineer_name', e.target.value)}
            />
          </div>
        )}

        {/* القطاع (Text) - For Irrigation */}
        {Object.prototype.hasOwnProperty.call(filters, 'sector') && (
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">رقم القطاع</Label>
            <Input
              type="text"
              placeholder="مثال: 12"
              className="h-10 border-slate-200 focus-visible:ring-emerald-600"
              value={filters.sector || ''}
              onChange={(e) => handleChange('sector', e.target.value)}
            />
          </div>
        )}

        {/* مسح الفلاتر */}
        <div className="flex-grow">
          <Button
            variant="outline"
            onClick={handleClear}
            className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
          >
            <FilterX className="w-4 h-4 ml-2" />
            مسح
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ReportFilters;
