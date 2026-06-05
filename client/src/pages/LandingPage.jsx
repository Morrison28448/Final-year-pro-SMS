import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { ROLE_HOME } from '../utils/constants'

// ── Typewriter hook ───────────────────────────────────────────────────────────
const useTypewriter = (words, speed = 80, pause = 2200) => {
  const [text, setText]       = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = words[wordIdx % words.length]
    const delay   = deleting ? speed / 2 : speed

    const timer = setTimeout(() => {
      if (!deleting) {
        setText(current.slice(0, charIdx + 1))
        if (charIdx + 1 === current.length) {
          setTimeout(() => setDeleting(true), pause)
        } else {
          setCharIdx((i) => i + 1)
        }
      } else {
        setText(current.slice(0, charIdx - 1))
        if (charIdx - 1 === 0) {
          setDeleting(false)
          setCharIdx(0)
          setWordIdx((i) => i + 1)
        } else {
          setCharIdx((i) => i - 1)
        }
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [text, charIdx, deleting, wordIdx, words, speed, pause])

  return text
}

// ── Animated counter hook ─────────────────────────────────────────────────────
const useCounter = (target, duration = 1800, trigger = false) => {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!trigger) return
    let start = null
    const easeOut = (t) => 1 - Math.pow(1 - t, 3)
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.round(easeOut(p) * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [trigger, target, duration])
  return val
}

// ── Intersection observer hook ────────────────────────────────────────────────
const useInView = (threshold = 0.15) => {
  const ref  = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ── School search ─────────────────────────────────────────────────────────────
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
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer.current)
  }, [query, search])
  return { query, setQuery, results, loading }
}

// ── Particle canvas ───────────────────────────────────────────────────────────
const ParticleCanvas = () => {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const N = 55
    const dots = Array.from({ length: N }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r:  Math.random() * 2 + 1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      dots.forEach((d) => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0) d.x = canvas.width
        if (d.x > canvas.width)  d.x = 0
        if (d.y < 0) d.y = canvas.height
        if (d.y > canvas.height) d.y = 0

        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99,102,241,0.25)'
        ctx.fill()
      })

      // Draw connecting lines
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${0.15 * (1 - dist / 130)})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

// ── Data ──────────────────────────────────────────────────────────────────────
const WORDS = ['Your Students', 'Your Teachers', 'Your Parents', 'Your School']

const STATS = [
  { value: 500,   label: 'Schools Onboarded', suffix: '+',  icon: '🏫' },
  { value: 50000, label: 'Active Students',   suffix: '+',  icon: '🎓' },
  { value: 99,    label: 'Uptime Guarantee',  suffix: '%',  icon: '⚡' },
  { value: 24,    label: 'Support Hours',     suffix: '/7', icon: '🛡️' },
]

const FEATURES = [
  { icon: '🎓', title: 'Student Management',  desc: 'Enrol, track and manage every student. Admission numbers, class assignments, guardian info — all in one place.',  color: 'blue' },
  { icon: '👨‍🏫', title: 'Teacher Portal',      desc: 'Dedicated dashboard for teachers. Mark attendance, enter exam scores and view their class rosters instantly.',    color: 'purple' },
  { icon: '✅', title: 'Attendance Tracking', desc: 'One-click bulk attendance marking with instant statistics, trends and parent-ready reports.',                       color: 'green' },
  { icon: '📝', title: 'Exams & Results',     desc: 'Create exams, enter scores, auto-compute grades and publish results — with class rankings and averages.',         color: 'yellow' },
  { icon: '🔒', title: 'Secure Access',       desc: 'Role-based access control. Every user sees only what they need — nothing more.',                                   color: 'red' },
  { icon: '📊', title: 'Live Analytics',      desc: 'Real-time dashboards for admins. Attendance rates, exam averages and subscription health at a glance.',            color: 'indigo' },
]

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100',   text: 'text-blue-600',   border: 'group-hover:border-blue-200',   glow: 'group-hover:shadow-blue-100' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100', text: 'text-purple-600', border: 'group-hover:border-purple-200', glow: 'group-hover:shadow-purple-100' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100',  text: 'text-green-600',  border: 'group-hover:border-green-200',  glow: 'group-hover:shadow-green-100' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100', text: 'text-yellow-600', border: 'group-hover:border-yellow-200', glow: 'group-hover:shadow-yellow-100' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100',    text: 'text-red-600',    border: 'group-hover:border-red-200',    glow: 'group-hover:shadow-red-100' },
  indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-100', text: 'text-indigo-600', border: 'group-hover:border-indigo-200', glow: 'group-hover:shadow-indigo-100' },
}

