import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../utils/helpers'
import { ROLE_HOME } from '../../utils/constants'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

/**
 * Dedicated login for platform super admins only.
 * Not linked from the public school portal.
 */
const SuperAdminLoginPage = () => {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)

      if (user.role !== 'super_admin') {
        setError('This login is for platform administrators only.')
        setLoading(false)
        return
      }

      const from = location.state?.from?.pathname || ROLE_HOME.super_admin
      navigate(from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <aside className="auth-panel">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <span className="text-lg font-bold text-white">E</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-white tracking-tight">EduFlow</p>
              <p className="text-xs text-indigo-200/80">Platform Administration</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
            Super Admin Access
          </h2>
          <p className="mt-3 text-sm text-indigo-100/70 leading-relaxed">
            Restricted area for platform operators. School staff and students should use the main portal.
          </p>
        </div>

        <p className="relative z-10 text-xs text-indigo-300/50">
          © {new Date().getFullYear()} EduFlow Platform
        </p>
      </aside>

      {/* Form */}
      <div className="auth-form-panel flex-1">
        <div className="auth-card">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform sign in</h1>
            <p className="text-sm text-slate-500 mt-1.5">Super administrator credentials only</p>
          </div>

          {error && <div className="alert-error mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Email address" required>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="admin@platform.com"
                autoComplete="email"
              />
            </FormField>

            <FormField label="Password" required>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </FormField>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign in to platform'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminLoginPage
