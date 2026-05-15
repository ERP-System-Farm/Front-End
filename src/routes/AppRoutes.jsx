import React, { lazy, Suspense } from 'react'

import { CircularProgress } from '@mui/material'
import { Route, Routes } from 'react-router-dom'

import ErrorBoundary from '../components/ErrorBoundary'
import DashboardLayout from '../layouts/DashboardLayout'

import ProtectedRoute from './ProtectedRoute'

// ─── Lazy Page Imports ───────────────────────────────────────────────────────
const Landing = lazy(() => import('../pages/public/Landing'))
const Login = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))
const UserProfile = lazy(() => import('../pages/auth/UserProfile'))
const FarmStructure = lazy(() => import('../pages/farm/FarmStructure'))
const EnclosureProfile = lazy(() => import('../pages/farm/EnclosureProfile/EnclosureDashboard'))
const PalmRecords = lazy(() => import('../pages/palm/PalmRecords'))
const OliveRecords = lazy(() => import('../pages/olive/OliveRecords'))
const InventoryLedger = lazy(() => import('../pages/warehouse/InventoryLedger'))
const FleetManager = lazy(() => import('../pages/equipment/FleetManager'))
const FinanceDashboard = lazy(() => import('../pages/accounting/FinanceDashboard'))
const HarvestManagement = lazy(() => import('../pages/production/HarvestManagement'))
const HarvestReportCreate = lazy(() => import('../pages/production/HarvestReportCreate'))
const ReportsIndex = lazy(() => import('../pages/reports/ReportsIndex'))
const AdminControls = lazy(() => import('../pages/admin/AdminControls'))
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'))
const PendingApproval = lazy(() => import('../pages/auth/PendingApproval'))
const Forbidden403 = lazy(() => import('../pages/error/Forbidden403'))
const NotFound404 = lazy(() => import('../pages/error/NotFound404'))

// ─── Page Loader ─────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <CircularProgress sx={{ color: '#16a34a' }} />
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
        path="/palm"
        element={
          <ProtectedRoute requireModule="palm">
            <DashboardLayout>
              <ErrorBoundary>
                <PalmRecords />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/olive"
        element={
          <ProtectedRoute requireModule="olive">
            <DashboardLayout>
              <ErrorBoundary>
                <OliveRecords />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse"
        element={
          <ProtectedRoute requireModule="warehouse">
            <DashboardLayout>
              <ErrorBoundary>
                <InventoryLedger />
              </ErrorBoundary>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipment"
        element={
          <ProtectedRoute requireModule="equipment">
            <DashboardLayout>
              <ErrorBoundary>
                <FleetManager />
              </ErrorBoundary>
            </DashboardLayout>
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
        path="/accounting"
        element={
          <ProtectedRoute requireModule="accounting">
            <DashboardLayout>
              <ErrorBoundary>
                <FinanceDashboard />
              </ErrorBoundary>
            </DashboardLayout>
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
