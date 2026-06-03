import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useModules } from '../context/ModuleContext'
import { MODULE_ROUTES } from '../utils/constants'

// ── Nav items per role ────────────────────────────────────────────────────────
const NAV_ITEMS = {
  super_admin: [
    { label: 'Dashboard', to: '/super-admin/dashboard', icon: '🏠' },
    { label: 'Schools',   to: '/super-admin/schools',   icon: '🏫' },
    { label: 'Users',     to: '/super-admin/users',     icon: '👥' },
    { label: 'Billing',   to: '/super-admin/billing',   icon: '💳' },
    { label: 'Settings',  to: '/super-admin/settings',  icon: '⚙️' },
  ],
  school_admin: [
    { label: 'Dashboard',  to: '/dashboard',   icon: '🏠' },
    { label: 'Students',   to: '/students',    icon: '🎓' },
    { label: 'Teachers',   to: '/teachers',    icon: '👨‍🏫' },
    { label: 'Academics',  to: '/academics',   icon: '📚' },
    { label: 'Attendance', to: '/attendance',  icon: '✅', module: 'attendance' },
    { label: 'Exams',      to: '/exams',       icon: '📝', module: 'exams' },
    { label: 'Billing',    to: '/billing',     icon: '💳' },
    { label: 'Settings',   to: '/settings',    icon: '⚙️' },
  ],
  teacher: [
    { label: 'Dashboard',  to: '/dashboard',   icon: '🏠' },
    { label: 'Students',   to: '/students',    icon: '🎓' },
    { label: 'Attendance', to: '/attendance',  icon: '✅', module: 'attendance' },
    { label: 'Exams',      to: '/exams',       icon: '📝', module: 'exams' },
    { label: 'Settings',   to: '/settings',    icon: '⚙️' },
  ],
  student: [
    { label: 'Dashboard',  to: '/dashboard',   icon: '🏠' },
    { label: 'Settings',   to: '/settings',    icon: '⚙️' },
  ],
  parent: [
    { label: 'Dashboard',  to: '/dashboard',         icon: '🏠' },
    { label: 'Attendance', to: '/parent/attendance', icon: '✅', module: 'attendance' },
    { label: 'Results',    to: '/parent/results',    icon: '📝', module: 'exams' },
    { label: 'Settings',   to: '/settings',          icon: '⚙️' },
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
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-30
          flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-auto
        `}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-semibold text-sm tracking-wide">SMS Platform</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-gray-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 py-3 border-t border-gray-700 shrink-0">
          <p className="text-xs text-gray-500 text-center">© 2024 SMS Platform</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
