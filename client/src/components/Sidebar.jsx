import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useModules } from '../context/ModuleContext'
import { MODULE_ROUTES } from '../utils/constants'
import { ROLE_LABELS } from '../utils/constants'
import { NAV_ICONS } from './ui/icons'

const NAV_ITEMS = {
  super_admin: [
    { label: 'Dashboard', to: '/super-admin/dashboard', icon: 'dashboard' },
    { label: 'Schools',   to: '/super-admin/schools',   icon: 'schools' },
    { label: 'Users',     to: '/super-admin/users',     icon: 'users' },
    { label: 'Billing',   to: '/super-admin/billing',   icon: 'billing' },
    { label: 'Settings',  to: '/super-admin/settings',  icon: 'settings' },
  ],
  school_admin: [
    { label: 'Dashboard',       to: '/dashboard',      icon: 'dashboard' },
    { label: 'Students',        to: '/students',       icon: 'students' },
    { label: 'Teachers',        to: '/teachers',       icon: 'teachers' },
    { label: 'Academic Years',  to: '/academic-years', icon: 'academics' },
    { label: 'Classes',         to: '/academics',      icon: 'schools' },
    { label: 'Attendance',      to: '/attendance',     icon: 'attendance', module: 'attendance' },
    { label: 'Exams',           to: '/exams/terms',    icon: 'exams',      module: 'exams' },
    { label: 'Billing',         to: '/billing',        icon: 'billing' },
    { label: 'Settings',        to: '/settings',       icon: 'settings' },
  ],
  teacher: [
    { label: 'Dashboard',  to: '/dashboard',    icon: 'dashboard' },
    { label: 'Students',   to: '/students',     icon: 'students' },
    { label: 'Attendance', to: '/attendance',   icon: 'attendance', module: 'attendance' },
    { label: 'Exams',      to: '/exams/entry',  icon: 'exams',      module: 'exams' },
    { label: 'Settings',   to: '/settings',     icon: 'settings' },
  ],
  student: [
    { label: 'Dashboard',  to: '/dashboard',   icon: 'dashboard' },
    { label: 'Settings',   to: '/settings',    icon: 'settings' },
  ],
  parent: [
    { label: 'Dashboard',  to: '/dashboard',         icon: 'dashboard' },
    { label: 'Attendance', to: '/parent/attendance', icon: 'attendance', module: 'attendance' },
    { label: 'Results',    to: '/parent/results',    icon: 'results', module: 'exams' },
    { label: 'Settings',   to: '/settings',          icon: 'settings' },
  ],
}

const pathRequiresModule = (path) => {
  for (const [moduleName, paths] of Object.entries(MODULE_ROUTES)) {
    if (paths.some((p) => path === p || path.startsWith(`${p}/`))) {
      return moduleName
    }
  }
  return null
}

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth()
  const { isModuleEnabled, loading: modulesLoading } = useModules()

  const rawItems = NAV_ITEMS[user?.role] || []
  const navItems = rawItems.filter((item) => {
    const mod = item.module || pathRequiresModule(item.to)
    if (!mod) return true
    if (modulesLoading) return true
    return isModuleEnabled(mod)
  })

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-[260px] z-30 flex flex-col
          bg-slate-900 border-r border-slate-800/80
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <span className="text-sm font-bold text-white">E</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-white tracking-tight">EduFlow</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">SMS Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Role badge */}
        {user?.role && (
          <div className="px-4 pt-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/50">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Menu
          </p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = NAV_ICONS[item.icon] || NAV_ICONS.dashboard
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
                    }
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0 opacity-90" />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-800 shrink-0">
          <p className="text-[11px] text-slate-500 text-center">
            © {new Date().getFullYear()} EduFlow
          </p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
