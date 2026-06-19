import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { getErrorMessage } from '../../utils/helpers'

const SchoolRegistrationPage = () => {
  const navigate = useNavigate()
  
  const [form, setForm] = useState({
    schoolName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  })
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await api.post('/auth/register', form)
      setSuccess(true)
      setTimeout(() => {
        navigate('/')
      }, 3000)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060612] font-sans p-5">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Registration Successful!</h2>
          <p className="text-white/60 mb-6">
            Your school has been registered. You can now use the school finder on the home page to log in as a School Admin.
          </p>
          <p className="text-sm text-indigo-400 animate-pulse">Redirecting to home page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#060612] font-sans">
      
      {/* ── Left Decorative Panel ── */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12">
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
            Join the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">future of education.</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Create an account for your school and get access to powerful management tools instantly.
          </p>
          
          <div className="mt-8 space-y-4">
             <div className="flex items-center gap-3 text-white/80">
               <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">✓</div>
               <span>Centralized Student Management</span>
             </div>
             <div className="flex items-center gap-3 text-white/80">
               <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">✓</div>
               <span>Automated Exam Grading</span>
             </div>
             <div className="flex items-center gap-3 text-white/80">
               <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">✓</div>
               <span>Real-time Attendance Tracking</span>
             </div>
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-sm">
          © {new Date().getFullYear()} SMS Platform. Built for African schools.
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto bg-[#0a0a1a]">
        
        {/* Mobile background orbs */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px]" />
           <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-xl relative z-10 my-8">
          
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black">
              S
            </div>
            <span className="font-black text-xl text-white tracking-tight">SMS Platform</span>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />

            <div className="relative z-10 text-center mb-8">
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                Register Your School
              </h1>
              <p className="text-white/50 text-sm">
                Fill in the details below to onboard your school and create an admin account.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-3 backdrop-blur-md">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {/* School Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider border-b border-white/10 pb-2">School Details</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">School Name</label>
                  <input
                    type="text"
                    name="schoolName"
                    value={form.schoolName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Greenfield Academy"
                    className="w-full px-5 py-3.5 bg-[#060612]/50 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Admin Details */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider border-b border-white/10 pb-2">Admin Account Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      placeholder="Admin First Name"
                      className="w-full px-5 py-3.5 bg-[#060612]/50 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Admin Last Name"
                      className="w-full px-5 py-3.5 bg-[#060612]/50 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="admin@school.com"
                      className="w-full px-5 py-3.5 bg-[#060612]/50 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+234..."
                      className="w-full px-5 py-3.5 bg-[#060612]/50 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className="w-full px-5 py-3.5 bg-[#060612]/50 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all backdrop-blur-sm"
                  />
                  <p className="text-xs text-white/30 mt-2">
                    This will be your School Admin password. Please keep it safe.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold rounded-xl overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:shadow-indigo-500/25"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading && (
                      <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {loading ? 'Registering School...' : 'Register School'}
                  </span>
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-3 relative z-10">
              <Link to="/" className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchoolRegistrationPage
