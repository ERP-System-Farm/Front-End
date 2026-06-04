import React, { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import ErrorBoundary from '../components/ErrorBoundary'
import DashboardLayout from '../layouts/DashboardLayout'

import ProtectedRoute from './ProtectedRoute'
import FeatureGuard from './FeatureGuard'

// ─── Lazy Page Imports ───────────────────────────────────────────────────────
const Landing = lazy(() => import('../pages/public/Landing'))
const Login = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))
const UserProfile = lazy(() => import('../pages/auth/UserProfile'))
const FarmStructure = lazy(() => import('../pages/farm/FarmStructure'))
const EnclosureProfile = lazy(() => import('../pages/farm/EnclosureProfile/EnclosureDashboard'))
const InventoryLedger = lazy(() => import('../pages/warehouse/InventoryLedger'))
const MaterialAlertFeed = lazy(() => import('../pages/warehouse/MaterialAlertFeed'))
const WarehouseDetails = lazy(() => import('../pages/warehouse/WarehouseDetails'))
const FleetManager = lazy(() => import('../pages/equipment/FleetManager'))
const FinanceDashboard = lazy(() => import('../pages/accounting/FinanceDashboard'))
const HarvestManagement = lazy(() => import('../pages/production/HarvestManagement'))
const HarvestReportCreate = lazy(() => import('../pages/production/HarvestReportCreate'))
const HarvestReportEdit = lazy(() => import('../pages/production/HarvestReportEdit'))
const ReportsIndex = lazy(() => import('../pages/reports/ReportsIndex'))
const AdminControls = lazy(() => import('../pages/admin/AdminControls'))
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'))
const AnnouncementsPage = lazy(() => import('../pages/dashboard/AnnouncementsPage'))
const MediaControlCenter = lazy(() => import('../pages/dashboard/MediaControlCenter'))
const PendingApproval = lazy(() => import('../pages/auth/PendingApproval'))
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'))
const Forbidden403 = lazy(() => import('../pages/error/Forbidden403'))
const NotFound404 = lazy(() => import('../pages/error/NotFound404'))

const HRDashboard = lazy(() => import('../pages/hr/HRDashboard'))
const PayrollApproval = lazy(() => import('../pages/hr/PayrollApproval'))
const ContractorDashboard = lazy(() => import('../pages/hr/ContractorDashboard'))

// ─── Page Loader ─────────────────────────────────────────────────────────────
// Native Tailwind loader — no MUI dependency.
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg">
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: '120ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: '240ms' }} />
    </div>
  </div>
)

// ─── Routes ──────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={
          <ErrorBoundary>
            <Landing />
          </ErrorBoundary>
        }
      />
      <Route
        path="/login"
        element={
          <ErrorBoundary>
            <Login />
          </ErrorBoundary>
        }
      />
      <Route
        path="/register"
        element={
          <ErrorBoundary>
            <Register />
          </ErrorBoundary>
        }
      />
      <Route
        path="/pending-approval"
        element={
          <ErrorBoundary>
            <PendingApproval />
          </ErrorBoundary>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <ErrorBoundary>
            <ForgotPassword />
          </ErrorBoundary>
        }
      />
      <Route
        path="/403"
        element={
          <ErrorBoundary>
            <Forbidden403 />
          </ErrorBoundary>
        }
      />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/announcements"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ErrorBoundary>
                <AnnouncementsPage />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/media"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ErrorBoundary>
                <MediaControlCenter />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ErrorBoundary>
                <UserProfile />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/farm"
        element={
          <ProtectedRoute requireModule="farm">
            <DashboardLayout>
              <ErrorBoundary>
                <FarmStructure />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farm/enclosure/:id"
        element={
          <ProtectedRoute requireModule="farm">
            <DashboardLayout>
              <ErrorBoundary>
                <EnclosureProfile />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse"
        element={
          <ProtectedRoute requireModule="warehouse">
            <FeatureGuard featureKey="warehouse">
              <DashboardLayout>
                <ErrorBoundary>
                  <InventoryLedger />
                </ErrorBoundary>
              </DashboardLayout>
            </FeatureGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse/alerts"
        element={
          <ProtectedRoute requireModule="warehouse">
            <FeatureGuard featureKey="warehouse">
              <DashboardLayout>
                <ErrorBoundary>
                  <MaterialAlertFeed />
                </ErrorBoundary>
              </DashboardLayout>
            </FeatureGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse/:id"
        element={
          <ProtectedRoute requireModule="warehouse">
            <FeatureGuard featureKey="warehouse">
              <DashboardLayout>
                <ErrorBoundary>
                  <WarehouseDetails />
                </ErrorBoundary>
              </DashboardLayout>
            </FeatureGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipment"
        element={
          <ProtectedRoute requireModule="equipment">
            <FeatureGuard featureKey="fleet">
              <DashboardLayout>
                <ErrorBoundary>
                  <FleetManager />
                </ErrorBoundary>
              </DashboardLayout>
            </FeatureGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/*"
        element={
          <ProtectedRoute requireModule="reports">
            <DashboardLayout>
              <ErrorBoundary>
                <ReportsIndex />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/production"
        element={
          <ProtectedRoute requireModule="production">
            <DashboardLayout>
              <ErrorBoundary>
                <HarvestManagement />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/production/harvest/new"
        element={
          <ProtectedRoute requireModule="production">
            <DashboardLayout>
              <ErrorBoundary>
                <HarvestReportCreate />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/production/harvest/edit/:id"
        element={
          <ProtectedRoute requireModule="production">
            <DashboardLayout>
              <ErrorBoundary>
                <HarvestReportEdit />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounting"
        element={
          <ProtectedRoute requireModule="accounting">
            <FeatureGuard featureKey="accounting">
              <DashboardLayout>
                <ErrorBoundary>
                  <FinanceDashboard />
                </ErrorBoundary>
              </DashboardLayout>
            </FeatureGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr"
        element={
          <ProtectedRoute requireModule="hr">
            <FeatureGuard featureKey="hr">
              <DashboardLayout>
                <ErrorBoundary>
                  <HRDashboard />
                </ErrorBoundary>
              </DashboardLayout>
            </FeatureGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/payroll"
        element={
          <ProtectedRoute requireModule="hr">
            <FeatureGuard featureKey="hr">
              <DashboardLayout>
                <ErrorBoundary>
                  <PayrollApproval />
                </ErrorBoundary>
              </DashboardLayout>
            </FeatureGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/contractors"
        element={
          <ProtectedRoute requireModule="hr">
            <FeatureGuard featureKey="hr">
              <DashboardLayout>
                <ErrorBoundary>
                  <ContractorDashboard />
                </ErrorBoundary>
              </DashboardLayout>
            </FeatureGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requireRoles={['SUPER_ADMIN', 'OWNER', 'MANAGER']}>
            <DashboardLayout>
              <ErrorBoundary>
                <AdminControls />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route
        path="*"
        element={
          <ErrorBoundary>
            <NotFound404 />
          </ErrorBoundary>
        }
      />
    </Routes>
  </Suspense>
)

export default AppRoutes
