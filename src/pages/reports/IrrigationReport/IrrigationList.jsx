import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Droplets, Loader2, Search } from 'lucide-react'

import { reportsApi } from '../../../services/reportsApi'
import ReportFilters from '../shared/ReportFilters'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const IrrigationList = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    sector: '',
    engineer_name: '',
  })

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      const res = await reportsApi.getIrrigations(params)
      setReports(res.data.results || res.data)
    } catch (err) {
      setError('فشل في جلب تقارير الري')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [filters])

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-600" />
            تقارير الري
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة ومتابعة تقارير الري الخاصة بالمزرعة
          </p>
        </div>
        <Link to="new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 shadow-sm">
            <Plus className="w-5 h-5 ml-2" />
            تقرير جديد
          </Button>
        </Link>
      </div>

      <ReportFilters filters={filters} onFilterChange={setFilters} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-600 font-semibold">لا توجد تقارير ري</h3>
          <p className="text-slate-400 text-sm mt-1">جرب تغيير الفلاتر أو أضف تقريراً جديداً</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table dir="rtl">
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent border-b-slate-200">
                  <TableHead className="text-right font-semibold text-slate-700 w-1/5">التاريخ</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 w-1/5">القطاع</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 w-1/5">ساعات الري</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 w-1/5">المساحة (فدان)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 w-1/5">تصرف البئر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-slate-50 border-b-slate-100 transition-colors">
                    <TableCell className="font-medium text-slate-900">{report.report_date}</TableCell>
                    <TableCell>
                      القطاع {report.sector_number} - تحويلة {report.transfer_number}
                    </TableCell>
                    <TableCell>{report.irrigation_hours} ساعة</TableCell>
                    <TableCell>{report.area_feddan}</TableCell>
                    <TableCell>{report.well_flow_m3} م³/ساعة</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

export default IrrigationList
