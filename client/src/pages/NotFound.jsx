import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface">
    <div className="text-center max-w-md">
      <p className="text-7xl font-bold text-slate-200 mb-2 tabular-nums">404</p>
      <h1 className="text-xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary">Go to sign in</Button>
      </Link>
    </div>
  </div>
)

export default NotFound
