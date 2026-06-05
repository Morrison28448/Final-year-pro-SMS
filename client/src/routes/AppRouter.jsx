import { Routes, Route, Navigate } from 'react-router-dom'

import PublicRoute    from './PublicRoute'
import ProtectedRoute from './ProtectedRoute'

// Layouts
import DashboardLayout from '../layouts/DashboardLayout'

// Public pages
import LandingPage         from '../pages/LandingPage'
import LoginPage           from '../pages/auth/LoginPage'
import SuperAdminLoginPage from '../pages/auth/SuperAdminLoginPage'

// Shared dashboard pages
import DashboardHome  from '../pages/dashboard/DashboardHome'
import Unauthorized   from '../pages/Unauthorized'
import NotFound       from '../pages/NotFound'

// Super admin pages
import SuperAdminDashboard   from '../pages/super-admin/SuperAdminDashboard'
import SuperAdminSchoolsPage from '../pages/super-admin/SuperAdminSchoolsPage'
import SuperAdminUsersPage   from '../pages/super-admin/SuperAdminUsersPage'
import SuperAdminBillingPage from '../pages/super-admin/SuperAdminBillingPage'

// School admin pages
import StudentsPage    from '../pages/students/StudentsPage'
import AttendancePage  from '../pages/attendance/AttendancePage'
import ExamsPage       from '../pages/exams/ExamsPage'
import TermsPage       from '../pages/exams/TermsPage'
import ScoreEntryPage  from '../pages/exams/ScoreEntryPage'
import TerminalReportPage from '../pages/exams/TerminalReportPage'
import BillingPage     from '../pages/billing/BillingPage'
import TeachersPage    from '../pages/teachers/TeachersPage'
import AcademicsPage   from '../pages/academics/AcademicsPage'
import AcademicYearPage from '../pages/academics/AcademicYearPage'
import SettingsPage    from '../pages/settings/SettingsPage'
import ParentAttendancePage from '../pages/parent/ParentAttendancePage'
import ParentResultsPage    from '../pages/parent/ParentResultsPage'

const AppRouter = () => (
  <Routes>
    {/* ── Public routes ─────────────────────────────────────── */}
    <Route element={<PublicRoute />}>
      {/* Animated landing page with school search */}
      <Route path="/"                   element={<LandingPage />} />
      {/* Role-aware login (receives ?schoolId&schoolName&role from landing) */}
      <Route path="/login"              element={<LoginPage />} />
      {/* Super admin has its own separate login page */}
      <Route path="/super-admin/login"  element={<SuperAdminLoginPage />} />
    </Route>

    {/* Legacy portal redirect → landing */}
    <Route path="/portal"   element={<Navigate to="/" replace />} />
    <Route path="/register" element={<Navigate to="/" replace />} />

    {/* ── Protected: super_admin only ───────────────────────── */}
    <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/schools"   element={<SuperAdminSchoolsPage />} />
        <Route path="/super-admin/users"     element={<SuperAdminUsersPage />} />
        <Route path="/super-admin/billing"   element={<SuperAdminBillingPage />} />
        <Route path="/super-admin/settings"  element={<SettingsPage />} />
      </Route>
    </Route>

    {/* ── Protected: school staff & students ───────────────── */}
    <Route element={<ProtectedRoute allowedRoles={['school_admin', 'teacher', 'student', 'parent']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard"             element={<DashboardHome />} />
        <Route path="/students"              element={<StudentsPage />} />
        <Route path="/teachers"              element={<TeachersPage />} />
        <Route path="/academics"             element={<AcademicsPage />} />
        <Route path="/academic-years"        element={<AcademicYearPage />} />
        <Route path="/attendance"            element={<AttendancePage />} />
        <Route path="/exams"                 element={<ExamsPage />} />
        <Route path="/exams/terms"           element={<TermsPage />} />
        <Route path="/exams/entry"           element={<ScoreEntryPage />} />
        <Route path="/exams/report"          element={<TerminalReportPage />} />
        <Route path="/billing"               element={<BillingPage />} />
        <Route path="/settings"              element={<SettingsPage />} />
        <Route path="/parent/attendance"     element={<ParentAttendancePage />} />
        <Route path="/parent/results"        element={<ParentResultsPage />} />
      </Route>
    </Route>

    {/* ── Utility ───────────────────────────────────────────── */}
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="*"             element={<NotFound />} />
  </Routes>
)

export default AppRouter
