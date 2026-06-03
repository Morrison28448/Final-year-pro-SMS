import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true) // true while rehydrating from localStorage

  // ── Rehydrate session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser  = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  // ── Role helpers ────────────────────────────────────────────────────────────
  const isSuperAdmin  = user?.role === 'super_admin'
  const isSchoolAdmin = user?.role === 'school_admin'
  const isTeacher     = user?.role === 'teacher'
  const isStudent     = user?.role === 'student'
  const isParent      = user?.role === 'parent'

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
    isSuperAdmin,
    isSchoolAdmin,
    isTeacher,
    isStudent,
    isParent,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Custom hook ─────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}

export default AuthContext
