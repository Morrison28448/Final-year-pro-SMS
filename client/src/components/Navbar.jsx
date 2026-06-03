import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getInitials, capitalize } from '../utils/helpers'
import { ROLE_LABELS } from '../utils/constants'

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left — hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition"
        aria-label="Open sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Centre — school name or app title */}
      <div className="flex-1 lg:flex-none">
        <h1 className="text-base font-semibold text-gray-800 ml-2 lg:ml-0">
          {user?.school_name || 'School Management System'}
        </h1>
      </div>

      {/* Right — user menu */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {getInitials(user?.first_name, user?.last_name)}
          </div>
          {/* Name + role (hidden on small screens) */}
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-800 leading-tight">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              {ROLE_LABELS[user?.role] || capitalize(user?.role)}
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { setDropdownOpen(false); logout() }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
