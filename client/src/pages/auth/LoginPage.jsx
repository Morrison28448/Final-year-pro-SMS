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

  const role      = roleParam || 'school_admin'
  const roleIcon  = ROLE_ICONS[role]  || '🔑'
  const roleLabel = ROLE_LABELS[role] || 'User'
  const roleGrad  = ROLE_COLORS[role] || 'from-blue-500 to-blue-600'

  return (
    <div className="flex min-h-screen bg-[#060612] font-sans">
      
      {/* ── Left Decorative Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a2a] via-[#1a1a4a] to-[#0f0f3a]" />
        
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        
        {/* Abstract Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30">
              S
            </div>
            <span className="font-black text-xl text-white tracking-tight">SMS<span className="text-indigo-400"> Platform</span></span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            Welcome back to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">the future of education.</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Manage attendance, track performance, and empower your institution with our state-of-the-art platform.
          </p>
          
          {/* Decorative floating card */}
          <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-sm transform -rotate-2 hover:rotate-0 transition-transform duration-500 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xl shadow-lg">📈</div>
              <div>
                <div className="text-white font-bold">System Uptime</div>
                <div className="text-white/50 text-sm">All services operational</div>
              </div>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 w-[99.9%] rounded-full" />
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-sm">
          © {new Date().getFullYear()} SMS Platform. Built for African schools.
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-[#0a0a1a]">
        
        {/* Mobile background orbs */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px]" />
           <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-[420px] relative z-10">
          
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black">
              S
            </div>
            <span className="font-black text-xl text-white tracking-tight">SMS Platform</span>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />

            <div className="relative z-10 text-center mb-8">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleGrad} flex items-center justify-center text-3xl mx-auto mb-5 shadow-[0_0_30px_rgba(0,0,0,0.3)] shadow-${roleGrad.split('-')[1]}/30 ring-1 ring-white/20`}>
                {roleIcon}
              </div>

              {schoolName && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 font-semibold mb-4 backdrop-blur-md">
                  <span>{schoolName}</span>
                </div>
              )}

              <h1 className="text-3xl font-black text-white tracking-tight">
                {roleLabel} Login
              </h1>
              <p className="text-white/40 text-sm mt-2">
                Enter your credentials to access the portal
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-3 backdrop-blur-md">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
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
                  className="w-full px-5 py-3.5 bg-[#060612]/50 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">
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
                    className="w-full px-5 py-3.5 bg-[#060612]/50 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all backdrop-blur-sm pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition text-xs font-semibold px-2 py-1 rounded-md hover:bg-white/5"
                  >
                    {showPw ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`relative w-full py-4 bg-gradient-to-r ${roleGrad} text-white text-sm font-bold rounded-xl overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl`}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading && (
                      <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {loading ? 'Authenticating...' : `Sign in as ${roleLabel}`}
                  </span>
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-3 relative z-10">
              {schoolName && (
                <Link
                  to={`/?q=${encodeURIComponent(schoolName)}`}
                  className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  ← Switch role or school
                </Link>
              )}
              <Link to="/" className="block text-xs text-white/30 hover:text-white/60 transition-colors">
                Return to Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
