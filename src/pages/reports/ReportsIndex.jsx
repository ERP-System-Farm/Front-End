import React, { lazy, Suspense } from 'react'

import AssignmentIcon from '@mui/icons-material/Assignment'
import QueryStatsIcon from '@mui/icons-material/QueryStats'
import ScienceIcon from '@mui/icons-material/Science'
import SettingsIcon from '@mui/icons-material/Settings'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import { Box, CircularProgress, Paper, Tab, Tabs, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'

// Lazy loaded sub-pages
const AnalyticsDashboard = lazy(() => import('./Analytics/AnalyticsDashboard'))
const DailyTaskList = lazy(() => import('./DailyTaskReport/DailyTaskList'))
const DailyTaskForm = lazy(() => import('./DailyTaskReport/DailyTaskForm'))
const DailyTaskCard = lazy(() => import('./DailyTaskReport/DailyTaskCard'))
const DailyTaskSummary = lazy(() => import('./DailyTaskReport/DailyTaskSummary'))

// Legacy silos removed

const CustomFieldsManager = lazy(() => import('./CustomFields/CustomFieldsManager'))

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <CircularProgress sx={{ color: '#16a34a' }} />
  </Box>
)

const ReportsIndex = () => {
  const { t } = useTranslation()
  const location = useLocation()

  // Determine current tab based on pathname
  const currentTab = () => {
    if (location.pathname.includes('/reports/analytics')) return 0
    if (location.pathname.includes('/reports/tasks')) return 1
    if (location.pathname.includes('/reports/custom-fields')) return 2
    return 0
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 4 } }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="800" color="text.primary" gutterBottom>
          {t('reports.module_title', 'نظام التقارير المتقدم')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {t(
            'reports.module_subtitle',
            'إدارة تقارير المهام اليومية، التسميد، الري، وتخصيص الحقول'
          )}
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 4,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        <Tabs
          value={currentTab()}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { fontWeight: 700, fontSize: '1rem', py: 2.5, minHeight: 64 },
            '& .Mui-selected': { color: '#16a34a' },
            '& .MuiTabs-indicator': { backgroundColor: '#16a34a', height: 3 },
          }}
        >
          <Tab
            icon={<QueryStatsIcon />}
            iconPosition="start"
            label={t('reports.tab_operations_center', 'مركز العمليات')}
            component={Link}
            to="/reports/analytics"
          />
          <Tab
            icon={<AssignmentIcon />}
            iconPosition="start"
            label={t('reports.tab_tasks', 'المهام اليومية')}
            component={Link}
            to="/reports/tasks"
          />
          <Tab
            icon={<SettingsIcon />}
            iconPosition="start"
            label={t('reports.tab_custom_fields', 'البيانات الأساسية (Master Data)')}
            component={Link}
            to="/reports/custom-fields"
          />
        </Tabs>
      </Paper>

      {/* Sub-Routes */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="analytics" replace />} />

          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="tasks" element={<DailyTaskList />} />
          <Route path="tasks/new" element={<DailyTaskForm />} />
          <Route path="tasks/summary" element={<DailyTaskSummary />} />
          <Route path="tasks/:id" element={<DailyTaskCard />} />
          <Route path="tasks/:id/edit" element={<DailyTaskForm />} />

          {/* Legacy Silos Routes Removed */}

          <Route path="custom-fields" element={<CustomFieldsManager />} />
        </Routes>
      </Suspense>
    </Box>
  )
}

export default ReportsIndex
