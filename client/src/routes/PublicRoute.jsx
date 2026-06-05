import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_HOME } from '../utils/constants'

const PublicRoute = () => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner-ring" />
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
