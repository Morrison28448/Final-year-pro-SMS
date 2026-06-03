import { Routes, Route, Navigate } from 'react-router-dom'

import PublicRoute    from './PublicRoute'
import ProtectedRoute from './ProtectedRoute'

// Layouts
import DashboardLayout from '../layouts/DashboardLayout'

// Public pages
import LoginPage       from '../pages/auth/LoginPage'
import RegisterPage    from '../pages/auth/RegisterPage'
import PortalLoginPage from '../pages/auth/PortalLoginPage'

// Shared dashboard pages (stubs — filled in incrementally)
import DashboardHome  from '../pages/dashboard/DashboardHome'
import Unauthorized   from '../pages/Unauthorized'
import NotFound       from '../pages/NotFound'

// Super admin pages
import SuperAdminDashboard from '../pages/super-admin/SuperAdminDashboard'
import SuperAdminSchoolsPage from '../pages/super-admin/SuperAdminSchoolsPage'
import SuperAdminUsersPage from '../pages/super-admin/SuperAdminUsersPage'
import SuperAdminBillingPage from '../pages/super-admin/SuperAdminBillingPage'

// School admin pages
import StudentsPage    from '../pages/students/StudentsPage'
import AttendancePage  from '../pages/attendance/AttendancePage'
import ExamsPage       from '../pages/exams/ExamsPage'
import BillingPage     from '../pages/billing/BillingPage'
import TeachersPage    from '../pages/teachers/TeachersPage'
import AcademicsPage   from '../pages/academics/AcademicsPage'
import SettingsPage    from '../pages/settings/SettingsPage'
import ParentAttendancePage from '../pages/parent/ParentAttendancePage'
import ParentResultsPage from '../pages/parent/ParentResultsPage'

const AppRouter = () => (
  <Routes>
    {/* ── Redirect root ─────────────────────────────────────────── */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* ── Public routes (redirect if already logged in) ─────────── */}
    <Route element={<PublicRoute />}>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/portal"   element={<PortalLoginPage />} />
    </Route>

    {/* ── Protected: super_admin only ───────────────────────────── */}
    <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/schools"   element={<SuperAdminSchoolsPage />} />
        <Route path="/super-admin/users"     element={<SuperAdminUsersPage />} />
        <Route path="/super-admin/billing"   element={<SuperAdminBillingPage />} />
        <Route path="/super-admin/settings"  element={<SettingsPage />} />
      </Route>
    </Route>

    {/* ── Protected: school staff & students ───────────────────── */}
    <Route element={<ProtectedRoute allowedRoles={['school_admin', 'teacher', 'student', 'parent']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard"   element={<DashboardHome />} />
        <Route path="/students"    element={<StudentsPage />} />
        <Route path="/teachers"    element={<TeachersPage />} />
        <Route path="/academics"   element={<AcademicsPage />} />
        <Route path="/attendance"  element={<AttendancePage />} />
        <Route path="/exams"       element={<ExamsPage />} />
        <Route path="/billing"     element={<BillingPage />} />
        <Route path="/settings"    element={<SettingsPage />} />
        <Route path="/parent/attendance" element={<ParentAttendancePage />} />
        <Route path="/parent/results"    element={<ParentResultsPage />} />
      </Route>
    </Route>

    {/* ── Utility pages ─────────────────────────────────────────── */}
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="*"             element={<NotFound />} />
  </Routes>
)

export default AppRouter
