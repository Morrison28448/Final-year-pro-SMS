import { useModules } from '../context/ModuleContext'
import EmptyState from './ui/EmptyState'

const MODULE_LABELS = {
  attendance: 'Attendance',
  exams:      'Exams & Results',
}

/**
 * Blocks page content when the route's module is disabled for the school.
 */
const ModuleGate = ({ moduleName, children }) => {
  const { isModuleEnabled, loading } = useModules()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        Loading…
      </div>
    )
  }

  if (!isModuleEnabled(moduleName)) {
    const label = MODULE_LABELS[moduleName] || moduleName
    return (
      <EmptyState
        icon="🔒"
        title={`${label} is disabled`}
        description={`Your school administrator has turned off the ${label} module. Contact your school admin to enable it.`}
      />
    )
  }

  return children
}

export default ModuleGate
