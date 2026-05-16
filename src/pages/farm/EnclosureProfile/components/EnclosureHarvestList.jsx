import React, { useState, useEffect } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { 
  Plus, Leaf, Scale, Search, Filter, X, User, Users, 
  NotebookTabs, Paperclip, Calendar, UserCheck, MapPin, TrendingUp 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import api from '../../../../services/api'
import dayjs from 'dayjs'
import 'dayjs/locale/ar'

const EnclosureHarvestList = ({ enclosureId }) => {
  const navigate = useNavigate()
  const [harvests, setHarvests] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [varietyFilter, setVarietyFilter] = useState('all')
  const [selectedReportId, setSelectedReportId] = useState(null)

  useEffect(() => {
    if (!enclosureId) return
    const fetchHarvests = async () => {
      setLoading(true)
      try {
        const response = await api.get(`/production/harvest-reports/?location=${enclosureId}`)
        setHarvests(response.data.results || response.data)
      } catch (error) {
        console.error('Error fetching harvest data', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHarvests()
  }, [enclosureId])

  const filteredHarvests = React.useMemo(() => {
    return harvests.filter(h => {
      const varietyName = h.variety_name || ''
      const matchSearch = searchTerm === '' || 
                         varietyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (h.supervisor_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchVariety = varietyFilter === 'all' || varietyName === varietyFilter
      return matchSearch && matchVariety
    })
  }, [harvests, searchTerm, varietyFilter])

  const varieties = React.useMemo(() => {
    const v = new Set(harvests.map(h => h.variety_name))
    return Array.from(v).filter(Boolean)
  }, [harvests])

  const totalHarvestedKg = harvests.reduce((acc, curr) => {
    let qty = parseFloat(curr.quantity) || 0
    if (curr.unit_name?.includes('طن') || curr.unit_name?.toLowerCase().includes('ton')) {
      qty *= 1000
    }
    return acc + qty
  }, 0)

  const isTon = totalHarvestedKg >= 1000
  const displayTotal = isTon ? (totalHarvestedKg / 1000).toLocaleString() : totalHarvestedKg.toLocaleString()
  const displayUnit = isTon ? 'طن' : 'كجم'

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'FINALIZED':
        return <Badge className="bg-emerald-100 text-emerald-800 border-none px-3 py-1 font-black text-[10px]">مكتمل</Badge>
      case 'PENDING':
      case 'SUBMITTED':
        return <Badge className="bg-amber-100 text-amber-800 border-none px-3 py-1 font-black text-[10px]">بانتظار الاعتماد</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] font-black">{status}</Badge>
    }
  }

  return (
    <Box>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">سجل إنتاجية المحصول</h3>
          <p className="text-sm text-slate-500 font-bold">حصر الكميات والتفاصيل التشغيلية التي تمت في هذه الحوشة.</p>
        </div>
        <Button onClick={() => navigate('/production/harvest/new')} variant="outline" className="rounded-xl gap-2 font-bold bg-white shadow-sm border-slate-200">
          <Plus className="w-4 h-4 text-emerald-600" /> تسجيل حصاد جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
           <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Scale className="w-6 h-6" />
           </div>
           <div>
              <p className="text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">إجمالي الإنتاجية الفعلية</p>
              <p className="text-2xl font-black text-emerald-700">{displayTotal} <span className="text-sm font-bold opacity-70">{displayUnit}</span></p>
           </div>
        </div>
      </div>

      {/* Internal Filter & Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="البحث بالصنف أو اسم المهندس..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 h-11 rounded-xl border-slate-200 bg-white text-sm font-bold focus:ring-emerald-500 focus:border-emerald-500"
            />
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={varietyFilter}
                onChange={(e) => setVarietyFilter(e.target.value)}
                className="w-full h-11 pr-10 pl-4 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
              >
                <option value="all">جميع الأصناف</option>
                {varieties.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {(searchTerm || varietyFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setSearchTerm('')
                  setVarietyFilter('all')
                }}
                className="h-11 w-11 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
         </div>
      </div>

      {loading ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="font-bold text-slate-400">جاري تحميل البيانات...</p>
        </div>
      ) : filteredHarvests.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Search className="w-12 h-12 text-slate-200 mx-auto" />
          <p className="font-bold text-slate-400">لا توجد تقارير حصاد مسجلة لهذه الحوشة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHarvests.map(harvest => {
            const isSelected = selectedReportId === harvest.id
            return (
              <div 
                key={harvest.id} 
                className={`bg-white border ${isSelected ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'border-slate-100'} rounded-2xl overflow-hidden transition-all group`}
              >
                {/* Header Row (Clickable) */}
                <div 
                  className="p-5 flex flex-wrap items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setSelectedReportId(isSelected ? null : harvest.id)}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                       <Leaf className="w-6 h-6" />
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                         <span className="font-black text-slate-900 text-lg">{harvest.variety_name}</span>
                         {harvest.is_partial && <Badge className="bg-orange-100 text-orange-700 border-none text-[10px] font-black">حصاد جزئي</Badge>}
                       </div>
                       <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {dayjs(harvest.harvest_date).locale('ar').format('DD MMMM YYYY')}
                       </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex flex-col items-start px-4 border-r border-slate-100">
                       <span className="text-slate-400 font-bold text-[10px] mb-1">المهندس المسؤول</span>
                       <span className="font-black text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full text-xs">
                          <UserCheck className="w-3.5 h-3.5" />
                          {harvest.supervisor_name || 'غير محدد'}
                       </span>
                    </div>
                    <div className="flex flex-col items-center px-4 border-r border-slate-100">
                       <span className="text-slate-400 font-bold text-[10px] mb-1">الكمية</span>
                       <span className="font-black text-emerald-600 flex items-center gap-1">
                          <Scale className="w-4 h-4" />
                          {parseFloat(harvest.quantity).toLocaleString()} <span className="text-xs">{harvest.unit_name}</span>
                       </span>
                    </div>
                    <div className="flex flex-col items-center px-4 border-r border-slate-100 hidden md:flex">
                       <span className="text-slate-400 font-bold text-[10px] mb-1">العمالة</span>
                       <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Users className="w-4 h-4 text-slate-400" />
                          {(parseInt(harvest.company_workers) || 0) + (parseInt(harvest.contractor_workers) || 0)}
                       </span>
                    </div>
                    <div className="flex items-center gap-4">
                       {getStatusBadge(harvest.status)}
                       <div className={`text-slate-300 transition-transform duration-300 ${isSelected ? 'rotate-180 text-emerald-600' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isSelected && (
                  <div className="bg-slate-50/50 p-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Detailed Info Card */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                        <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          البيانات التشغيلية والمسؤولية
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-xs text-slate-500 font-bold">كاتب التقرير</span>
                            <span className="text-xs font-black text-slate-900">{harvest.creator_name || '—'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-xs text-slate-500 font-bold">المقاول المسئول</span>
                            <span className="text-xs font-black text-slate-900">{harvest.contractor_name || '—'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-xs text-slate-500 font-bold">وحدة القياس</span>
                            <span className="text-xs font-black text-slate-900">{harvest.unit_name}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 font-bold">عمال الشركة</span>
                              <span className="text-sm font-black text-slate-900">{harvest.company_workers || 0}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 font-bold">عمال المقاول</span>
                              <span className="text-sm font-black text-slate-900">{harvest.contractor_workers || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Productivity & Notes Card */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                           <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm">
                              <TrendingUp className="w-4 h-4 text-blue-500" />
                              الإنتاج والملاحظات
                           </h4>
                           {harvest.notes ? (
                              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-slate-700 text-xs font-bold leading-relaxed mb-4">
                                 {harvest.notes}
                              </div>
                           ) : (
                              <p className="text-xs text-slate-400 font-bold italic mb-4">لا توجد ملاحظات مسجلة.</p>
                           )}

                           {/* Attachments */}
                           {harvest.attachments && harvest.attachments.length > 0 && (
                              <div className="space-y-2">
                                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2">المرفقات والوثائق</p>
                                 <div className="flex flex-wrap gap-2">
                                    {harvest.attachments.map(att => (
                                       <a 
                                          key={att.id} 
                                          href={att.file} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md transition-all"
                                       >
                                          <Paperclip className="w-3.5 h-3.5" />
                                          {att.file_name || 'عرض المرفق'}
                                       </a>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Box>
  )
}

export default EnclosureHarvestList
