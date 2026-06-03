import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { getErrorMessage } from '../../utils/helpers'

const STEPS = ['School Info', 'Admin Account', 'Review']

const RegisterPage = () => {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    // Step 0 — school
    schoolName: '',
    schoolPhone: '',
    // Step 1 — admin
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  // ── Per-step validation ───────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      if (!form.schoolName.trim()) return 'School name is required'
    }
    if (step === 1) {
      if (!form.firstName.trim())  return 'First name is required'
      if (!form.lastName.trim())   return 'Last name is required'
      if (!form.email.trim())      return 'Email is required'
      if (form.password.length < 8) return 'Password must be at least 8 characters'
      if (form.password !== form.confirmPassword) return 'Passwords do not match'
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep((s) => s + 1)
  }

  const handleBack = () => {
    setError('')
    setStep((s) => s - 1)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        schoolName: form.schoolName,
        firstName:  form.firstName,
        lastName:   form.lastName,
        email:      form.email,
        password:   form.password,
        phone:      form.schoolPhone,
      })

      // Auto-login after registration
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setStep(1) // go back to account step on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
              S
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Register your school</h1>
            <p className="text-gray-500 text-sm mt-1">
              Set up your school on the SMS platform
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${i < step  ? 'bg-blue-600 text-white'
                    : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    :              'bg-gray-100 text-gray-400'}`}
                  >
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block
                    ${i === step ? 'text-blue-600' : 'text-gray-400'}`}
                  >
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

          {/* ── Step 0: School Info ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={set('schoolName')}
                  placeholder="e.g. Greenfield Academy"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.schoolPhone}
                  onChange={set('schoolPhone')}
                  placeholder="+234 800 000 0000"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>
          )}

          {/* ── Step 1: Admin Account ───────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={set('firstName')}
                    placeholder="John"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={set('lastName')}
                    placeholder="Doe"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="admin@yourschool.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Review ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                Please review your details before submitting.
              </p>
              {[
                { label: 'School Name',  value: form.schoolName },
                { label: 'School Phone', value: form.schoolPhone || '—' },
                { label: 'Admin Name',   value: `${form.firstName} ${form.lastName}` },
                { label: 'Email',        value: form.email },
                { label: 'Password',     value: '••••••••' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Navigation buttons ──────────────────────────────── */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
              >
                ← Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Creating account…' : 'Create School Account'}
              </button>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
