import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_HOME } from '../utils/constants'

/**
 * Redirects already-authenticated users away from public pages (login, register).
 * Sends them to their role-specific dashboard.
 */
const PublicRoute = () => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    const home = ROLE_HOME[user?.role] || '/dashboard'
    return <Navigate to={home} replace />
  }

  return <Outlet />
}

export default PublicRoute
