import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_HOME } from '../utils/constants'
import Button from '../components/ui/Button'

const Unauthorized = () => {
  const { user } = useAuth()
  const home = ROLE_HOME[user?.role] || '/dashboard'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access denied</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          You don&apos;t have permission to view this page.
        </p>
        <Link to={home}>
          <Button variant="primary">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

export default Unauthorized
