import { Link } from 'react-router-dom'

const FEATURES = [
  { title: 'Unified dashboard', desc: 'Manage students, staff, and academics in one place.' },
  { title: 'Real-time insights', desc: 'Track attendance, exams, and school performance.' },
  { title: 'Role-based access', desc: 'Secure portals for admins, teachers, students, and parents.' },
]

const AuthLayout = ({ children, title, subtitle }) => (
  <div className="min-h-screen flex">
    {/* Brand panel */}
    <aside className="auth-panel">
      <div className="relative z-10">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <span className="text-lg font-bold text-white">E</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white tracking-tight">EduFlow</p>
            <p className="text-xs text-indigo-200/80">School Management Platform</p>
          </div>
        </Link>
      </div>

      <div className="relative z-10 space-y-8 max-w-sm">
        <div>
          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
            Modern tools for modern schools
          </h2>
          <p className="mt-3 text-sm text-indigo-100/70 leading-relaxed">
            Streamline operations, empower educators, and keep families connected.
          </p>
        </div>
        <ul className="space-y-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-white">{f.title}</p>
                <p className="text-xs text-indigo-200/60 mt-0.5">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs text-indigo-300/50">
        © {new Date().getFullYear()} EduFlow. All rights reserved.
      </p>
    </aside>

    {/* Form panel */}
    <div className="auth-form-panel flex-1">
      <div className="auth-card">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>}
            {subtitle && <p className="text-sm text-slate-500 mt-1.5">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  </div>
)

export default AuthLayout
