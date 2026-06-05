import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getInitials, capitalize } from '../utils/helpers'
import { ROLE_LABELS } from '../utils/constants'

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-900 truncate">
            {user?.school_name || 'School Management System'}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block truncate">
            {ROLE_LABELS[user?.role] || capitalize(user?.role)} workspace
          </p>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
            {getInitials(user?.first_name, user?.last_name)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-800 leading-tight">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              {ROLE_LABELS[user?.role] || capitalize(user?.role)}
            </p>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-56 rounded-xl py-1.5 z-50 bg-white border border-slate-200/80"
            style={{ boxShadow: 'var(--shadow-dropdown)' }}
          >
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-slate-800 truncate mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={() => { setDropdownOpen(false); logout() }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
