import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { getErrorMessage, getInitials } from '../../utils/helpers'
import { ROLE_HOME } from '../../utils/constants'

// ── School search with debounce ───────────────────────────────────────────────
const useSchoolSearch = () => {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  const search = useCallback(async (term) => {
    if (!term.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const { data } = await api.get('/auth/schools', { params: { search: term } })
      setResults(data.schools || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(query), 350)
    return () => clearTimeout(timer.current)
  }, [query, search])

  return { query, setQuery, results, loading }
}

// ── Role badge ────────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  school_admin: { label: 'Admin',    color: 'bg-indigo-100 text-indigo-700', icon: '🏫' },
  teacher:      { label: 'Teacher',  color: 'bg-purple-100 text-purple-700', icon: '👨‍🏫' },
  student:      { label: 'Student',  color: 'bg-blue-100 text-blue-700',     icon: '🎓' },
  parent:       { label: 'Parent',   color: 'bg-green-100 text-green-700',   icon: '👨‍👩‍👧' },
}

const PORTAL_ROLES = ['school_admin', 'teacher', 'student', 'parent']

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = ['Select School', 'Sign In']

const PortalLoginPage = () => {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [step, setStep]           = useState(0)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [dropdownOpen, setDropdownOpen]     = useState(false)
  const [form, setForm]           = useState({ email: '', password: '' })
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const dropdownRef = useRef(null)

  const { query, setQuery, results, loading: searching } = useSchoolSearch()

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectSchool = (school) => {
    setSelectedSchool(school)
    setQuery(school.name)
    setDropdownOpen(false)
    setError('')
  }

  const handleNext = () => {
    if (!selectedSchool) { setError('Please select your school first'); return }
    setError('')
    setStep(1)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)

      // Verify the user belongs to the selected school
      if (user.school_id !== selectedSchool.id) {
        setError('Your account does not belong to this school.')
        setLoading(false)
        return
      }

      // Allow school staff and families through the portal
      if (!PORTAL_ROLES.includes(user.role)) {
        setError('This portal is for school administrators, teachers, students and parents.')
        setLoading(false)
        return
      }

      const home = ROLE_HOME[user.role] || '/dashboard'
      navigate(home, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">E</div>
          <div>
            <span className="font-semibold text-slate-900 text-sm tracking-tight">EduFlow</span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">School Portal</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center gap-3 mb-4">
                {Object.values(ROLE_CONFIG).map(({ icon, color, label }) => (
                  <div key={label} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>
                    {icon}
                  </div>
                ))}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">School Portal</h1>
              <p className="text-slate-500 text-sm mt-1">
                Sign in for admins, teachers, students and parents
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition
                      ${i < step  ? 'bg-blue-600 text-white'
                      : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      :              'bg-gray-100 text-gray-400'}`}
                    >
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block
                      ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ── Step 0: Select School ──────────────────────── */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search for your school
                  </label>

                  {/* School search input */}
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value)
                          setSelectedSchool(null)
                          setDropdownOpen(true)
                        }}
                        onFocus={() => setDropdownOpen(true)}
                        placeholder="Type your school name…"
                        className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                      {/* Search / loading icon */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {searching ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Dropdown results */}
                    {dropdownOpen && query.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-56 overflow-y-auto">
                        {results.length === 0 && !searching ? (
                          <div className="px-4 py-3 text-sm text-gray-400 text-center">
                            No schools found for "{query}"
                          </div>
                        ) : (
                          results.map((school) => (
                            <button
                              key={school.id}
                              onClick={() => selectSchool(school)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left"
                            >
                              {/* School avatar */}
                              {school.logo_url ? (
                                <img src={school.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                  {school.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{school.name}</p>
                                {school.email && (
                                  <p className="text-xs text-gray-400">{school.email}</p>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected school confirmation */}
                {selectedSchool && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {selectedSchool.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-900 truncate">{selectedSchool.name}</p>
                      <p className="text-xs text-blue-600">School selected ✓</p>
                    </div>
                    <button
                      onClick={() => { setSelectedSchool(null); setQuery('') }}
                      className="text-blue-400 hover:text-blue-600 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <button
                  onClick={handleNext}
                  disabled={!selectedSchool}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* ── Step 1: Sign In ────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                {/* School context pill */}
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedSchool?.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-gray-700 truncate flex-1">{selectedSchool?.name}</p>
                  <button
                    onClick={() => { setStep(0); setError('') }}
                    className="text-xs text-blue-600 hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Role info */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
              <div key={role} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <div className="text-2xl mb-1">{cfg.icon}</div>
                <p className="text-xs font-semibold text-gray-700">{cfg.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">Portal access</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortalLoginPage
