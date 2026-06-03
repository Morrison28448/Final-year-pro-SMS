import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_HOME } from '../utils/constants'

const Unauthorized = () => {
  const { user } = useAuth()
  const home = ROLE_HOME[user?.role] || '/dashboard'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">🚫</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 text-sm mb-6">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          to={home}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default Unauthorized
