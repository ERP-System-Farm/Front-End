import React, { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2, BarChart3, ClipboardList, Database } from 'lucide-react'
import { useAuth } from '../../app/AuthContext'

// Lazy loaded sub-pages
const AnalyticsDashboard = lazy(() => import('./Analytics/AnalyticsDashboard'))
const DailyTaskList = lazy(() => import('./DailyTaskReport/DailyTaskList'))
const DailyTaskForm = lazy(() => import('./DailyTaskReport/DailyTaskForm'))
const DailyTaskCard = lazy(() => import('./DailyTaskReport/DailyTaskCard'))
const DailyTaskSummary = lazy(() => import('./DailyTaskReport/DailyTaskSummary'))
const MasterDataPage = lazy(() => import('./MasterData/MasterDataPage'))

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
  </div>
)

const NAV_ITEMS = [
  { path: 'tasks',     label: 'المهام اليومية',   icon: ClipboardList, match: '/reports/tasks' },
  { path: 'master-data', label: 'البيانات الأساسية', icon: Database,   match: '/reports/master-data' },
]

const ReportsIndex = () => {
  const { user } = useAuth()
  const location = useLocation()

  const isManager = user && ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ADMIN'].includes(user.role)

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.path === 'master-data' && !isManager) return false
    return true
  })

  return (
    <div className="w-full px-4 md:px-6 py-6" dir="rtl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">نظام التقارير المتقدم</h1>
        <p className="text-sm text-slate-500 mt-1">إدارة تقارير المهام اليومية والبيانات الأساسية للمزرعة</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 flex-wrap bg-slate-100 p-1.5 rounded-xl mb-8 border border-slate-200">
        {filteredNavItems.map(item => {
          const isActive = location.pathname.startsWith(item.match)
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={`/reports/${item.path}`}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${isActive
                  ? 'bg-white shadow-sm text-emerald-700 border border-emerald-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Sub-Routes */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="tasks" replace />} />

          <Route path="tasks" element={<DailyTaskList />} />
          <Route path="tasks/new" element={<DailyTaskForm />} />
          <Route path="tasks/summary" element={<DailyTaskSummary />} />
          <Route path="tasks/:id" element={<DailyTaskCard />} />
          <Route path="tasks/:id/edit" element={<DailyTaskForm />} />



          <Route 
            path="master-data" 
            element={isManager ? <MasterDataPage /> : <Navigate to="/reports/tasks" replace />} 
          />

          {/* Legacy redirects */}
          <Route path="custom-fields" element={<Navigate to="/reports/master-data" replace />} />
          <Route path="irrigation" element={<Navigate to="/reports/tasks" replace />} />
          <Route path="fertilization" element={<Navigate to="/reports/tasks" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default ReportsIndex
