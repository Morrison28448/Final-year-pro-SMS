import { useAuth } from '../../context/AuthContext'
import SchoolAdminDashboard from './SchoolAdminDashboard'
import TeacherDashboard     from './TeacherDashboard'
import StudentDashboard     from './StudentDashboard'
import ParentDashboard      from './ParentDashboard'

const DashboardHome = () => {
  const { user } = useAuth()

  switch (user?.role) {
    case 'school_admin': return <SchoolAdminDashboard />
    case 'teacher':      return <TeacherDashboard />
    case 'student':      return <StudentDashboard />
    case 'parent':       return <ParentDashboard />
    default:             return <GenericDashboard user={user} />
  }
}

const GenericDashboard = ({ user }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.first_name} 👋</h2>
    <p className="text-gray-500 text-sm mt-1">Dashboard</p>
  </div>
)

export default DashboardHome