const ROLES = [
  { role: 'school_admin', label: 'School Admin', desc: 'Full school management',    icon: '🏫', grad: 'from-blue-500 to-blue-700',    glow: 'hover:shadow-blue-200' },
  { role: 'teacher',      label: 'Teacher',      desc: 'Classes, attendance, exams', icon: '👨‍🏫', grad: 'from-purple-500 to-purple-700', glow: 'hover:shadow-purple-200' },
  { role: 'student',      label: 'Student',      desc: 'Results & attendance',       icon: '🎓', grad: 'from-green-500 to-emerald-600', glow: 'hover:shadow-green-200' },
]

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ value, label, suffix, icon, trigger }) => {
  const count = useCounter(value, 1800, trigger)
  return (
    <div className="text-center group">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-blue-200 text-sm font-medium mt-1 tracking-wide">{label}</div>
    </div>
  )
}

// ── Main landing page ─────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_HOME[user.role] || '/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const typed = useTypewriter(WORDS, 75, 2000)
  const [statsRef, statsInView] = useInView(0.3)
  const [featRef,  featInView]  = useInView(0.1)
  const [heroRef,  heroInView]  = useInView(0.1)

  const { query, setQuery, results, loading: searching } = useSchoolSearch()
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [dropdownOpen, setDropdownOpen]     = useState(false)
  const [showRoles, setShowRoles]           = useState(false)
  const dropRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selectSchool = (school) => {
    setSelectedSchool(school)
    setQuery(school.name)
    setDropdownOpen(false)
    setShowRoles(false)
  }

  const handleContinue = () => {
    if (!selectedSchool) { inputRef.current?.focus(); return }
    setShowRoles(true)
    setTimeout(() => {
      document.getElementById('role-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }

  const goLogin = (role) => {
    navigate(`/login?schoolId=${selectedSchool.id}&schoolName=${encodeURIComponent(selectedSchool.name)}&role=${role}`)
  }

  return (
    <div className="min-h-screen bg-[#060612] text-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#060612]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 blur-sm opacity-70" />
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-sm">S</div>
            </div>
            <span className="font-black text-base tracking-tight">SMS<span className="text-indigo-400"> Platform</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden sm:block text-sm text-white/50 hover:text-white transition-colors"
            >
              Find My School
            </button>
            <a
              href="/super-admin/login"
              className="relative group px-4 py-2 text-sm font-semibold rounded-xl overflow-hidden"
            >
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="relative">Admin Login</span>
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

        {/* Particle field */}
        <div className="absolute inset-0">
          <ParticleCanvas />
        </div>

        {/* Radial gradient glow */}
        <div className="absolute inset-0 bg-gradient-radial from-indigo-900/30 via-transparent to-transparent" />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/6 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl animate-orb-slow" />
        <div className="absolute bottom-1/4 right-1/6 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl animate-orb-slow" style={{ animationDelay: '-4s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />

        <div className={`relative z-10 max-w-5xl mx-auto px-5 text-center transition-all duration-1000 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Live badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-10 backdrop-blur-sm"
            style={{ animation: 'fadeSlide 0.8s ease both' }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Live on 500+ schools across Africa
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6"
            style={{ animation: 'fadeSlide 0.8s 0.1s ease both' }}>
            <span className="block text-white">One Platform</span>
            <span className="block text-white">for</span>
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                {typed}
              </span>
              <span className="inline-block w-0.5 h-[0.8em] bg-indigo-400 ml-1 animate-blink align-middle" />
            </span>
          </h1>

          <p className="text-white/50 text-lg sm:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-light"
            style={{ animation: 'fadeSlide 0.8s 0.2s ease both' }}>
            Attendance, results, billing and communication — all in one beautiful dashboard.
            Built for African schools.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
            style={{ animation: 'fadeSlide 0.8s 0.3s ease both' }}>
            <button
              onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative px-8 py-4 rounded-2xl text-base font-bold overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
              <span className="relative flex items-center justify-center gap-2">
                Find My School
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>

            <a href="/super-admin/login"
              className="group px-8 py-4 rounded-2xl text-base font-semibold border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200 flex items-center justify-center gap-2">
              Register a School
              <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Role pills */}
          <div className="flex flex-wrap justify-center gap-3" style={{ animation: 'fadeSlide 0.8s 0.4s ease both' }}>
            {[
              { icon: '🏫', label: 'School Admins' },
              { icon: '👨‍🏫', label: 'Teachers' },
              { icon: '🎓', label: 'Students' },
              { icon: '👨‍👩‍👧', label: 'Parents' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm backdrop-blur-sm hover:bg-white/10 hover:text-white/80 transition-all cursor-default">
                <span>{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 text-xs">
          <span>Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent animate-scroll-line" />
        </div>
      </section>

      {/* ── School Search ──────────────────────────────────────── */}
      <section id="search-section" className="relative py-32 px-5 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060612] via-indigo-950/20 to-[#060612]" />

        <div className="relative max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
              🔍 School Finder
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Find Your School
            </h2>
            <p className="text-white/40 text-base">
              Search for your school to access the student and teacher portal.
            </p>
          </div>

          {/* Search card */}
          <div className="relative">
            {/* Card glow */}
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-20 blur-xl" />

            <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">

              <div className="relative" ref={dropRef}>
                <label className="block text-sm font-semibold text-white/70 mb-3 tracking-wide">
                  School Name
                </label>

                <div className="relative group">
                  {/* Input glow on focus */}
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-focus-within:opacity-50 blur transition-opacity duration-300" />

                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-white/30 z-10">
                      {searching
                        ? <div className="w-5 h-5 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
                        : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                      }
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setSelectedSchool(null); setDropdownOpen(true); setShowRoles(false) }}
                      onFocus={() => setDropdownOpen(true)}
                      placeholder="Start typing your school name…"
                      className="relative w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
                    />
                  </div>

                  {/* Dropdown */}
                  {dropdownOpen && query.trim() && (
                    <div className="absolute top-full mt-2 left-0 right-0 z-30 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d20] backdrop-blur-xl shadow-2xl shadow-black/50"
                      style={{ animation: 'dropIn 0.2s ease both' }}>
                      {results.length === 0 && !searching ? (
                        <div className="px-5 py-8 text-center">
                          <p className="text-3xl mb-2">🏫</p>
                          <p className="text-sm font-semibold text-white/70">No schools found</p>
                          <p className="text-xs text-white/30 mt-1">Is your school registered yet?</p>
                        </div>
                      ) : (
                        <ul className="max-h-60 overflow-y-auto">
                          {results.map((school, i) => (
                            <li key={school.id} style={{ animation: `fadeSlide 0.2s ${i * 0.05}s ease both` }}>
                              <button
                                onClick={() => selectSchool(school)}
                                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors text-left group"
                              >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg">
                                  {school.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                                    {school.name}
                                  </p>
                                  {school.email && <p className="text-xs text-white/30 truncate">{school.email}</p>}
                                </div>
                                <svg className="w-4 h-4 text-white/20 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected school */}
              {selectedSchool && (
                <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl border border-green-500/20 bg-green-500/5"
                  style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                    {selectedSchool.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-green-300 truncate">{selectedSchool.name}</p>
                    <p className="text-xs text-green-500/60">✓ School selected</p>
                  </div>
                  <button onClick={() => { setSelectedSchool(null); setQuery(''); setShowRoles(false) }}
                    className="text-white/20 hover:text-white/60 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={!selectedSchool}
                className="group relative mt-6 w-full py-4 rounded-2xl text-sm font-bold overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-enabled:group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  Continue — Select Your Role
                  <svg className="w-4 h-4 group-enabled:group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Role selector */}
          {showRoles && selectedSchool && (
            <div id="role-panel" className="mt-6" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-20 blur-xl" />
                <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-lg mx-auto mb-3 shadow-lg">
                      {selectedSchool.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-base font-bold text-white">{selectedSchool.name}</p>
                    <p className="text-sm text-white/40 mt-1">Who are you logging in as?</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {ROLES.map(({ role, label, desc, icon, grad, glow }, i) => (
                      <button
                        key={role}
                        onClick={() => goLogin(role)}
                        style={{ animation: `scaleIn 0.4s ${i * 0.1}s cubic-bezier(0.34,1.56,0.64,1) both` }}
                        className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 hover:shadow-xl ${glow} transition-all duration-200 transform hover:-translate-y-1`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                          {icon}
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-white group-hover:text-white">{label}</p>
                          <p className="text-[10px] text-white/30 mt-0.5 leading-tight hidden sm:block">{desc}</p>
                        </div>
                        <svg className="w-3 h-3 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section ref={statsRef} className="relative py-24 px-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        <div className="relative max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-12">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} trigger={statsInView} />
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section ref={featRef} className="relative py-32 px-5 overflow-hidden">
        <div className="absolute inset-0 bg-[#060612]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
              ✨ Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Everything Your School Needs
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Purpose-built tools for modern African school management.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc, color }, i) => {
              const c = COLOR_MAP[color]
              return (
                <div
                  key={title}
                  className={`group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] ${c.border} ${c.glow} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-default`}
                  style={{ animation: featInView ? `fadeSlide 0.6s ${i * 0.1}s ease both` : 'none' }}
                >
                  {/* Subtle top gradient line */}
                  <div className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-white/20 transition-all`} />

                  <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                  </div>
                  <h3 className={`text-base font-bold text-white mb-2 group-hover:${c.text} transition-colors`}>{title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed group-hover:text-white/50 transition-colors">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="relative py-32 px-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060612] to-[#0a0a1e]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[400px] rounded-full bg-indigo-600/10 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-6">
            <span className="text-white">Ready to Transform</span>
            <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
              Your School?
            </span>
          </h2>
          <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto">
            Join hundreds of schools. Set up in minutes. No technical knowledge required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative px-8 py-4 rounded-2xl text-base font-bold overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                Get Started Free
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <a href="/super-admin/login"
              className="px-8 py-4 rounded-2xl text-base font-semibold border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-white/70 hover:text-white">
              Register a School
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xs">S</div>
            <span className="font-black text-sm text-white/60">SMS<span className="text-indigo-400"> Platform</span></span>
          </div>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} SMS Platform. Built for African schools.</p>
          <a href="/super-admin/login" className="text-xs text-white/20 hover:text-white/50 transition-colors">
            Admin Login →
          </a>
        </div>
      </footer>

      {/* ── Global keyframes ─────────────────────────────────────── */}
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes orb-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -20px) scale(1.05); }
          66%       { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes scroll-line {
          0%   { opacity: 0; transform: scaleY(0); transform-origin: top; }
          50%  { opacity: 1; transform: scaleY(1); transform-origin: top; }
          100% { opacity: 0; transform: scaleY(1); transform-origin: bottom; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        .animate-orb-slow { animation: orb-slow 12s ease-in-out infinite; }
        .animate-blink     { animation: blink 1s step-end infinite; }
        .animate-scroll-line { animation: scroll-line 2s ease-in-out infinite; }
        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  )
}

export default LandingPage
