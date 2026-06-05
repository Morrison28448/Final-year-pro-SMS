import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../utils/helpers'
import { ROLE_HOME, ROLE_LABELS } from '../../utils/constants'

const ROLE_ICONS = {
  school_admin: '🏫',
  teacher:      '👨‍🏫',
  student:      '🎓',
  parent:       '👨‍👩‍👧',
}

const ROLE_COLORS = {
  school_admin: 'from-blue-500 to-blue-600',
  teacher:      'from-purple-500 to-purple-600',
  student:      'from-green-500 to-emerald-500',
  parent:       'from-orange-500 to-orange-600',
}

const LoginPage = () => {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Pre-fill from landing page query params
  const params     = new URLSearchParams(location.search)
  const schoolId   = params.get('schoolId')
  const schoolName = params.get('schoolName') ? decodeURIComponent(params.get('schoolName')) : null
  const roleParam  = params.get('role')

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)

      // If coming from portal with a specific school, verify school matches
      if (schoolId && user.school_id && user.school_id !== schoolId) {
        setError('Your account does not belong to this school.')
        setLoading(false)
        return
      }

      const from = location.state?.from?.pathname || ROLE_HOME[user.role] || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const role    = roleParam || 'school_admin'
  const roleIcon  = ROLE_ICONS[role]  || '🔑'
  const roleLabel = ROLE_LABELS[role] || 'User'
  const roleGrad  = ROLE_COLORS[role] || 'from-blue-500 to-blue-600'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">

      {/* Top bar */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <span className="font-bold text-gray-800 text-sm">SMS Platform</span>
        </Link>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition">
          ← Back to Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

            {/* Role header */}
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleGrad} flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg`}>
                {roleIcon}
              </div>

              {schoolName && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs text-blue-700 font-medium mb-3">
                  <span className="font-bold">{schoolName}</span>
                </div>
              )}

              <h1 className="text-2xl font-black text-gray-900">
                {roleLabel} Login
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Enter your credentials to continue
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoFocus
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-xs font-medium"
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 bg-gradient-to-r ${roleGrad} text-white text-sm font-bold rounded-xl hover:shadow-lg transform enabled:hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2`}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? 'Signing in…' : `Sign in as ${roleLabel}`}
              </button>
            </form>

            {/* Back to school selection */}
            <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
              {schoolName && (
                <Link
                  to={`/?q=${encodeURIComponent(schoolName)}`}
                  className="block text-sm text-blue-600 hover:underline"
                >
                  ← Switch role or school
                </Link>
              )}
              <Link to="/" className="block text-xs text-gray-400 hover:text-gray-600 transition">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
